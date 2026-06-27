-- Phase 8: CRM, Follow-ups & Patient Engagement
-- Patient relationship management, follow-ups, communications, campaigns

-- Enums
CREATE TYPE followup_status AS ENUM ('SCHEDULED', 'PENDING', 'COMPLETED', 'MISSED', 'CANCELLED');
CREATE TYPE followup_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE communication_channel AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'PHONE_CALL', 'INTERNAL_NOTE');
CREATE TYPE communication_status AS ENUM ('SENT', 'FAILED', 'PENDING', 'DELIVERED', 'READ');
CREATE TYPE reminder_type AS ENUM ('APPOINTMENT', 'TREATMENT_SESSION', 'MEDICINE_REFILL', 'FOLLOWUP', 'PACKAGE_EXPIRY', 'BIRTHDAY', 'ANNIVERSARY');
CREATE TYPE patient_segment AS ENUM ('NEW_PATIENT', 'RETURNING_PATIENT', 'VIP', 'PACKAGE_HOLDER', 'CHRONIC_PATIENT', 'DIABETES', 'ARTHRITIS', 'PANCHAKARMA', 'PENDING_FOLLOWUP', 'INACTIVE', 'CUSTOM');

-- Patient Follow-ups
CREATE TABLE patient_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  doctor_id UUID,
  appointment_id UUID,
  prescription_id UUID,
  treatment_plan_id UUID,
  followup_type VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  priority followup_priority DEFAULT 'MEDIUM',
  reason TEXT,
  status followup_status DEFAULT 'SCHEDULED',
  completed_at TIMESTAMP,
  completed_by UUID,
  notes TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communication Templates
CREATE TABLE communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  channel communication_channel NOT NULL,
  subject VARCHAR(255),
  message_body TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Communication Logs
CREATE TABLE communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  channel communication_channel NOT NULL,
  template_id UUID,
  recipient_phone VARCHAR(20),
  recipient_email VARCHAR(255),
  subject VARCHAR(255),
  message_body TEXT,
  status communication_status DEFAULT 'PENDING',
  delivery_status TEXT,
  sent_by UUID,
  sent_at TIMESTAMP,
  failed_reason TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patient Tags (for segmentation)
CREATE TABLE patient_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  tag_name VARCHAR(100) NOT NULL,
  segment patient_segment,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  reminder_type reminder_type NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  message TEXT,
  status VARCHAR(50) DEFAULT 'PENDING',
  sent_at TIMESTAMP,
  sent_via communication_channel,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient Notes (internal only)
CREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  note_type VARCHAR(50),
  note_text TEXT NOT NULL,
  created_by UUID NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient Feedback
CREATE TABLE patient_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  appointment_id UUID,
  treatment_plan_id UUID,
  feedback_type VARCHAR(50),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  suggestions TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(100),
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  target_segment patient_segment,
  template_id UUID,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_by UUID NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Recipients
CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  patient_id UUID NOT NULL,
  communication_log_id UUID,
  status communication_status DEFAULT 'PENDING',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_patient_followups_updated_at BEFORE UPDATE ON patient_followups FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_communication_templates_updated_at BEFORE UPDATE ON communication_templates FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_patient_notes_updated_at BEFORE UPDATE ON patient_notes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trigger_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Indices
CREATE INDEX idx_patient_followups_patient ON patient_followups(patient_id);
CREATE INDEX idx_patient_followups_status ON patient_followups(status);
CREATE INDEX idx_patient_followups_due_date ON patient_followups(due_date);
CREATE INDEX idx_communication_logs_patient ON communication_logs(patient_id);
CREATE INDEX idx_communication_logs_channel ON communication_logs(channel);
CREATE INDEX idx_communication_logs_status ON communication_logs(status);
CREATE INDEX idx_communication_logs_created_at ON communication_logs(created_at);
CREATE INDEX idx_patient_tags_patient ON patient_tags(patient_id);
CREATE INDEX idx_patient_tags_segment ON patient_tags(segment);
CREATE INDEX idx_reminders_patient ON reminders(patient_id);
CREATE INDEX idx_reminders_type ON reminders(reminder_type);
CREATE INDEX idx_reminders_date ON reminders(reminder_date);
CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_patient_notes_patient ON patient_notes(patient_id);
CREATE INDEX idx_patient_feedback_patient ON patient_feedback(patient_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_segment ON campaigns(target_segment);
CREATE INDEX idx_campaign_recipients_campaign ON campaign_recipients(campaign_id);
CREATE INDEX idx_campaign_recipients_patient ON campaign_recipients(patient_id);
