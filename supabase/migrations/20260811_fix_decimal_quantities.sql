-- SQL Migration: Update column types for decimal quantities

-- 1. Drop stale trigger on items table
DROP TRIGGER IF EXISTS clear_needs_on_restock_trigger ON public.items;

-- 2. Drop generated columns on transaction_items table
ALTER TABLE public.transaction_items DROP COLUMN IF EXISTS total_sell_price;
ALTER TABLE public.transaction_items DROP COLUMN IF EXISTS total_cost_price;

-- 3. Change column types to NUMERIC(10, 3) for decimal support
ALTER TABLE public.transaction_items 
  ALTER COLUMN quantity TYPE NUMERIC(10, 3) USING quantity::NUMERIC(10, 3);

ALTER TABLE public.items 
  ALTER COLUMN stock_quantity TYPE NUMERIC(10, 3) USING stock_quantity::NUMERIC(10, 3);

-- 4. Re-add generated column on transaction_items
ALTER TABLE public.transaction_items 
  ADD COLUMN total_sell_price NUMERIC(10, 2) GENERATED ALWAYS AS (quantity * unit_sell_price) STORED;

-- 5. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
