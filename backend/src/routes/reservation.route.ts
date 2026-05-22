import { Router } from "express";
import { protect, authorize } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { reservationController } from "../controller/reservation.controller";
import {
  createReservationSchema,
  getReservationsQuerySchema,
  updateReservationStatusSchema,
} from "../schemas/reservation.schema";
import { UserRole, StaffRole } from "@prisma/client";

const router = Router();

router.use(protect, authorize(UserRole.OWNER, StaffRole.CASHIER, StaffRole.MANAGER));

router.post(
  "/",
  validateSchema(createReservationSchema),
  reservationController.createReservation
);

router.get(
  "/",
  validateSchema(getReservationsQuerySchema, "query"),
  reservationController.getReservations
);

router.patch(
  "/:id/status",
  validateSchema(updateReservationStatusSchema),
  reservationController.updateReservationStatus
);

export default router;
