-- Create refunds table
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_uuid UUID NOT NULL REFERENCES bookings_new(id) ON DELETE CASCADE,
  booking_id VARCHAR(50) NOT NULL,
  patient_uuid UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED')),
  cashfree_refund_id VARCHAR(255),
  transaction_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refunds_booking_uuid ON refunds(booking_uuid);
CREATE INDEX idx_refunds_patient_uuid ON refunds(patient_uuid);
CREATE INDEX idx_refunds_status ON refunds(status);
