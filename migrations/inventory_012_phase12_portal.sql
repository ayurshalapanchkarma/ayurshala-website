-- Phase 12: Patient Portal, Mobile APIs & Public API Platform
-- API Keys, Webhooks, Notifications, File Management

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(255) NOT NULL UNIQUE,
  api_secret VARCHAR(255),
  user_id UUID NOT NULL,
  scope TEXT,
  rate_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_name VARCHAR(100) NOT NULL,
  webhook_url VARCHAR(500) NOT NULL,
  event_type VARCHAR(100),
  user_id UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret_token VARCHAR(255),
  retry_count INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook Events
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id),
  event_type VARCHAR(100),
  payload JSONB,
  status VARCHAR(50),
  response_code INTEGER,
  attempted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  notification_type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  channel VARCHAR(50),
  status VARCHAR(50) DEFAULT 'PENDING',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File Storage
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  file_url VARCHAR(500),
  uploaded_by UUID NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Device Sessions
CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id VARCHAR(255),
  device_name VARCHAR(100),
  device_type VARCHAR(50),
  ip_address VARCHAR(50),
  user_agent TEXT,
  login_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- API Logs
CREATE TABLE api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  api_key_id UUID,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
CREATE INDEX idx_webhooks_user ON webhooks(user_id);
CREATE INDEX idx_webhook_events_webhook ON webhook_events(webhook_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_reference ON files(reference_id, reference_type);
CREATE INDEX idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX idx_api_logs_user ON api_logs(user_id);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);
