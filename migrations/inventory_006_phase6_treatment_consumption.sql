-- ============================================================
-- AYURSHALA INVENTORY SYSTEM
-- Migration: inventory_006_phase6_treatment_consumption.sql
-- Phase 6: Panchakarma Treatment Inventory Automation
-- ============================================================

BEGIN;

-- ============================================================
-- TABLE: treatment_recipes
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_recipes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_name   TEXT NOT NULL,
  treatment_code   TEXT UNIQUE NOT NULL,
  description      TEXT,
  is_active        BOOLEAN DEFAULT TRUE,
  clinic_id        UUID,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE treatment_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipes_select" ON treatment_recipes;
DROP POLICY IF EXISTS "recipes_modify" ON treatment_recipes;

CREATE POLICY "recipes_select" ON treatment_recipes
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "recipes_modify" ON treatment_recipes
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TABLE: treatment_recipe_items
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_recipe_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id   UUID NOT NULL REFERENCES treatment_recipes(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES inventory_products(id),
  quantity    NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  unit        TEXT NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe  ON treatment_recipe_items(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_items_product ON treatment_recipe_items(product_id);

ALTER TABLE treatment_recipe_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_items_select" ON treatment_recipe_items;
DROP POLICY IF EXISTS "recipe_items_modify" ON treatment_recipe_items;

CREATE POLICY "recipe_items_select" ON treatment_recipe_items
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "recipe_items_modify" ON treatment_recipe_items
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST')
  );

-- ============================================================
-- TABLE: treatment_consumptions
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_consumptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id   UUID,                        -- references bookings.id when integrated
  treatment_id     UUID REFERENCES treatment_recipes(id),
  patient_name     TEXT,
  consumption_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status           TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
  notes            TEXT,
  created_by       UUID REFERENCES auth.users(id),
  clinic_id        UUID,
  is_deleted       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consumption_treatment   ON treatment_consumptions(treatment_id);
CREATE INDEX IF NOT EXISTS idx_consumption_appointment ON treatment_consumptions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consumption_date        ON treatment_consumptions(consumption_date);

ALTER TABLE treatment_consumptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "consumption_select" ON treatment_consumptions;
DROP POLICY IF EXISTS "consumption_modify" ON treatment_consumptions;

CREATE POLICY "consumption_select" ON treatment_consumptions
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "consumption_modify" ON treatment_consumptions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

-- ============================================================
-- TABLE: treatment_consumption_items
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_consumption_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumption_id  UUID NOT NULL REFERENCES treatment_consumptions(id) ON DELETE CASCADE,
  product_id      UUID NOT NULL REFERENCES inventory_products(id),
  batch_id        UUID REFERENCES inventory_batches(id),
  quantity        NUMERIC(10,3) NOT NULL CHECK (quantity > 0),
  unit            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ci_consumption ON treatment_consumption_items(consumption_id);
CREATE INDEX IF NOT EXISTS idx_ci_product     ON treatment_consumption_items(product_id);

ALTER TABLE treatment_consumption_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ci_select" ON treatment_consumption_items;
DROP POLICY IF EXISTS "ci_modify" ON treatment_consumption_items;

CREATE POLICY "ci_select" ON treatment_consumption_items
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'DOCTOR', 'RECEPTIONIST')
  );

CREATE POLICY "ci_modify" ON treatment_consumption_items
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth_user_role() IN ('ADMIN', 'PHARMACIST', 'RECEPTIONIST')
  );

