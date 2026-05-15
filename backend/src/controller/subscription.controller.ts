import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import path from "path";
import fs from "fs";
import { config } from "../config";
import { SubscriptionService } from "../service/subscription.service";
import { redis } from "../config/redis";
import { JwtUtil } from "../utils";
import { ensureString } from "../utils/request";
import { RenewSubscriptionInput } from "../schemas/subscription.schema";

// Magic numbers for image file validation
const IMAGE_MAGIC_NUMBERS = {
    'image/jpeg': ['FFD8FF'],
    'image/png': ['89504E47'],
    'image/gif': ['474946'],
    'image/webp': ['52494946'] // RIFF for WebP
};

const MAX_PROOF_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Function to get file magic number
const getFileMagicNumber = (filePath: string): string => {
    const buffer = Buffer.alloc(4);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);
    return buffer.toString('hex').toUpperCase();
};

// Enhanced file validation function
const validateProofFile = (file: Express.Multer.File): void => {
    // Check file size
    if (file.size > MAX_PROOF_IMAGE_SIZE) {
        throw new AppError('Ukuran file terlalu besar. Maksimal 5MB.', HttpStatus.BAD_REQUEST);
    }

    // Get magic number from uploaded file
    const magicNumber = getFileMagicNumber(file.path);

    // Validate magic number matches MIME type
    const expectedMagicNumbers = IMAGE_MAGIC_NUMBERS[file.mimetype as keyof typeof IMAGE_MAGIC_NUMBERS];

    if (!expectedMagicNumbers) {
        fs.unlinkSync(file.path);
        throw new AppError('Format file tidak didukung. Gunakan JPG, PNG, GIF, atau WebP.', HttpStatus.BAD_REQUEST);
    }

    // Check if magic number matches any expected patterns
    const isValidMagicNumber = expectedMagicNumbers.some(pattern =>
        magicNumber.startsWith(pattern)
    );

    if (!isValidMagicNumber) {
        fs.unlinkSync(file.path);
        throw new AppError('File header tidak sesuai dengan format gambar yang dideklarasikan.', HttpStatus.BAD_REQUEST);
    }
};

/**
 * Upload bukti transfer pembayaran langganan
 * POST /api/v1/subscription/upload-proof
 */
export const uploadPaymentProofController = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;
    const invoiceId = ensureString(req.body?.invoiceId, 'invoiceId');

    if (!file) {
        throw new AppError('File bukti transfer tidak diunggah', HttpStatus.BAD_REQUEST);
    }

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    if (!invoiceId) {
        throw new AppError('Invoice ID diperlukan', HttpStatus.BAD_REQUEST);
    }

    validateProofFile(file);

    const relativePath = path.relative(process.cwd(), file.path);
    const proofUrl = `${config.BASE_URL}/${relativePath.replace(/\\/g, '/')}`;

    let result;
    try {
        result = await SubscriptionService.uploadPaymentProof(businessId, invoiceId, proofUrl);
    } catch (error) {
        fs.unlinkSync(file.path);
        throw error;
    }

    if (req.storedUser) {
        (req.storedUser as any).subscriptionStatus = result.subscription.status;
        (req.storedUser as any).businessId = businessId;

        await redis.set(
            `session:${req.storedUser.id}`,
            JSON.stringify(req.storedUser),
            'EX',
            60 * 60 * 24
        );

        const refreshedToken = JwtUtil.generate({
            sessionId: req.storedUser.id,
            role: req.storedUser.role,
            name: req.storedUser.name,
            email: req.storedUser.email,
            provider: req.storedUser.provider ?? 'email',
            isVerified: req.storedUser.isVerified,
            businessId,
            subscriptionStatus: result.subscription.status,
            subscriptionPlan: result.subscription.plan.code,
        });

        res.cookie("token", refreshedToken, {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
    }

    return ResponseUtil.success(res, {
        message: 'Bukti transfer berhasil diunggah. Menunggu verifikasi dari admin.',
        invoice: result.invoice,
        subscription: result.subscription,
    }, HttpStatus.CREATED);
});

/**
 * Get subscription invoice details
 * GET /api/v1/subscription/invoice/:invoiceId
 */
export const getSubscriptionInvoiceController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;
    const invoiceId = ensureString(req.params?.invoiceId, 'invoiceId');

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    const invoice = await SubscriptionService.getInvoiceDetail(businessId, invoiceId as string);

    return ResponseUtil.success(res, invoice, HttpStatus.OK);
});

/**
 * Get current business subscription status
 * GET /api/v1/subscription/status
 * Also refreshes JWT cookie if subscription status changed in DB
 */
export const getSubscriptionStatusController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
        subscriptionStatus?: string;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    const status = await SubscriptionService.getSubscriptionStatus(businessId);

    // Refresh JWT if subscription status in DB differs from token
    const dbStatus = status.business.subscriptionStatus;
    const tokenStatus = storedUser?.subscriptionStatus;

    if (storedUser && dbStatus && dbStatus !== tokenStatus) {
        const refreshedToken = JwtUtil.generate({
            sessionId: storedUser.id,
            role: storedUser.role,
            name: storedUser.name,
            email: storedUser.email,
            provider: storedUser.provider ?? 'email',
            isVerified: storedUser.isVerified,
            businessId,
            subscriptionStatus: dbStatus,
            subscriptionPlan: status.business.subscriptionPlan,
        });

        await redis.set(
            `session:${storedUser.id}`,
            JSON.stringify({ ...storedUser, subscriptionStatus: dbStatus }),
            'EX',
            60 * 60 * 24
        );

        res.cookie("token", refreshedToken, {
            httpOnly: true,
            secure: !!config.COOKIES_DOMAIN,
            sameSite: !!config.COOKIES_DOMAIN ? 'none' : 'lax',
            domain: config.COOKIES_DOMAIN,
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });
    }

    return ResponseUtil.success(res, status, HttpStatus.OK);
});

export const getOwnerSubscriptionOverviewController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    const overview = await SubscriptionService.getOwnerSubscriptionOverview(businessId);
    return ResponseUtil.success(res, overview, HttpStatus.OK);
});

export const listOwnerInvoicesController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 10, 1), 50);

    const invoices = await SubscriptionService.listInvoices(businessId, { page, limit });

    return ResponseUtil.paginated(
        res,
        invoices.data,
        invoices.page,
        invoices.limit,
        invoices.total,
        { totalPages: invoices.totalPages },
    );
});

export const renewSubscriptionController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    const payload = req.body as RenewSubscriptionInput;
    const renewal = await SubscriptionService.renewSubscription(businessId, payload);

    return ResponseUtil.success(res, {
        message: 'Invoice perpanjangan berhasil dibuat',
        invoice: renewal.invoice,
        subscription: renewal.subscription,
    }, HttpStatus.CREATED);
});

export const cancelSubscriptionInvoiceController = asyncHandler(async (req: Request, res: Response) => {
    const storedUser = req.storedUser as typeof req.storedUser & {
        businessId?: string;
        business?: { id: string } | null;
    };
    const businessId = storedUser?.businessId ?? storedUser?.business?.id;
    const invoiceId = ensureString(req.params?.invoiceId, 'invoiceId');

    if (!businessId) {
        throw new AppError('Business ID tidak ditemukan di token', HttpStatus.UNAUTHORIZED);
    }

    if (!invoiceId) {
        throw new AppError('Invoice ID diperlukan', HttpStatus.BAD_REQUEST);
    }

    await SubscriptionService.cancelInvoice(businessId, invoiceId);

    return ResponseUtil.success(res, { message: 'Invoice berhasil dibatalkan' });
});
