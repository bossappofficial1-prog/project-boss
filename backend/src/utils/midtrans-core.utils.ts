import { config } from '../config';
import { OnlinePaymentChannel } from '../schemas/order.schema';
import { MidtransItem, MidtransPayload } from '../types/Others';

interface BuildPayloadOptions {
    orderId: string;
    grossAmount: number;
    itemDetails: MidtransItem[];
    customer: {
        name: string;
        phone: string;
    };
    channel?: OnlinePaymentChannel;
    paymentType?: string;
}

interface ChannelConfig {
    paymentType: 'qris' | 'bank_transfer' | 'gopay';
    bank?: 'bca';
}

const CHANNEL_MAP: Record<OnlinePaymentChannel, ChannelConfig> = {
    qris_dynamic: { paymentType: 'qris' },
    va_bca: { paymentType: 'bank_transfer', bank: 'bca' },
    ewallet_gopay: { paymentType: 'gopay' },
};

const callbackUrl = `${config.BASE_URL}/payments/callback`;

export function buildMidtransCorePayload(options: BuildPayloadOptions): MidtransPayload & Record<string, unknown> {
    const { orderId, grossAmount, itemDetails, customer } = options;

    let channelConfig: ChannelConfig | undefined;

    if (options.channel) {
        channelConfig = CHANNEL_MAP[options.channel];
    }

    if (!channelConfig && options.paymentType) {
        const normalized = options.paymentType.toLowerCase();
        if (normalized.endsWith('_va')) {
            channelConfig = { paymentType: 'bank_transfer', bank: normalized.replace('_va', '') as ChannelConfig['bank'] };
        } else if (normalized === 'qris') {
            channelConfig = { paymentType: 'qris' };
        } else if (normalized === 'gopay') {
            channelConfig = { paymentType: 'gopay' };
        }
    }

    if (!channelConfig) {
        throw new Error('Unsupported Midtrans configuration');
    }

    const payload: MidtransPayload & Record<string, unknown> = {
        transaction_details: {
            order_id: orderId,
            gross_amount: grossAmount,
        },
        customer_details: {
            first_name: customer.name,
            phone: customer.phone,
        },
        item_details: itemDetails,
        payment_type: channelConfig.paymentType,
    };

    if (channelConfig.paymentType === 'bank_transfer') {
        payload.bank_transfer = {
            bank: channelConfig.bank ?? 'bca',
        };
    }

    if (channelConfig.paymentType === 'gopay') {
        payload.gopay = {
            enable_callback: true,
            callback_url: callbackUrl,
        };
    }

    return payload;
}

export interface MidtransCoreDetail {
    channel: OnlinePaymentChannel;
    amount: number;
    currency?: string;
    expiredAt?: string;
    referenceId?: string;
    qrString?: string;
    qrUrl?: string;
    deeplinkUrl?: string;
    paymentCode?: string;
    accountName?: string;
    vaNumbers?: {
        bank: string;
        vaNumber: string;
    }[];
    instructions?: {
        title: string;
        steps: string[];
    }[];
}

function pickActionUrl(actions: Array<{ name: string; url: string }> | undefined, ...candidates: string[]) {
    if (!actions?.length) return undefined;
    for (const candidate of candidates) {
        const action = actions.find((item) => item.name === candidate);
        if (action?.url) {
            return action.url;
        }
    }
    return undefined;
}

export function normalizeMidtransCoreResponse(response: Record<string, any>, channel: OnlinePaymentChannel): MidtransCoreDetail {
    const amount = Number(response?.gross_amount ?? 0);
    const expiredAt = response?.expiry_time ? new Date(response.expiry_time).toISOString() : undefined;
    const qrUrl = pickActionUrl(response?.actions, 'generate-qr-code', 'qris-url');
    const deeplinkUrl = pickActionUrl(response?.actions, 'deeplink-redirect', 'app-redirect', 'gopay-qris');

    const vaNumbers = Array.isArray(response?.va_numbers)
        ? response.va_numbers.map((entry: Record<string, any>) => ({
            bank: entry?.bank ?? '',
            vaNumber: entry?.va_number ?? entry?.vaNumber ?? '',
        }))
        : undefined;

    const instructions = Array.isArray(response?.instructions)
        ? response.instructions.map((item: Record<string, any>) => ({
            title: item?.title ?? '',
            steps: Array.isArray(item?.steps) ? item.steps : [],
        }))
        : undefined;

    const paymentCode = response?.payment_code
        ?? response?.permata_va_number
        ?? (Array.isArray(response?.va_numbers) ? response.va_numbers[0]?.va_number : undefined);

    const accountName = response?.account_name ?? response?.accountName;

    return {
        channel,
        amount,
        currency: response?.currency ?? 'IDR',
        expiredAt,
        referenceId: response?.transaction_id ?? response?.order_id,
        qrString: response?.qr_string ?? response?.qrString,
        qrUrl,
        deeplinkUrl,
        paymentCode,
        accountName,
        vaNumbers,
        instructions,
    };
}
