import { HttpStatus } from "../constants/http-status";
import { AppError } from "../errors/app-error";
import { BusinessRepository } from "../repositories/business.repository";
import { CreateBusinessInput, UpdateBusinessInput } from "../schemas/business.schema";

export async function createBusinessService(data: CreateBusinessInput, ownerId: string) {
    const existingBusiness = await BusinessRepository.findByOwnerId(ownerId);
    if (existingBusiness) {
        throw new AppError("Anda sudah memiliki bisnis.", HttpStatus.CONFLICT);
    }
    const business = await BusinessRepository.create(data, ownerId);
    return business;
}

export async function getBusinessByOwnerIdService(ownerId: string) {
    const business = await BusinessRepository.findByOwnerId(ownerId);
    if (!business) {
        throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return business;
}

export async function getBusinessByIdService(id: string) {
    const business = await BusinessRepository.findById(id);
    if (!business) {
        throw new AppError("Bisnis tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    return business;
}

export async function getAllBusinessesService() {
    const businesses = await BusinessRepository.findAll();
    return businesses;
}

export async function updateBusinessService(id: string, data: UpdateBusinessInput, ownerId: string) {
    const business = await getBusinessByOwnerIdService(ownerId);
    if (business.id !== id) {
        throw new AppError("Anda tidak berhak mengubah bisnis ini.", HttpStatus.FORBIDDEN);
    }
    const updatedBusiness = await BusinessRepository.update(id, data);
    return updatedBusiness;
}

export async function updateBankAccountService(businessId: string, ownerId: string, data: { bankName: string; bankAccount: string; accountHolder: string; }) {
    const business = await BusinessRepository.findByOwnerId(ownerId);

    if (!business || business.id !== businessId) {
        throw new AppError('You are not authorized to update this business', HttpStatus.FORBIDDEN);
    }

    return BusinessRepository.update(businessId, data);
}