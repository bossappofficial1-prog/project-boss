import { db } from "../config/prisma";

/**
 * Searches all models for the specified filename and nullifies or deletes the reference
 * if it matches, to clean up references to files that failed background moderation.
 */
export async function cleanDbReferences(filename: string): Promise<void> {
    try {
        // 1. User avatar
        await db.user.updateMany({
            where: { avatar: { endsWith: filename } },
            data: { avatar: null }
        });

        // 2. Outlet image
        await db.outlet.updateMany({
            where: { image: { endsWith: filename } },
            data: { image: "/defaults/default-outlet-image.webp" }
        });

        // 3. Outlet manual QR
        await db.outlet.updateMany({
            where: { manualQrImageUrl: { endsWith: filename } },
            data: { manualQrImageUrl: null }
        });

        // 4. Product image
        await db.product.updateMany({
            where: { image: { endsWith: filename } },
            data: { image: null }
        });

        // 5. Banner (delete the record because the image is deleted)
        await db.banner.deleteMany({
            where: { imageUrl: { endsWith: filename } }
        });

        // 6. ProductMedia (delete the record because the media is deleted)
        await db.productMedia.deleteMany({
            where: {
                OR: [
                    { url: { endsWith: filename } },
                    { thumbnailUrl: { endsWith: filename } }
                ]
            }
        });

        // 7. SubscriptionInvoice proofImage
        await db.subscriptionInvoice.updateMany({
            where: { proofImage: { endsWith: filename } },
            data: { proofImage: null }
        });

        // 8. Transaction paymentProofUrl
        await db.transaction.updateMany({
            where: { paymentProofUrl: { endsWith: filename } },
            data: { paymentProofUrl: null }
        });

        console.log(`[Moderation Queue] Cleaned up DB references for filename: ${filename}`);
    } catch (dbError) {
        console.error(`[Moderation Queue] Failed to clean up DB references for filename: ${filename}`, dbError);
    }
}
