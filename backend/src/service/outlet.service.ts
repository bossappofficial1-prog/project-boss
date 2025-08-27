import { OutletOperatingHours } from "@prisma/client";
import { db } from "../config/prisma";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OutletRepository } from "../repositories/outlet.repository";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";
import Console from "../utils/logger";
import { getBusinessByOwnerIdService } from "./business.service";

export async function createOutletService(data: CreateOutletInput, ownerId: string) {
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== data.businessId) {
        throw new AppError("Anda tidak berhak menambahkan outlet ke bisnis ini.", HttpStatus.FORBIDDEN);
    }
    const outlet = await OutletRepository.create(data);
    return outlet;
}

interface Location {
    latitude: number;
    longitude: number;
}

const getIsOutletOpen = (operatingHours: OutletOperatingHours[], today: Date) => {
    return operatingHours.some((oper) => {
        const todayMinutes = today.getHours() * 60 + today.getMinutes(); // Total menit saat ini
        const openMinutes = oper.openTime.getHours() * 60 + oper.openTime.getMinutes(); // Total menit waktu buka
        const closeMinutes = oper.closeTime.getHours() * 60 + oper.closeTime.getMinutes(); // Total menit waktu tutup

        Console.log(closeMinutes, openMinutes, todayMinutes, today.getDay(), oper.dayOfWeek);
        Console.log(oper.dayOfWeek === today.getDay() && todayMinutes >= openMinutes && todayMinutes <= closeMinutes);

        return oper.dayOfWeek === today.getDay() && todayMinutes >= openMinutes && todayMinutes <= closeMinutes;
    });
}

function calculateDistance(point1: Location, point2: Location): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadian(point2.latitude - point1.latitude);
    const dLon = toRadian(point2.longitude - point1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadian(point1.latitude)) * Math.cos(toRadian(point2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
}

function toRadian(degree: number): number {
    return degree * Math.PI / 180;
}

export async function findNearbyOutletsService(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    page: number = 1,
    limit: number = 10
) {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
        throw new AppError('Invalid latitude. Must be between -90 and 90', HttpStatus.BAD_REQUEST);
    }
    if (longitude < -180 || longitude > 180) {
        throw new AppError('Invalid longitude. Must be between -180 and 180', HttpStatus.BAD_REQUEST);
    }
    if (radiusKm <= 0) {
        throw new AppError('Radius must be greater than 0', HttpStatus.BAD_REQUEST);
    }
    if (page < 1) {
        throw new AppError('Page must be greater than 0', HttpStatus.BAD_REQUEST);
    }
    if (limit < 1) {
        throw new AppError('Limit must be greater than 0', HttpStatus.BAD_REQUEST);
    }

    // Calculate bounding box for initial filtering
    const latRadian = latitude * Math.PI / 180;
    const degLatKm = 110.574; // Approximate degrees per km at the equator
    const degLongKm = 111.320 * Math.cos(latRadian); // Adjust for latitude

    const latDiff = radiusKm / degLatKm;
    const longDiff = radiusKm / degLongKm;

    // First, get outlets within the bounding box (rough filter)
    const outlets = await db.outlet.findMany({
        where: {
            AND: [
                { latitude: { gte: latitude - latDiff } },
                { latitude: { lte: latitude + latDiff } },
                { longitude: { gte: longitude - longDiff } },
                { longitude: { lte: longitude + longDiff } }
            ]
        },
        include: {
            business: {
                select: {
                    name: true,
                    description: true
                }
            },
            operatingHours: true,
            _count: {
                select: {
                    orders: true,
                    products: true
                }
            }
        }
    });

    // Calculate exact distances and filter
    const outletsWithDistance = outlets
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
                distance: Number(distance.toFixed(2)) // Round to 2 decimal places
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

    const today = new Date()
    const skip = (page - 1) * limit;
    const paginatedOutlets = outletsWithDistance.slice(skip, skip + limit).map((outlet) => ({
        ...outlet,
        isOpen: outlet.operatingHours.length > 0
            ? getIsOutletOpen(outlet.operatingHours, today)
            : outlet.isOpen
    }));

    return {
        outlets: paginatedOutlets,
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

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
        throw new AppError('Invalid latitude. Must be between -90 and 90', HttpStatus.BAD_REQUEST);
    }
    if (longitude < -180 || longitude > 180) {
        throw new AppError('Invalid longitude. Must be between -180 and 180', HttpStatus.BAD_REQUEST);
    }

    return db.outlet.update({
        where: { id: outletId },
        data: { latitude, longitude }
    });
}

export async function getOutletByIdService(id: string, date?: Date) {
    const today = date || new Date();
    const outletRaw = await OutletRepository.findById(id)

    if (!outletRaw) {
        throw new AppError(Messages.OUTLET_NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    const { isOpen, operatingHours, ...outlet } = outletRaw;

    const isOpenOutlet = operatingHours.length > 0
        ? getIsOutletOpen(operatingHours, today)
        : isOpen;

    return { ...outlet, operatingHours, isOpen: isOpenOutlet };
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

    const today = new Date()
    const outlets = outletsRaw.map((outlet) => ({
        ...outlet,
        isOpen: outlet.operatingHours.length > 0
            ? getIsOutletOpen(outlet.operatingHours, today)
            : outlet.isOpen
    }))

    Console.log(outlets)
    return { outlets, total };
}

export async function updateOutletService(id: string, data: UpdateOutletInput, ownerId: string) {
    const outlet = await getOutletByIdService(id);
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== outlet.businessId) {
        throw new AppError("Anda tidak berhak mengubah outlet ini.", HttpStatus.FORBIDDEN);
    }
    const updatedOutlet = await OutletRepository.update(id, data);
    return updatedOutlet;
}

export async function deleteOutletService(id: string, ownerId: string) {
    const outlet = await getOutletByIdService(id);
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== outlet.businessId) {
        throw new AppError("Anda tidak berhak menghapus outlet ini.", HttpStatus.FORBIDDEN);
    }
    const deletedOutlet = await OutletRepository.delete(id);
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

    const today = new Date()
    const outlets = outletRaw.map((outlet) => ({
        ...outlet,
        isOpen: outlet.operatingHours.length > 0
            ? getIsOutletOpen(outlet.operatingHours, today)
            : outlet.isOpen
    }))
    return { outlets, total };
}

export async function getFeaturedOutletsService() {
    const today = new Date()
    const outlets = await db.outlet.findMany({
        include: {
            business: {
                select: {
                    id: true,
                    name: true
                }
            },
            operatingHours: true,
            _count: {
                select: {
                    orders: true,
                },
            },
        },
    });

    const sortedOutlets = outlets.sort((a, b) => b._count.orders - a._count.orders);
    const featuredOutlet = sortedOutlets.map((outlet) => ({
        ...outlet,
        isOpen: outlet.operatingHours.length > 0
            ? getIsOutletOpen(outlet.operatingHours, today)
            : outlet.isOpen
    }))
    return featuredOutlet.slice(0, 5);
}