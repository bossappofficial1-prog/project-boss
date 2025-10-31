import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OutletRepository } from "../repositories/outlet.repository";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";
import { getBusinessByOwnerIdService } from "./business.service";
import { getIsOutletOpen, calculateDistance, validateCoordinates, calculateBoundingBox, validatePaginationParams, validateRadius, mapOutletsWithOpenStatus, removeOperatingHoursFromOutlets } from "../utils/outlet.utils";
import Redis from "ioredis";
import { ImageService } from "./image.service";

// Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

export async function createOutletService(data: CreateOutletInput, ownerId: string) {
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== data.businessId) {
        throw new AppError("Anda tidak berhak menambahkan outlet ke bisnis ini.", HttpStatus.FORBIDDEN);
    }
    const outlet = await OutletRepository.create(data);
    return outlet;
}

export async function findNearbyOutletsService(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    page: number = 1,
    limit: number = 10,
    search?: string
) {
    // Validate inputs using utilities
    try {
        validateRadius(radiusKm);
        validatePaginationParams(page, limit);
        validateCoordinates(latitude, longitude);
    } catch (error) {
        throw new AppError(error instanceof Error ? error.message : 'Invalid input parameters', HttpStatus.BAD_REQUEST);
    }

    // Calculate bounding box
    const { latMin, latMax, longMin, longMax } = calculateBoundingBox(latitude, longitude, radiusKm);

    // Get paginated outlets from repository
    const { outlets: outletsRaw, total } = await OutletRepository.findNearbyWithPagination(
        latitude, longitude, latMin, latMax, longMin, longMax, page, limit, search
    );

    // Calculate exact distances and filter within radius
    const outletsWithDistance = outletsRaw
        .map(outlet => {
            if (!outlet.latitude || !outlet.longitude) return null;

            const distance = calculateDistance(
                { latitude, longitude },
                { latitude: outlet.latitude, longitude: outlet.longitude }
            );

            // Only include outlets within the exact radius
            if (distance > radiusKm) return null;

            return {
                ...outlet,
                distance: Number(distance.toFixed(2))
            };
        })
        .filter((outlet): outlet is NonNullable<typeof outlet> => outlet !== null)
        .sort((a, b) => {
            // Sort by distance first, then by number of orders
            if (Math.abs(a.distance - b.distance) < 0.1) { // If distances are similar (within 100m)
                return (b._count?.orders || 0) - (a._count?.orders || 0); // Sort by popularity
            }
            return a.distance - b.distance;
        });

    const outlets = mapOutletsWithOpenStatus(outletsWithDistance);
    const nearbyOutlets = removeOperatingHoursFromOutlets(outlets);

    return {
        outlets: nearbyOutlets,
        total: outletsWithDistance.length,
        page,
        limit,
        totalPages: Math.ceil(outletsWithDistance.length / limit)
    };
}

export async function updateOutletLocationService(outletId: string, ownerId: string, latitude: number, longitude: number) {
    // Check ownership
    const outlet = await OutletRepository.findById(outletId);
    if (!outlet) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const business = await getBusinessByOwnerIdService(ownerId);
    if (outlet.businessId !== business.id) {
        throw new AppError("Anda tidak berhak mengupdate outlet ini.", HttpStatus.FORBIDDEN);
    }

    // Validate coordinates using utility
    try {
        validateCoordinates(latitude, longitude);
    } catch (error) {
        throw new AppError(error instanceof Error ? error.message : 'Invalid coordinates', HttpStatus.BAD_REQUEST);
    }

    return OutletRepository.update(outletId, { latitude, longitude });
}

export async function getOutletByIdService(id: string, date?: Date) {
    const today = date || new Date();
    const outletRaw = await OutletRepository.findById(id)

    if (!outletRaw) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const { operatingHours, ...outlet } = outletRaw;

    const isOpenOutlet = outlet.isOpen && operatingHours.length > 0
        ? getIsOutletOpen(operatingHours, today)
        : outlet.isOpen

    return { ...outlet, operatingHours, status: isOpenOutlet };
}

export async function getAllOutletService() {
    const outlet = await OutletRepository.getAll();
    if (!outlet) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return outlet;
}

export async function getOutletsByBusinessIdService(
    businessId: string,
    search?: string,
    take?: number,
    skip?: number
) {
    const { outlets: outletsRaw, total } = await OutletRepository.findManyWithPagination(
        businessId,
        search,
        take,
        skip
    );

    const outlets = mapOutletsWithOpenStatus(outletsRaw);

    return { outlets, total };
}

export async function updateOutletService(id: string, data: UpdateOutletInput, ownerId: string) {
    const outlet = await getOutletByIdService(id);
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== outlet.businessId) {
        throw new AppError("Anda tidak berhak mengubah outlet ini.", HttpStatus.FORBIDDEN);
    }
    const updatedOutlet = await OutletRepository.update(id, data);

    // hapus gambar sebelumnya jika ada di local
    if (data.image && outlet.image) ImageService.deleteImageByUrl(outlet.image);

    if (data.manualQrImageUrl && outlet.manualQrImageUrl) ImageService.deleteImageByUrl(outlet.manualQrImageUrl);
    return updatedOutlet;
}

