import { db } from '../config/prisma';
import { AppError } from '../errors/app-error';
import { HttpStatus } from '../constants/http-status';
import { snap, coreApi } from '../config/midtrans';
import { config } from '../config';
import { WithdrawalStatus } from '@prisma/client';
import axios from 'axios';

if (!process.env.XENDIT_SECRET_KEY) {
    throw new Error('XENDIT_SECRET_KEY is not defined in environment variables');
}

const xenditApi = axios.create({
    baseURL: 'https://api.xendit.co',
    headers: {
        Authorization: `Basic ${Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
    },
});

export async function calculateWithdrawalAmount(businessId: string) {
    // Hitung total dana yang bisa ditarik
    const orders = await db.order.findMany({
        where: {
            outlet: { businessId },
            paymentStatus: 'SUCCESS',
            orderStatus: 'COMPLETED'
        },
        select: {
            totalAmount: true,
            midtransFee: true,
            appFee: true,
            chargedTo: true
        }
    });

    let totalRevenue = 0;
    let totalMidtransFee = 0;
    let totalAppFee = 0;

    orders.forEach(order => {
        totalRevenue += order.totalAmount;

        // Jika owner yang menanggung fee, kurangi dari revenue
        if (order.chargedTo === 'OWNER') {
            totalMidtransFee += order.midtransFee;
            totalAppFee += order.appFee;
        }
    });

    // Dana bersih yang diterima owner
    const netRevenue = totalRevenue - totalMidtransFee - totalAppFee;

    // Minimal saldo Rp 100.000 untuk bisa withdrawal
    const minimumWithdrawalAmount = 100000;

    return {
        totalOrders: orders.length,
        grossRevenue: totalRevenue,
        midtransFeeDeducted: totalMidtransFee,
        appFeeDeducted: totalAppFee,
        netRevenue,
        canWithdraw: netRevenue >= minimumWithdrawalAmount,
        minimumWithdrawalAmount
    };
}

export async function requestWithdrawal(businessId: string, amount: number) {
    const calculation = await calculateWithdrawalAmount(businessId);

    if (!calculation.canWithdraw) {
        throw new AppError(
            `Withdrawal requires minimum balance of Rp ${calculation.minimumWithdrawalAmount.toLocaleString('id-ID')}. Current balance: Rp ${calculation.netRevenue.toLocaleString('id-ID')}`,
            HttpStatus.BAD_REQUEST
        );
    }

    if (amount > calculation.netRevenue) {
        throw new AppError(
            `Withdrawal amount (${amount}) exceeds available balance (${calculation.netRevenue})`,
            HttpStatus.BAD_REQUEST
        );
    }

    // Hitung fee withdrawal
    const withdrawalMidtransFee = 4000; // Rp 4.000 sesuai diagram
    const withdrawalAppFee = Math.round(amount * 0.02); // 2% dari amount
    const totalWithdrawalFee = withdrawalMidtransFee + withdrawalAppFee;
    const finalAmount = amount - totalWithdrawalFee;

    // Buat record withdrawal
    const withdrawal = await db.withdrawal.create({
        data: {
            businessId,
            requestedAmount: amount,
            midtransFee: withdrawalMidtransFee,
            appFee: withdrawalAppFee,
            finalAmount,
            status: 'PENDING'
        }
    });

    return {
        withdrawal,
        breakdown: {
            requestedAmount: amount,
            midtransFee: withdrawalMidtransFee,
            appFee: withdrawalAppFee,
            totalFee: totalWithdrawalFee,
            finalAmount
        }
    };
}

export async function processWithdrawal(withdrawalId: string, status: 'COMPLETED' | 'REJECTED') {
    const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
            business: true // Kita butuh info bisnis untuk rekening bank
        }
    });

    if (!withdrawal) {
        throw new AppError('Withdrawal request not found', HttpStatus.NOT_FOUND);
    }

    if (withdrawal.status !== 'PENDING') {
        throw new AppError(`Cannot process withdrawal with status ${withdrawal.status}`, HttpStatus.BAD_REQUEST);
    }

    if (status === 'REJECTED') {
        return db.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'REJECTED', processedAt: new Date() }
        });
    }

    // --- Logika Payout Dimulai ---

    const { business } = withdrawal;
    if (!business.bankAccount || !business.bankName || !business.accountHolder) {
        throw new AppError('Business bank account information is incomplete. Please update it in your business settings.', HttpStatus.BAD_REQUEST);
    }

    // Cek jika kita di environment development/sandbox
    if (!config.isProduction) {
        console.log('--- SIMULATING MIDTRANS PAYOUT (SANDBOX MODE) ---');
        console.log(`Recipient: ${business.accountHolder} (${business.bankName} - ${business.bankAccount})`);
        console.log(`Amount: Rp ${withdrawal.finalAmount.toLocaleString('id-ID')}`);
        console.log('--- SIMULATION SUCCESSFUL ---');

        // Langsung update status ke COMPLETED karena ini hanya simulasi
        return db.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'COMPLETED',
                processedAt: new Date(),
                notes: 'Simulated payout in sandbox mode.'
            }
        });
    }

    // --- Logika untuk Production ---
    try {
        // Menggunakan Core API untuk payout
        // Catatan: Payouts/Iris biasanya memerlukan integrasi khusus dan API yang berbeda
        // Implementasi berikut adalah contoh bagaimana Anda dapat menggunakannya 
        // jika Anda telah mengaktifkan fitur Midtrans Iris

        // Ambil email owner dari business relation
        const ownerEmail = await db.user.findUnique({
            where: { id: business.ownerId },
            select: { email: true }
        }).then(user => user?.email || "no-email@example.com");

        // Contoh payload untuk Pay API (harus disesuaikan dengan API yang sebenarnya digunakan)
        const payoutPayload = {
            "payment_type": "bank_transfer",
            "transaction_details": {
                "order_id": `withdrawal-${withdrawal.id}`,
                "gross_amount": withdrawal.finalAmount
            },
            "bank_transfer": {
                "bank": business.bankName?.toLowerCase() || "bca",
                "va_number": business.bankAccount
            },
            "custom_field1": `Withdrawal for ${business.name}`,
            "customer_details": {
                "first_name": business.accountHolder || "",
                "email": ownerEmail
            }
        };

        const payoutResponse = await coreApi.charge(payoutPayload);

        // Simpan ID transaksi Midtrans sebagai catatan di withdrawal
        // karena field midtransReference sepertinya belum di-migrate
        const transactionId = payoutResponse.transaction_id || `midtrans-${Date.now()}`;

        // Jika berhasil, update status ke PROCESSING (menunggu webhook)
        return db.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: "PROCESSING" as WithdrawalStatus,
                processedAt: new Date(),
                notes: `Midtrans Transaction ID: ${transactionId}`
            }
        });

    } catch (error: any) {
        console.error('Midtrans Payout Error:', error.message);
        // Jika gagal, Anda bisa menandai withdrawal sebagai FAILED
        await db.withdrawal.update({
            where: { id: withdrawalId },
            data: { status: 'REJECTED', notes: `Midtrans Payout Failed: ${error.message}` }
        });
        throw new AppError('Failed to process payout with Midtrans', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export async function handleMidtransPayoutWebhook(payload: any) {
    const { transaction_id, status_code, transaction_status } = payload;

    // Cari withdrawal berdasarkan ID transaksi Midtrans
    const withdrawal = await db.withdrawal.findFirst({
        where: {
            // Gunakan field notes untuk menyimpan ID transaksi untuk sementara
            // karena sepertinya field midtransReference belum di-migrate
            notes: { contains: transaction_id }
        }
    });

    if (!withdrawal) {
        // Mungkin ini notifikasi untuk transaksi lain, abaikan saja.
        console.warn(`Webhook received for unknown withdrawal transaction: ${transaction_id}`);
        return;
    }

    // Terjemahkan status Midtrans ke status withdrawal
    let newStatus: WithdrawalStatus = withdrawal.status;
    if (transaction_status === 'settlement' || status_code === '200') {
        newStatus = "COMPLETED" as WithdrawalStatus;
    } else if (['deny', 'cancel', 'expire', 'failure'].includes(transaction_status) || status_code === '202') {
        newStatus = "REJECTED" as WithdrawalStatus;
    }

    return db.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
            status: newStatus,
            notes: `Updated via Midtrans webhook with status: ${transaction_status || status_code}`
        }
    });
}

export async function getWithdrawalHistory(businessId: string) {
    return await db.withdrawal.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' }
    });
}

export async function processWithdrawalWithXendit(withdrawalId: string) {
    const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
            business: true
        }
    });

    if (!withdrawal) {
        throw new AppError('Withdrawal request not found', HttpStatus.NOT_FOUND);
    }

    if (withdrawal.status !== 'PENDING') {
        throw new AppError(`Cannot process withdrawal with status ${withdrawal.status}`, HttpStatus.BAD_REQUEST);
    }

    const { business } = withdrawal;
    if (!business.bankAccount || !business.bankName || !business.accountHolder) {
        throw new AppError('Business bank account information is incomplete. Please update it in your business settings.', HttpStatus.BAD_REQUEST);
    }

    try {
        // Create payout using Xendit
        const { data: payoutResponse } = await xenditApi.post('/v2/disbursements', {
            reference_id: `withdrawal-${withdrawalId}`,
            amount: withdrawal.finalAmount,
            currency: 'IDR',
            channel_code: `ID_${mapBankNameToXenditCode(business.bankName)}`,
            channel_properties: {
                account_holder_name: business.accountHolder,
                account_number: business.bankAccount
            },
            description: `Withdrawal for ${business.name}`
        });

        // Update withdrawal status
        await db.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: (payoutResponse.status === 'PENDING' ? 'PROCESSING' : 'PENDING') as WithdrawalStatus,
                processedAt: new Date(),
                notes: `Xendit Payout ID: ${payoutResponse.id}`
            }
        });

        return payoutResponse;
    } catch (error: any) {
        console.error('Xendit Payout Error:', error.message);
        await db.withdrawal.update({
            where: { id: withdrawalId },
            data: {
                status: 'REJECTED',
                notes: `Xendit Payout Failed: ${error.message}`
            }
        });
        throw new AppError('Failed to process payout with Xendit', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

// Helper function to map bank names to Xendit channel codes
function mapBankNameToXenditCode(bankName: string): string {
    const bankCodeMap: Record<string, string> = {
        'BCA': 'BCA',
        'BNI': 'BNI',
        'BRI': 'BRI',
        'MANDIRI': 'MANDIRI',
        'PERMATA': 'PERMATA',
        // Add more bank mappings as needed
    };

    const code = bankCodeMap[bankName.toUpperCase()];
    if (!code) {
        throw new AppError(`Unsupported bank: ${bankName}`, HttpStatus.BAD_REQUEST);
    }
    return code;
}

// Webhook handler for Xendit payout status updates
export async function handleXenditPayoutWebhook(payload: any, callbackToken?: string) {
    // Validate Xendit callback token
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
    if (!webhookToken || callbackToken !== webhookToken) {
        console.error('Invalid webhook token received');
        throw new AppError('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
    }

    // Validate webhook payload
    if (!payload.event || !payload.data) {
        console.warn('Invalid webhook payload received:', payload);
        return;
    }

    const { event, data } = payload;
    const { reference_id, status, id: xenditPayoutId } = data;

    // Log webhook event
    console.log(`Received Xendit webhook event: ${event}`, {
        reference_id,
        status,
        xenditPayoutId
    });

    if (!reference_id?.startsWith('withdrawal-')) {
        console.log('Not our withdrawal reference:', reference_id);
        return; // Not our withdrawal
    }

    const withdrawalId = reference_id.replace('withdrawal-', '');
    const withdrawal = await db.withdrawal.findUnique({
        where: { id: withdrawalId }
    });

    if (!withdrawal) {
        console.warn(`Webhook received for unknown withdrawal: ${withdrawalId}`);
        return;
    }

    // Map Xendit status to our status
    let newStatus: WithdrawalStatus;
    switch (status?.toUpperCase()) {
        case 'SUCCEEDED':
            newStatus = 'COMPLETED';
            break;
        case 'FAILED':
            newStatus = 'REJECTED';
            break;
        case 'PENDING':
            newStatus = 'PROCESSING' as WithdrawalStatus;
            break;
        default:
            newStatus = withdrawal.status;
    }

    return db.withdrawal.update({
        where: { id: withdrawalId },
        data: {
            status: newStatus,
            notes: `Updated via Xendit webhook. Xendit status: ${status}`
        }
    });
}
