import { db } from "../config/prisma";
import { HttpStatus } from "../constants/http-status";
import { Messages } from "../constants/message";
import { AppError } from "../errors/app-error";
import { OutletRepository } from "../repositories/outlet.repository";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";
import { getBusinessByOwnerIdService } from "./business.service";

export async function createOutletService(data: CreateOutletInput, ownerId: string) {
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== data.businessId) {
        throw new AppError("Anda tidak berhak menambahkan outlet ke bisnis ini.", HttpStatus.FORBIDDEN);
    }
    const outlet = await OutletRepository.create(data);
    return outlet;
}

export async function getOutletByIdService(id: string) {
    const outlet = await OutletRepository.findByIdWithProducts(id);
    if (!outlet) {
        throw new AppError(`Outlet dengan id ${id} tidak tersedia.`, HttpStatus.NOT_FOUND);
    }
    return outlet;
}
export async function getAllOutletService() {
    const outlet = await OutletRepository.getAll();
    if (!outlet) {
        throw new AppError(Messages.NOT_FOUND, HttpStatus.NOT_FOUND);
    }
    return outlet;
}

export async function getOutletsByBusinessIdService(
    businessId: string,
    search?: string,
    take?: number,
    skip?: number
) {
    const { outlets, total } = await OutletRepository.findManyWithPagination(
        businessId,
        search,
        take,
        skip
    );
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
    const { outlets, total } = await OutletRepository.findManyWithPagination(
        undefined,
        search,
        take,
        skip
    );
    return { outlets, total };
}

export async function getFeaturedOutletsService() {
    const outlets = await db.outlet.findMany({
        include: {
            _count: {
                select: {
                    orders: true,
                },
            },
        },
    });

    const sortedOutlets = outlets.sort((a, b) => b._count.orders - a._count.orders);

    return sortedOutlets.slice(0, 5); // Return top 5
}