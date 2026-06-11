-- MIGRATION: Fix booking_type CHECK constraint to allow consultation_and_therapy

-- Drop the old constraint
ALTER TABLE bookings_new DROP CONSTRAINT IF EXISTS bookings_new_booking_type_check;

-- Add new constraint with all valid values
ALTER TABLE bookings_new ADD CONSTRAINT bookings_new_booking_type_check
  CHECK (booking_type IN ('consultation', 'therapy', 'consultation_and_therapy'));
