-- Phase 9: Analytics & Business Intelligence
-- Read-only analytics platform consuming data from all ERP modules

-- Analytics Snapshots (for historical trending)
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  snapshot_type VARCHAR(50) NOT NULL,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(15, 2),
  dimension_1 VARCHAR(255),
  dimension_2 VARCHAR(255),
  dimension_3 VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved Reports
CREATE TABLE saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(50),
  module VARCHAR(50),
  filters JSONB,
  grouping JSONB,
  sorting JSONB,
  date_range_type VARCHAR(50),
  created_by UUID NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Report Exports
CREATE TABLE report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES saved_reports(id),
  export_format VARCHAR(20),
  file_name VARCHAR(255),
  file_url VARCHAR(500),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- KPI Targets
CREATE TABLE kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name VARCHAR(100) NOT NULL,
  kpi_type VARCHAR(50),
  target_value NUMERIC(15, 2),
  current_value NUMERIC(15, 2),
  threshold_type VARCHAR(20),
  frequency VARCHAR(20),
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- KPI History
CREATE TABLE kpi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES kpi_targets(id),
  recorded_value NUMERIC(15, 2),
  recorded_date DATE NOT NULL,
  variance_percentage NUMERIC(5, 2),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dashboard Widgets (for customizable dashboards)
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_type VARCHAR(50),
  widget_name VARCHAR(100) NOT NULL,
  widget_type VARCHAR(50),
  position INTEGER,
  metric_key VARCHAR(100),
  refresh_interval INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_analytics_snapshots_date ON analytics_snapshots(snapshot_date);
CREATE INDEX idx_analytics_snapshots_type ON analytics_snapshots(snapshot_type);
CREATE INDEX idx_saved_reports_created_by ON saved_reports(created_by);
CREATE INDEX idx_saved_reports_public ON saved_reports(is_public);
CREATE INDEX idx_kpi_targets_name ON kpi_targets(kpi_name);
CREATE INDEX idx_kpi_history_kpi_id ON kpi_history(kpi_id);
CREATE INDEX idx_kpi_history_date ON kpi_history(recorded_date);
CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_type);

-- Materialized Views for common aggregations
CREATE MATERIALIZED VIEW mv_daily_revenue AS
SELECT 
  DATE(p.payment_date) as payment_date,
  SUM(p.amount) as total_revenue,
  COUNT(DISTINCT p.invoice_id) as invoice_count,
  COUNT(DISTINCT p.patient_id) as patient_count
FROM payments p
WHERE p.payment_status = 'SUCCESS' AND p.is_deleted = false
GROUP BY DATE(p.payment_date);

CREATE MATERIALIZED VIEW mv_doctor_performance AS
SELECT 
  d.id as doctor_id,
  d.name,
  COUNT(DISTINCT a.id) as consultation_count,
  COUNT(DISTINCT rx.id) as prescription_count,
  AVG(COALESCE(f.rating, 0)) as avg_rating
FROM doctors d
LEFT JOIN appointments a ON d.id = a.doctor_id
LEFT JOIN prescriptions rx ON d.id = rx.doctor_id
LEFT JOIN patient_feedback f ON a.id = f.appointment_id
GROUP BY d.id, d.name;

CREATE MATERIALIZED VIEW mv_treatment_analytics AS
SELECT 
  tp.treatment_name,
  COUNT(DISTINCT tp.id) as total_plans,
  SUM(CASE WHEN tp.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
  COUNT(DISTINCT ts.id) as total_sessions,
  SUM(COALESCE(ts.duration_minutes, 0)) as total_duration_minutes,
  AVG(COALESCE(pf.rating, 0)) as avg_rating
FROM treatment_plans tp
LEFT JOIN treatment_sessions ts ON tp.id = ts.treatment_plan_id
LEFT JOIN patient_feedback pf ON tp.id = pf.treatment_plan_id
GROUP BY tp.treatment_name;

CREATE MATERIALIZED VIEW mv_inventory_analytics AS
SELECT 
  p.id as product_id,
  p.name,
  COALESCE(cs.quantity, 0) as current_stock,
  SUM(CASE WHEN st.movement_type = 'PURCHASE' THEN st.quantity_in ELSE 0 END) as total_purchased,
  SUM(CASE WHEN st.movement_type IN ('SALE', 'TREATMENT_CONSUMPTION') THEN st.quantity_out ELSE 0 END) as total_consumed,
  COUNT(DISTINCT CASE WHEN ib.status = 'ACTIVE' THEN ib.id END) as active_batches,
  COUNT(DISTINCT CASE WHEN ib.status = 'EXPIRED' THEN ib.id END) as expired_batches
FROM inventory_products p
LEFT JOIN current_stock cs ON p.id = cs.product_id
LEFT JOIN stock_transactions st ON p.id = st.product_id
LEFT JOIN inventory_batches ib ON p.id = ib.product_id
GROUP BY p.id, p.name;

CREATE MATERIALIZED VIEW mv_patient_analytics AS
SELECT 
  p.id as patient_id,
  DATE_PART('year', AGE(p.date_of_birth)) as age,
  p.gender,
  p.city,
  COUNT(DISTINCT a.id) as visit_count,
  MAX(a.appointment_date) as last_visit_date,
  MIN(a.appointment_date) as first_visit_date,
  AVG(COALESCE(f.rating, 0)) as avg_satisfaction,
  COUNT(DISTINCT pp.id) as active_packages
FROM patients p
LEFT JOIN appointments a ON p.id = a.patient_id
LEFT JOIN patient_feedback f ON p.id = f.patient_id
LEFT JOIN package_purchases pp ON p.id = pp.patient_id AND pp.is_active = true
GROUP BY p.id;

-- View refresh trigger
CREATE OR REPLACE FUNCTION refresh_analytics_views() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_revenue;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_doctor_performance;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_treatment_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_inventory_analytics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_patient_analytics;
END;
$$ LANGUAGE plpgsql;
