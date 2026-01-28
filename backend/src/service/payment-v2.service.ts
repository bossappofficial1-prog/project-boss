import { GuestCustomerRepository } from "../repositories/guest-customer.repository";
import { CreatePaymentPayload } from "../schemas/payment-v2.schema";

export class PaymentService {

    static async createPayment(data: CreatePaymentPayload) {
        const { customer_details, item_details, outletId, payment_method, selectedSlotId, staffId } = data

        // cek guestomer
        const ExistCustomer = GuestCustomerRepository.findByPhone(customer_details.phone);
        let GCustomer = ExistCustomer

        if (!GCustomer) {
            GCustomer = GuestCustomerRepository.create({ name: customer_details.name, phone: customer_details.phone })
        }
    }
}