-- Drop unique constraint to allow multiple booking slots per timeslot
DROP INDEX IF EXISTS "BookingSlot_productId_startTime_endTime_key";