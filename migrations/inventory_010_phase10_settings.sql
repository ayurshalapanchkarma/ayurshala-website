-- Phase 10: Master Settings & ERP Foundation
-- Centralized configuration layer

-- Clinic Settings
CREATE TABLE clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  gstin VARCHAR(20),
  pan VARCHAR(20),
  registration_number VARCHAR(100),
  logo_url VARCHAR(500),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  currency VARCHAR(3) DEFAULT 'INR',
  language VARCHAR(10) DEFAULT 'EN',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Number Sequences
CREATE TABLE number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_name VARCHAR(50) NOT NULL UNIQUE,
  sequence_format VARCHAR(100) NOT NULL,
  current_value INTEGER DEFAULT 0,
  reset_type VARCHAR(20),
  example_output VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_code VARCHAR(20) NOT NULL UNIQUE,
  department_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Branches
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(20) UNIQUE,
  address TEXT,
  city VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(50) NOT NULL UNIQUE,
  role_description TEXT,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Permissions
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(20) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Role Permissions
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Payment Methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name VARCHAR(50) NOT NULL UNIQUE,
  method_code VARCHAR(20) UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tax Settings
CREATE TABLE tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_name VARCHAR(50) NOT NULL UNIQUE,
  tax_code VARCHAR(10),
  tax_percentage NUMERIC(5, 2) NOT NULL,
  gst_slab VARCHAR(20),
  cgst NUMERIC(5, 2),
  sgst NUMERIC(5, 2),
  igst NUMERIC(5, 2),
  applicable_from DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Working Hours
CREATE TABLE working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  lunch_start TIME,
  lunch_end TIME,
  appointment_slot_duration INTEGER DEFAULT 30,
  buffer_time_minutes INTEGER DEFAULT 5,
  is_working_day BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Holiday Calendar
CREATE TABLE holiday_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(100) NOT NULL,
  holiday_type VARCHAR(20),
  is_clinic_closed BOOLEAN DEFAULT true,
  affected_doctors TEXT,
  affected_therapists TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flags
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) NOT NULL UNIQUE,
  feature_key VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notification Templates
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(100) NOT NULL,
  template_code VARCHAR(50) NOT NULL UNIQUE,
  channel VARCHAR(50),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Settings
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_username VARCHAR(255),
  smtp_password VARCHAR(255),
  from_email VARCHAR(255),
  from_name VARCHAR(100),
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- SMS Settings
CREATE TABLE sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50),
  api_key VARCHAR(500),
  sender_id VARCHAR(20),
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- WhatsApp Settings
CREATE TABLE whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50),
  api_key VARCHAR(500),
  phone_number VARCHAR(20),
  is_enabled BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Branding
CREATE TABLE branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  font_family VARCHAR(100),
  pdf_header_html TEXT,
  pdf_footer_html TEXT,
  certificate_branding TEXT,
  invoice_branding TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Backup Settings
CREATE TABLE backup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_frequency VARCHAR(50),
  retention_days INTEGER DEFAULT 30,
  storage_type VARCHAR(50),
  last_backup_at TIMESTAMP,
  next_backup_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit Settings
CREATE TABLE audit_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retention_days INTEGER DEFAULT 365,
  track_sensitive_actions BOOLEAN DEFAULT true,
  sensitive_actions TEXT,
  export_format VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- System Settings
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR(20),
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_clinic_settings ON clinic_settings(clinic_name);
CREATE INDEX idx_number_sequences_name ON number_sequences(sequence_name);
CREATE INDEX idx_departments_code ON departments(department_code);
CREATE INDEX idx_branches_code ON branches(branch_code);
CREATE INDEX idx_roles_name ON roles(role_name);
CREATE INDEX idx_permissions_module ON permissions(module);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_payment_methods_enabled ON payment_methods(is_enabled);
CREATE INDEX idx_tax_settings_active ON tax_settings(is_active);
CREATE INDEX idx_working_hours_day ON working_hours(day_of_week);
CREATE INDEX idx_holiday_calendar_date ON holiday_calendar(holiday_date);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX idx_notification_templates_channel ON notification_templates(channel);
