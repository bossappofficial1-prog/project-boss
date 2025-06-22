import axios from 'axios';
import crypto from 'crypto';
import { PaymentRequest, PaymentResponse, PaymentStatus } from '../types/payment.types';
import logger from '../utils/logger.util';
import { config } from '../configs/config';

export class PaymentService {
    private midtransServerKey: string;
    private midtransBaseUrl: string;

    constructor() {
        this.midtransServerKey = config.midtrans.MIDTRANS_SERVER_KEY!;
        this.midtransBaseUrl = config.midtrans.IS_PRODUCTION
            ? 'https://api.midtrans.com/v2'
            : 'https://api.sandbox.midtrans.com/v2';
    }

    async createPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
        try {
            const orderId = this.generateOrderId();

            const requestData = {
                transaction_details: {
                    order_id: orderId,
                    gross_amount: paymentData.amount
                },
                customer_details: paymentData.customer_details,
                item_details: paymentData.item_details,
                credit_card: {
                    secure: true
                },
                callbacks: {
                    finish: paymentData.callback_url
                }
            };

            const response = await axios.post(
                `${this.midtransBaseUrl}/charge`,
                requestData,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${Buffer.from(this.midtransServerKey + ':').toString('base64')}`
                    }
                }
            );

            logger.info('Payment created successfully', { orderId, amount: paymentData.amount });

            return {
                transaction_id: response.data.transaction_id,
                payment_url: response.data.redirect_url,
                status: this.mapMidtransStatus(response.data.transaction_status),
                amount: paymentData.amount,
                currency: paymentData.currency,
                created_at: new Date(),
                expired_at: response.data.expiry_time ? new Date(response.data.expiry_time) : undefined
            };
        } catch (error: any) {
            logger.error('Payment creation failed', { error: error.message, paymentData });
            throw new Error(`Payment creation failed: ${error.response?.data?.error_messages?.[0] || error.message}`);
        }
    }

    async getPaymentStatus(transactionId: string): Promise<PaymentResponse> {
        try {
            const response = await axios.get(
                `${this.midtransBaseUrl}/${transactionId}/status`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Basic ${Buffer.from(this.midtransServerKey + ':').toString('base64')}`
                    }
                }
            );

            return {
                transaction_id: response.data.transaction_id,
                status: this.mapMidtransStatus(response.data.transaction_status),
                amount: parseFloat(response.data.gross_amount),
                currency: 'IDR',
                created_at: new Date(response.data.transaction_time)
            };
        } catch (error: any) {
            logger.error('Get payment status failed', { error: error.message, transactionId });
            throw new Error(`Get payment status failed: ${error.message}`);
        }
    }

    verifyCallback(callbackData: any, signature: string): boolean {
        const orderId = callbackData.order_id;
        const statusCode = callbackData.status_code;
        const grossAmount = callbackData.gross_amount;

        const signatureKey = crypto
            .createHash('sha512')
            .update(orderId + statusCode + grossAmount + this.midtransServerKey)
            .digest('hex');

        return signatureKey === signature;
    }

    private generateOrderId(): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `ORDER-${timestamp}-${random}`.toUpperCase();
    }

    private mapMidtransStatus(status: string): PaymentStatus {
        switch (status) {
            case 'capture':
            case 'settlement':
                return PaymentStatus.SUCCESS;
            case 'pending':
                return PaymentStatus.PENDING;
            case 'deny':
            case 'cancel':
                return PaymentStatus.CANCELLED;
            case 'expire':
                return PaymentStatus.EXPIRED;
            case 'failure':
                return PaymentStatus.FAILED;
            default:
                return PaymentStatus.PENDING;
        }
    }
}