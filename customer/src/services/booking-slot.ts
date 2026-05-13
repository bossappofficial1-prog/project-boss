import api from "@/lib/api"
import { BookingSlotType } from "../types"

export class BookingSlot {
    private url = "/booking-slots"

    static async getSlotByProductId(productId: string, date: string): Promise<BookingSlotType[]> {
        const res = await api.get(`/products/${productId}/booking-slots?date=${date}`)
        return res.data.data
    }

    static async getById(slotId: string): Promise<BookingSlotType> {
        return api.getData(`/bookings/${slotId}`)
    }
}