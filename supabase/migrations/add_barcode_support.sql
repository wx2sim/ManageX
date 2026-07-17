ALTER TABLE items ADD COLUMN IF NOT EXISTS barcode TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS alternate_barcodes TEXT[] DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS items_barcode_unique 
  ON items(barcode) WHERE barcode IS NOT NULL;
