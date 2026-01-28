import { db } from "../config/prisma";

export class GuestCustomerRepository {
    static async findByPhone(phone: string) {
        return db.guestCustomer.findUnique({
            where: { phone },
            select: {
                id: true,
                name: true
            }
        })
    }

    static async create(data: { phone: string, name: string }) {
        return db.guestCustomer.create({
            data: {
                name: data.name,
                phone: data.phone
            }
        })
    }
}