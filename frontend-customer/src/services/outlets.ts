import api from "@/lib/api";
import { BusinessType, NearbyOutletsParams, OutletType } from "@/types";

export class Outlet {
    static async getDetail(slug: string): Promise<OutletType> {
        return api.getData(`/outlets/slug/${slug}`)
    }

    static async getNearby(params: NearbyOutletsParams): Promise<Array<OutletType & Pick<BusinessType, "id" | "name"> & { _count: { orders: number }; distance: number }>> {
        return api.getData(`/outlets/nearby`, { params })
    }

    static async getFeatured(): Promise<Array<OutletType & { _count: { orders: number }; distance: number }>> {
        return api.getData("/outlets/featured")
    }
}