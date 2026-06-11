-- Update cancelled cash bookings to NO_CASH_COLLECTED
UPDATE bookings_new
SET payment_status = 'NO_CASH_COLLECTED'
WHERE status = 'CANCELLED'
AND payment_status = 'PENDING'
AND payment_method IN ('CASH', 'CASH_ON_ARRIVAL');
