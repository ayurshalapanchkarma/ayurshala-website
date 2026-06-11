-- MIGRATION: Fix amount_paid for ONLINE bookings with PENDING payment_status
-- These bookings incorrectly have amount_paid > 0 but payment hasn't been verified

UPDATE bookings_new
SET amount_paid = 0
WHERE payment_method = 'ONLINE'
AND payment_status = 'PENDING'
AND amount_paid > 0;

-- Note: amount_paid will be set correctly after Cashfree verification in payment verify route
