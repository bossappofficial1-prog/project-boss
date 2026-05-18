import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { validateSchema } from "../middleware/zod.middleware";
import { reservationController } from "../controller/reservation.controller";
import {
  createReservationSchema,
  getReservationsQuerySchema,
  updateReservationStatusSchema,
} from "../schemas/reservation.schema";

const router = Router();

router.use(protect);

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
