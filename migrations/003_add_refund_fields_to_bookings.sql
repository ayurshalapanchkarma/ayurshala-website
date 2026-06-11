-- Add refund tracking fields to bookings_new
ALTER TABLE bookings_new
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_reason TEXT;
