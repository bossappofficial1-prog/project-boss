import { Job } from "bull";
import Console from "../utils/logger";
import { expirePaymentOrder } from "../service/order.service";

export const processPaymentExpiration = async (job: Job<{ orderId: string }>) => {
    const { orderId } = job.data;

    console.log('Processing payment expiration for:', orderId);

    try { await expirePaymentOrder(orderId) }
    catch (error) { Console.log(error) }
}