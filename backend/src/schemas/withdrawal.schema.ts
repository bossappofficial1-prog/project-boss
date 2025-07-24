import { z } from 'zod';

export const withdrawalRequestSchema = z.object({
    body: z.object({
        amount: z.number()
            .positive('Amount must be positive')
            .min(50000, 'Minimum withdrawal amount is Rp 50.000')
            .max(50000000, 'Maximum withdrawal amount is Rp 50.000.000')
    })
});

export const processWithdrawalSchema = z.object({
    body: z.object({
        status: z.enum(['COMPLETED', 'REJECTED'], {
            errorMap: () => ({ message: 'Status must be either COMPLETED or REJECTED' })
        })
    }),
    params: z.object({
        id: z.string().uuid('Invalid withdrawal ID format')
    })
});

export const businessParamsSchema = z.object({
    params: z.object({
        businessId: z.string().uuid('Invalid business ID format')
    })
});

export type WithdrawalRequestInput = z.infer<typeof withdrawalRequestSchema>['body'];
export type ProcessWithdrawalInput = z.infer<typeof processWithdrawalSchema>['body'];
export type BusinessParamsInput = z.infer<typeof businessParamsSchema>['params'];
