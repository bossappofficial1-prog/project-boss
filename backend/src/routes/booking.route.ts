import { Router } from "express";
import {
    createBookingSlotController,
    deleteBookingSlotController,
    getBookingSlotByIdController,
    getBookingSlotsByProductIdController,
    updateBookingSlotController
} from "../controller/booking.controller";
import { validateSchema } from "../middleware/zod.middleware";
import { createBookingSlotSchema, updateBookingSlotSchema } from "../schemas/booking.schema";
import { authorize, protect } from "../middleware/auth.middleware";
import { UserRole } from "@prisma/client";

const bookingRouter = Router();

// Rute Publik untuk melihat slot jadwal
bookingRouter.get("/product/:productId", getBookingSlotsByProductIdController);

bookingRouter.get("/:id", getBookingSlotByIdController);
// Semua rute di bawah ini akan dilindungi dan hanya untuk Owner
bookingRouter.use(protect, authorize(UserRole.OWNER));

bookingRouter.post("/", validateSchema(createBookingSlotSchema), createBookingSlotController);
bookingRouter.patch("/:id", validateSchema(updateBookingSlotSchema), updateBookingSlotController);
bookingRouter.delete("/:id", deleteBookingSlotController);

export default bookingRouter;
