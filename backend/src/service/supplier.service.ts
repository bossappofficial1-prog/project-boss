import { BaseService } from "./base.service";
import { SupplierRepository } from "../repositories/supplier.repository";
import type {
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierQuery,
} from "../schemas/supplier.schema";

export class SupplierService extends BaseService {
  static async getAll(query: SupplierQuery) {
    return SupplierRepository.findAll(query);
  }

  static async getById(id: string) {
    const supplier = await SupplierRepository.findById(id);
    if (!supplier) this.notFound("Supplier tidak ditemukan");
    return supplier;
  }

  static async create(input: CreateSupplierInput) {
    const { productGoodsIds, ...data } = input;

    const supplier = await SupplierRepository.create(data);

    if (productGoodsIds?.length) {
      await SupplierRepository.syncProducts(supplier.id, productGoodsIds);
      // Re-fetch with relations
      return SupplierRepository.findById(supplier.id);
    }

    return supplier;
  }

  static async update(id: string, input: UpdateSupplierInput) {
    await this.getById(id); // ensures exists

    const { productGoodsIds, ...data } = input;

    await SupplierRepository.update(id, data);

    if (productGoodsIds !== undefined) {
      await SupplierRepository.syncProducts(id, productGoodsIds);
    }

    return SupplierRepository.findById(id);
  }

  static async delete(id: string) {
    await this.getById(id); // ensures exists
    return SupplierRepository.delete(id);
  }

  static async getByProduct(productGoodsId: string) {
    const links = await SupplierRepository.findByProduct(productGoodsId);
    return links.map((sp) => ({
      ...sp.supplier,
      lastPrice: sp.lastPrice,
      lastOrderDate: sp.lastOrderDate,
    }));
  }
}