-- ============================================================
-- FUNCTION: create_treatment_consumption
-- Prepares consumption record using FIFO batch selection
-- ============================================================
CREATE OR REPLACE FUNCTION create_treatment_consumption(
  p_treatment_id    UUID,
  p_appointment_id  UUID DEFAULT NULL,
  p_patient_name    TEXT DEFAULT NULL,
  p_created_by      UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_consumption_id  UUID;
  v_recipe_item     RECORD;
  v_fifo_batch      RECORD;
  v_qty_needed      NUMERIC;
BEGIN
  -- Create consumption header
  INSERT INTO treatment_consumptions (
    appointment_id, treatment_id, patient_name, status, created_by
  ) VALUES (
    p_appointment_id, p_treatment_id, p_patient_name, 'PENDING', p_created_by
  ) RETURNING id INTO v_consumption_id;

  -- For each recipe item, allocate FIFO batches
  FOR v_recipe_item IN
    SELECT ri.*, p.unit AS product_unit
    FROM treatment_recipe_items ri
    JOIN inventory_products p ON p.id = ri.product_id
    WHERE ri.recipe_id = p_treatment_id
  LOOP
    v_qty_needed := v_recipe_item.quantity;

    -- Get FIFO batches
    FOR v_fifo_batch IN
      SELECT * FROM get_fifo_batches(v_recipe_item.product_id, v_qty_needed::INTEGER)
    LOOP
      INSERT INTO treatment_consumption_items (
        consumption_id, product_id, batch_id, quantity, unit
      ) VALUES (
        v_consumption_id,
        v_recipe_item.product_id,
        v_fifo_batch.batch_id,
        v_fifo_batch.available_qty,
        v_recipe_item.unit
      );
    END LOOP;
  END LOOP;

  RETURN v_consumption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: complete_treatment_consumption
-- Marks consumption as completed, reduces stock
-- ============================================================
CREATE OR REPLACE FUNCTION complete_treatment_consumption(
  p_consumption_id  UUID,
  p_completed_by    UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_consumption  treatment_consumptions%ROWTYPE;
  v_item         treatment_consumption_items%ROWTYPE;
  v_recipe       treatment_recipes%ROWTYPE;
BEGIN
  SELECT * INTO v_consumption FROM treatment_consumptions WHERE id = p_consumption_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Consumption not found: %', p_consumption_id; END IF;
  IF v_consumption.status != 'PENDING' THEN RAISE EXCEPTION 'Consumption already processed'; END IF;

  SELECT * INTO v_recipe FROM treatment_recipes WHERE id = v_consumption.treatment_id;

  FOR v_item IN SELECT * FROM treatment_consumption_items WHERE consumption_id = p_consumption_id
  LOOP
    -- Create stock transaction
    INSERT INTO stock_transactions (
      transaction_type, product_id, batch_id,
      reference_type, reference_id, reference_number,
      quantity_in, quantity_out, created_by, notes
    ) VALUES (
      'CONSUMPTION',
      v_item.product_id,
      v_item.batch_id,
      'TREATMENT', p_consumption_id,
      COALESCE(v_recipe.treatment_code, 'TREATMENT'),
      0, v_item.quantity::INTEGER,
      p_completed_by,
      'Treatment: ' || COALESCE(v_recipe.treatment_name, '')
    );

    -- Update batch remaining quantity
    IF v_item.batch_id IS NOT NULL THEN
      UPDATE inventory_batches
      SET remaining_quantity = remaining_quantity - v_item.quantity::INTEGER,
          updated_at = NOW()
      WHERE id = v_item.batch_id;

      UPDATE inventory_batches
      SET status = 'CONSUMED'
      WHERE id = v_item.batch_id AND remaining_quantity <= 0;
    END IF;
  END LOOP;

  UPDATE treatment_consumptions
  SET status = 'COMPLETED', updated_at = NOW()
  WHERE id = p_consumption_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED: Treatment recipes (references products by name lookup)
-- These will be linked to actual product IDs once products exist
-- Using placeholders — update after products are created
-- ============================================================
INSERT INTO treatment_recipes (treatment_name, treatment_code, description) VALUES
  ('Abhyanga',       'ABHYANGA',    'Full body Ayurvedic oil massage'),
  ('Shirodhara',     'SHIRODHARA',  'Continuous oil stream on forehead'),
  ('Njavarakizhi',   'NJAVARAKIZHI','Njavara rice bolus massage'),
  ('Kizhi',          'KIZHI',       'Herbal bolus massage'),
  ('Virechana',      'VIRECHANA',   'Therapeutic purgation'),
  ('Basti',          'BASTI',       'Medicated enema therapy'),
  ('Nasya',          'NASYA',       'Nasal oil administration'),
  ('Swedana',        'SWEDANA',     'Steam therapy')
ON CONFLICT (treatment_code) DO NOTHING;

DROP TRIGGER IF EXISTS trg_consumption_updated_at ON treatment_consumptions;
CREATE TRIGGER trg_consumption_updated_at
  BEFORE UPDATE ON treatment_consumptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
