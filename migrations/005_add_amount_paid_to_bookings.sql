-- Add amount_paid column to track actual payment amounts
ALTER TABLE bookings_new
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2) DEFAULT 0;
