-- ============================================================
-- AYURSHALA INVENTORY v2 — MIGRATION 004b: FUNCTIONS
-- Part B: GRN Post Transaction + Stock Adjustment Post
-- Run after 004a_functions_utility.sql
-- ============================================================

BEGIN;

-- ============================================================
-- FUNCTION: fn_post_grn
--
-- THE most critical function in the inventory system.
-- Wraps the entire GRN posting sequence in ONE transaction:
--
--   1. Validate GRN is in 'draft' status
--   2. Validate all items have product_uuid + batch_number
--   3. For each GRN item:
--      a. Upsert inv_product_batches (create if new batch)
--      b. Read before_stock from batch.available_quantity
--      c. INSERT into inv_stock_movements (PURCHASE type)
--      d. Batch quantity cache is updated by trigger
--         (fn_update_batch_available_quantity)
--      e. Update PO item received_quantity (if PO linked)
--   4. Update GRN status to 'posted'
--   5. INSERT audit log entry
--
-- If ANY step fails → entire transaction rolls back.
-- No partial inventory updates possible.
--
-- Parameters:
--   p_grn_uuid   UUID   — the GRN to post
--   p_user_uuid  UUID   — the user performing the post
--
-- Returns: JSONB with { success, grn_number, items_processed, movements_created }
-- ============================================================

