import { $Enums } from "@prisma/client";

export type UserMe = {
    name: string;
    id: string;
    email: string;
    avatar: string | null;
    password: string;
    role: $Enums.UserRole;
    isVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpires: Date | null;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
    business: {
        id: string,
        name: string,
        description: string,
        outlets: Outlet[]
    }
}

export type Outlet = {
    id: string;
    name: string;
    businessId: string
}

export type MidtransWebhookPayloadType = {
    transaction_type: string //'off-us'
    transaction_time: string //'2025-08-29 14:31:10'
    transaction_status: string// 'pending',
    transaction_id: string//'8518f522-aac1-4513-83b1-36069db46ae9'
    status_message: string//'midtrans payment notification'
    status_code: string//'201',
    signature_key: string// 'c7a7613d9439f84eb8dac5364cc3cc4dad1cc9e883d59ccbe40770b0f1ff201c5cd846d6905b5410aa9e028379756def75190e548e8296badc1b2c5b008ccd85',
    payment_type: string// 'qris',
    order_id: string//'ORD2025082914318013',
    merchant_id: string// 'G036133647',
    gross_amount: string//'15750.00',
    fraud_status: string//'accept',
    expiry_time: string//'2025-08-29 14:46:09',
    currency: string// 'IDR'
}
