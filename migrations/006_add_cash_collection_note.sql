-- Add cash collection note to bookings_new
ALTER TABLE bookings_new
ADD COLUMN IF NOT EXISTS cash_collection_note TEXT;
