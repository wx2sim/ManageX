-- Drop the view first to avoid column mismatch errors
DROP VIEW IF EXISTS girl_balances CASCADE;

-- Recreate the view with ALL required columns in the correct order
CREATE VIEW girl_balances AS
SELECT 
  g.id AS girl_id,
  g.profile_id,
  g.name,
  g.avatar_url,
  g.start_date,
  g.position,
  g.is_active,
  g.account_type,
  g.status,
  
  -- Calculate monthly paid (sum of positive transactions this month)
  COALESCE(SUM(CASE WHEN t.amount > 0 AND date_trunc('month', t.created_at) = date_trunc('month', CURRENT_DATE) THEN t.amount ELSE 0 END), 0) AS monthly_paid,
  
  -- Calculate monthly debt (sum of negative transactions this month as a positive absolute value)
  COALESCE(SUM(CASE WHEN t.amount < 0 AND date_trunc('month', t.created_at) = date_trunc('month', CURRENT_DATE) THEN ABS(t.amount) ELSE 0 END), 0) AS monthly_debt,
  
  -- Calculate total balances
  COALESCE(SUM(t.amount), 0) AS net_balance,
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN t.amount ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN t.type = 'duty' THEN t.amount ELSE 0 END), 0) AS total_duties,
  COALESCE(SUM(CASE WHEN t.type = 'service' THEN t.amount ELSE 0 END), 0) AS total_services

FROM girls g
LEFT JOIN transactions t ON g.id = t.girl_id
GROUP BY g.id, g.profile_id, g.name, g.avatar_url, g.start_date, g.position, g.is_active, g.account_type, g.status;

-- Reload schema
NOTIFY pgrst, 'reload schema';