CREATE OR REPLACE FUNCTION fn_post_grn(
  p_grn_uuid  UUID,
  p_user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_grn               inv_goods_receipts%ROWTYPE;
  v_item              inv_goods_receipt_items%ROWTYPE;
  v_batch             inv_product_batches%ROWTYPE;
  v_before_stock      NUMERIC(12,2);
  v_after_stock       NUMERIC(12,2);
  v_total_qty         NUMERIC(12,2);
  v_items_processed   INTEGER := 0;
  v_movements_created INTEGER := 0;
BEGIN

  -- -------------------------------------------------------
  -- 1. Lock and validate GRN
  -- -------------------------------------------------------
  SELECT * INTO v_grn
  FROM inv_goods_receipts
  WHERE uuid = p_grn_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'GRN not found: %', p_grn_uuid;
  END IF;

  IF v_grn.status != 'draft' THEN
    RAISE EXCEPTION 'GRN % is in status %. Only draft GRNs can be posted.',
      v_grn.grn_number, v_grn.status;
  END IF;

  -- -------------------------------------------------------
  -- 2. Validate at least one item exists
  -- -------------------------------------------------------
  IF NOT EXISTS (
    SELECT 1 FROM inv_goods_receipt_items WHERE grn_uuid = p_grn_uuid
  ) THEN
    RAISE EXCEPTION 'GRN % has no items. Add items before posting.', v_grn.grn_number;
  END IF;

  -- -------------------------------------------------------
  -- 3. Process each GRN item
  -- -------------------------------------------------------
  FOR v_item IN
    SELECT * FROM inv_goods_receipt_items
    WHERE grn_uuid = p_grn_uuid
    ORDER BY created_at
  LOOP
    v_total_qty := v_item.received_qty + v_item.free_qty;

    -- 3a. Upsert product batch
    --     If batch_number already exists for this product → update prices + add received qty
    --     If new → create the batch
    INSERT INTO inv_product_batches (
      product_uuid,
      batch_number,
      manufacturing_date,
      expiry_date,
      purchase_price,
      mrp,
      selling_price,
      received_quantity,
      available_quantity,
      supplier_uuid,
      grn_uuid,
      status,
      created_by
    )
    VALUES (
      v_item.product_uuid,
      v_item.batch_number,
      v_item.manufacturing_date,
      v_item.expiry_date,
      v_item.purchase_price,
      v_item.mrp,
      v_item.selling_price,
      v_total_qty,
      0,             -- available_quantity starts at 0; trigger will add after movement INSERT
      v_grn.supplier_uuid,
      p_grn_uuid,
      'good',
      NULL           -- Service role automation: audit field is NULL (no authenticated user)
    )
    ON CONFLICT (batch_number) DO UPDATE
      SET
        purchase_price     = EXCLUDED.purchase_price,
        mrp                = EXCLUDED.mrp,
        selling_price      = EXCLUDED.selling_price,
        received_quantity  = inv_product_batches.received_quantity + EXCLUDED.received_quantity,
        grn_uuid           = EXCLUDED.grn_uuid,   -- update to most recent GRN
        updated_at         = NOW(),
        updated_by         = NULL;  -- Service role automation: NULL for audit field

    -- Fetch the batch to get current available_quantity (before_stock)
    SELECT * INTO v_batch
    FROM inv_product_batches
    WHERE batch_number = v_item.batch_number
    FOR UPDATE;

    -- before_stock = current cache value BEFORE this movement updates it
    -- Since we just inserted/upserted and the trigger has not fired yet
    -- (we're about to insert the movement), before_stock = current available_quantity
    v_before_stock := v_batch.available_quantity;
    v_after_stock  := v_before_stock + v_total_qty;

    -- 3b. Insert stock movement
    INSERT INTO inv_stock_movements (
      product_uuid,
      batch_uuid,
      movement_type,
      quantity,
      before_stock,
      after_stock,
      reference_type,
      reference_uuid,
      remarks,
      created_by
    )
    VALUES (
      v_item.product_uuid,
      v_batch.uuid,
      'PURCHASE',
      v_total_qty,
      v_before_stock,
      v_after_stock,
      'GRN',
      p_grn_uuid,
      'GRN posted: ' || v_grn.grn_number,
      NULL           -- Service role automation: NULL for audit field
    );
    -- The trigger fn_update_batch_available_quantity fires here automatically
    -- and updates batch.available_quantity += v_total_qty

    v_movements_created := v_movements_created + 1;

    -- 3c. Update PO item received_quantity if this item is linked to a PO
    IF v_item.po_item_uuid IS NOT NULL THEN
      UPDATE inv_purchase_order_items
      SET
        received_quantity = received_quantity + v_item.received_qty,
        updated_at        = NOW()
      WHERE uuid = v_item.po_item_uuid;
      -- The trigger fn_update_po_status_on_receipt fires here automatically
    END IF;

    v_items_processed := v_items_processed + 1;
  END LOOP;

  -- -------------------------------------------------------
  -- 4. Mark GRN as posted
  -- -------------------------------------------------------
  UPDATE inv_goods_receipts
  SET
    status      = 'posted',
    updated_at  = NOW(),
    updated_by  = NULL  -- Service role automation: NULL for audit field
  WHERE uuid = p_grn_uuid;

  -- -------------------------------------------------------
  -- 5. Audit log
  -- -------------------------------------------------------
  INSERT INTO inv_audit_log (module, action, record_uuid, new_value, performed_by)
  VALUES (
    'GRN',
    'POST',
    p_grn_uuid,
    jsonb_build_object(
      'grn_number',        v_grn.grn_number,
      'items_processed',   v_items_processed,
      'movements_created', v_movements_created
    ),
    NULL  -- Service role automation: NULL for audit field
  );

  -- -------------------------------------------------------
  -- 6. Return result
  -- -------------------------------------------------------
  RETURN jsonb_build_object(
    'success',            TRUE,
    'grn_number',         v_grn.grn_number,
    'items_processed',    v_items_processed,
    'movements_created',  v_movements_created
  );

EXCEPTION WHEN OTHERS THEN
  -- Re-raise to ensure the outer transaction rolls back
  RAISE EXCEPTION 'fn_post_grn failed for GRN %: %', p_grn_uuid, SQLERRM;
END;
$$;

COMMENT ON FUNCTION fn_post_grn(UUID, UUID) IS
  'Posts a GRN. All operations (batch upsert, stock movement, PO update) '
  'run inside one atomic transaction. '
  'On any failure the entire operation rolls back — no partial inventory updates.';


-- ============================================================
-- FUNCTION: fn_post_stock_adjustment
--
-- Posts an approved stock adjustment.
-- For each adjustment item, inserts a stock_movement.
-- The movement type is always ADJUSTMENT.
-- Direction (increase/decrease) encoded in before_stock/after_stock.
--
-- Parameters:
--   p_adj_uuid   UUID   — adjustment to post
--   p_user_uuid  UUID   — approver
-- ============================================================

CREATE OR REPLACE FUNCTION fn_post_stock_adjustment(
  p_adj_uuid  UUID,
  p_user_uuid UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_adj           inv_stock_adjustments%ROWTYPE;
  v_item          inv_stock_adjustment_items%ROWTYPE;
  v_batch         inv_product_batches%ROWTYPE;
  v_before_stock  NUMERIC(12,2);
  v_after_stock   NUMERIC(12,2);
  v_delta         NUMERIC(12,2);
  v_items_posted  INTEGER := 0;
BEGIN

  -- Lock and validate adjustment
  SELECT * INTO v_adj
  FROM inv_stock_adjustments
  WHERE uuid = p_adj_uuid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock adjustment not found: %', p_adj_uuid;
  END IF;

  IF v_adj.status != 'draft' THEN
    RAISE EXCEPTION 'Adjustment % is in status %. Only draft adjustments can be approved.',
      v_adj.adjustment_number, v_adj.status;
  END IF;

  -- Process each item
  FOR v_item IN
    SELECT * FROM inv_stock_adjustment_items
    WHERE adjustment_uuid = p_adj_uuid
    ORDER BY created_at
  LOOP

    -- Get current batch stock
    IF v_item.batch_uuid IS NOT NULL THEN
      SELECT * INTO v_batch
      FROM inv_product_batches
      WHERE uuid = v_item.batch_uuid
      FOR UPDATE;

      v_before_stock := v_batch.available_quantity;
    ELSE
      -- Non-batch product: sum from movements
      v_before_stock := fn_get_product_stock(v_item.product_uuid);
    END IF;

    -- Compute delta
    IF v_item.adjustment_type = 'INCREASE' THEN
      v_delta       := ABS(v_item.difference);
      v_after_stock := v_before_stock + v_delta;
    ELSE
      v_delta       := ABS(v_item.difference);
      v_after_stock := GREATEST(0, v_before_stock - v_delta);
      -- If delta > available_stock, cap at zero and adjust delta
      IF v_before_stock < v_delta THEN
        v_delta := v_before_stock;
      END IF;
    END IF;

    -- Don't create zero-quantity movements
    IF v_delta = 0 THEN
      CONTINUE;
    END IF;

    INSERT INTO inv_stock_movements (
      product_uuid,
      batch_uuid,
      movement_type,
      quantity,
      before_stock,
      after_stock,
      reference_type,
      reference_uuid,
      remarks,
      created_by
    )
    VALUES (
      v_item.product_uuid,
      v_item.batch_uuid,
      'ADJUSTMENT',
      v_delta,
      v_before_stock,
      v_after_stock,
      'ADJUSTMENT',
      p_adj_uuid,
      COALESCE(v_item.reason_note, v_adj.reason || ': ' || v_adj.adjustment_number),
      NULL  -- Service role automation: NULL for audit field
    );

    v_items_posted := v_items_posted + 1;
  END LOOP;

  -- Mark as approved
  UPDATE inv_stock_adjustments
  SET
    status      = 'approved',
    approved_by = NULL,  -- Service role automation: NULL for audit field
    approved_at = NOW(),
    updated_at  = NOW(),
    updated_by  = NULL   -- Service role automation: NULL for audit field
  WHERE uuid = p_adj_uuid;

  -- Audit log
  INSERT INTO inv_audit_log (module, action, record_uuid, new_value, performed_by)
  VALUES (
    'ADJUSTMENT',
    'APPROVE',
    p_adj_uuid,
    jsonb_build_object(
      'adjustment_number', v_adj.adjustment_number,
      'reason',            v_adj.reason,
      'items_posted',      v_items_posted
    ),
    NULL  -- Service role automation: NULL for audit field
  );

  RETURN jsonb_build_object(
    'success',       TRUE,
    'adj_number',    v_adj.adjustment_number,
    'items_posted',  v_items_posted
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'fn_post_stock_adjustment failed for %: %', p_adj_uuid, SQLERRM;
END;
$$;

COMMENT ON FUNCTION fn_post_stock_adjustment(UUID, UUID) IS
  'Approves and posts a stock adjustment. '
  'Each item creates a stock_movement. Batch quantity updated by trigger. '
  'Fully transactional — rolls back on any failure.';

COMMIT;
