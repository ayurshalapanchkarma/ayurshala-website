-- Migration: Add unique constraint to booking_id for proper UPSERT behavior
-- Date: 2025-01-03
-- Reason: Enable UPSERT on discharge_summaries table to prevent duplicates

-- Check if constraint already exists, if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'unique_booking_id' 
    AND table_name = 'discharge_summaries'
  ) THEN
    ALTER TABLE discharge_summaries ADD CONSTRAINT unique_booking_id UNIQUE (booking_id);
    RAISE NOTICE 'Constraint unique_booking_id added successfully';
  ELSE
    RAISE NOTICE 'Constraint unique_booking_id already exists';
  END IF;
END
$$;

-- Verify the constraint exists
SELECT constraint_name, table_name, column_name 
FROM information_schema.key_column_usage 
WHERE table_name = 'discharge_summaries' 
AND constraint_name = 'unique_booking_id';