export async function deleteOutletService(id: string, ownerId: string) {
    const outlet = await getOutletByIdService(id);
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== outlet.businessId) {
        throw new AppError("Anda tidak berhak menghapus outlet ini.", HttpStatus.FORBIDDEN);
    }
    const deletedOutlet = await OutletRepository.delete(id);
    if (outlet.image) ImageService.deleteImageByUrl(outlet.image);
    return deletedOutlet;
}

export async function getAllOutletsService(
    search?: string,
    take?: number,
    skip?: number
) {
    const { outlets: outletRaw, total } = await OutletRepository.findManyWithPagination(
        undefined,
        search,
        take,
        skip
    );

    const outlets = mapOutletsWithOpenStatus(outletRaw);

    return { outlets, total };
}

export async function getFeaturedOutletsService() {
    const cacheKey = "featured_outlets";
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const outlets = await OutletRepository.findFeaturedOutlets();

    const featuredOutlets = mapOutletsWithOpenStatus(outlets);
    const result = removeOperatingHoursFromOutlets(featuredOutlets);

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(result));

    return result;
}

// ============================================
// QRIS Management Services
// ============================================

/**
 * Upload QRIS image untuk outlet
 */
export async function uploadQRISService(outletId: string, ownerId: string, file: Express.Multer.File) {
    const path = await import('path');
    const fs = await import('fs/promises');
    
    // Cek apakah outlet ada
    const outlet = await OutletRepository.findById(outletId);

    if (!outlet) {
        // Hapus file yang sudah diupload
        try {
            await fs.unlink(file.path);
        } catch (error) {
            // Ignore error jika file tidak bisa dihapus
        }
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Validasi ownership - hanya owner business yang bisa upload
    const business = await getBusinessByOwnerIdService(ownerId);
    if (outlet.businessId !== business.id) {
        try {
            await fs.unlink(file.path);
        } catch (error) {
            // Ignore error
        }
        throw new AppError(
            'Anda tidak memiliki akses untuk mengupload QRIS outlet ini',
            HttpStatus.FORBIDDEN
        );
    }

    // Validasi file type (hanya gambar)
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
        try {
            await fs.unlink(file.path);
        } catch (error) {
            // Ignore error
        }
        throw new AppError(
            'Format file tidak valid. Hanya menerima JPG, PNG, atau WebP',
            HttpStatus.BAD_REQUEST
        );
    }

    // Validasi ukuran file (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
        try {
            await fs.unlink(file.path);
        } catch (error) {
            // Ignore error
        }
        throw new AppError(
            'Ukuran file terlalu besar. Maksimal 2MB',
            HttpStatus.BAD_REQUEST
        );
    }

    // Jika sudah ada QRIS sebelumnya, hapus file lama
    if (outlet.qrisImage) {
        const oldFilePath = path.join(process.cwd(), outlet.qrisImage);
        try {
            await fs.access(oldFilePath);
            await fs.unlink(oldFilePath);
        } catch (error) {
            // File tidak ada, skip
        }
    }

    // Generate path relatif untuk disimpan di database
    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');

    // Update outlet dengan path QRIS baru
    const updatedOutlet = await OutletRepository.update(outletId, {
        qrisImage: relativePath,
    });

    return {
        id: updatedOutlet.id,
        name: updatedOutlet.name,
        qrisImage: updatedOutlet.qrisImage,
        qrisUrl: updatedOutlet.qrisImage ? `${process.env.BASE_URL}/${updatedOutlet.qrisImage}` : null,
        updatedAt: updatedOutlet.updatedAt,
    };
}

/**
 * Get QRIS data outlet
 */
export async function getQRISService(outletId: string) {
    const outlet = await OutletRepository.findById(outletId);

    if (!outlet) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    // Build proper URL for QRIS image
    const baseUrl = process.env.BASE_URL || 'http://localhost:1234';
    const qrisImageUrl = outlet.qrisImage 
        ? `${baseUrl}/${outlet.qrisImage.replace(/\\/g, '/')}` 
        : null;

    return {
        outletId: outlet.id,
        outletName: outlet.name,
        businessName: outlet.business.name,
        qrisImageUrl: qrisImageUrl,
    };
}

/**
 * Delete QRIS image outlet
 */
export async function deleteQRISService(outletId: string, ownerId: string) {
    const path = await import('path');
    const fs = await import('fs/promises');
    
    // Cek outlet dan ownership
    const outlet = await OutletRepository.findById(outletId);

    if (!outlet) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const business = await getBusinessByOwnerIdService(ownerId);
    if (outlet.businessId !== business.id) {
        throw new AppError(
            'Anda tidak memiliki akses untuk menghapus QRIS outlet ini',
            HttpStatus.FORBIDDEN
        );
    }

    if (!outlet.qrisImage) {
        throw new AppError('Outlet tidak memiliki QRIS', HttpStatus.BAD_REQUEST);
    }

    // Hapus file fisik
    const filePath = path.join(process.cwd(), outlet.qrisImage);
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (error) {
        // File tidak ditemukan, lanjutkan hapus dari database
    }

    // Update database
    await OutletRepository.update(outletId, {
        qrisImage: null,
    });

    return true;
}