-- Phase 13: AI Assistant, Automation & Clinical Intelligence
-- AI layer on top of ERP (read-only data access)

-- AI Conversations
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_role VARCHAR(50),
  assistant_type VARCHAR(50),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Messages
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id),
  role VARCHAR(20),
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  tokens_used INTEGER,
  erp_data_accessed TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Prompts (versioned templates)
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_name VARCHAR(100),
  prompt_template TEXT NOT NULL,
  role VARCHAR(50),
  version INTEGER DEFAULT 1,
  variables TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Automation Workflows
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name VARCHAR(255),
  trigger_event VARCHAR(100),
  actions TEXT,
  enabled BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Automation History
CREATE TABLE automation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES automation_workflows(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  trigger_data JSONB,
  executed_actions TEXT,
  status VARCHAR(50),
  completed_at TIMESTAMP
);

-- AI Suggestions
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suggestion_type VARCHAR(50),
  content TEXT,
  confidence NUMERIC(3, 2),
  acted_on BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Feedback
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ai_messages(id),
  rating VARCHAR(50),
  comments TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_title VARCHAR(255) NOT NULL,
  article_content TEXT NOT NULL,
  category VARCHAR(100),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Usage Stats
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assistant_type VARCHAR(50),
  tokens_consumed INTEGER,
  cost NUMERIC(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Audit Logs
CREATE TABLE ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100),
  model VARCHAR(50),
  prompt TEXT,
  erp_data_accessed TEXT,
  response TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_automation_workflows_enabled ON automation_workflows(enabled);
CREATE INDEX idx_automation_history_workflow ON automation_history(workflow_id);
CREATE INDEX idx_ai_suggestions_user ON ai_suggestions(user_id);
CREATE INDEX idx_knowledge_base_approved ON knowledge_base(is_approved);
CREATE INDEX idx_ai_audit_logs_user ON ai_audit_logs(user_id);
