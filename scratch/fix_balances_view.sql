-- 1. Drop view to avoid column mismatch issues
DROP VIEW IF EXISTS girl_balances CASCADE;

-- 2. Recreate the view using transaction_date for date calculations
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
  
  -- Payé Ce Mois: DZD payments this month for services
  COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.destination = 'service_debt' AND date_trunc('month', t.transaction_date) = date_trunc('month', CURRENT_DATE) THEN ABS(t.amount) ELSE 0 END), 0) AS monthly_paid,
  
  -- Dette Ce Mois: services + duties consumed this month
  COALESCE(SUM(CASE WHEN t.type IN ('service', 'duty') AND date_trunc('month', t.transaction_date) = date_trunc('month', CURRENT_DATE) THEN ABS(t.amount) ELSE 0 END), 0) AS monthly_debt,
  
  -- Solde de Compte (Services Debt)
  COALESCE(SUM(CASE WHEN t.type IN ('service', 'duty') THEN -ABS(t.amount) WHEN (t.type = 'payment' AND t.destination = 'service_debt') THEN ABS(t.amount) ELSE 0 END), 0) AS net_balance,
  
  -- Totaux existants
  COALESCE(SUM(CASE WHEN t.type = 'payment' THEN ABS(t.amount) ELSE 0 END), 0) AS total_payments,
  COALESCE(SUM(CASE WHEN t.type = 'duty' THEN ABS(t.amount) ELSE 0 END), 0) AS total_duties,
  COALESCE(SUM(CASE WHEN t.type = 'service' THEN ABS(t.amount) ELSE 0 END), 0) AS total_services,
  
  -- Solde Loyer (Recurring Debt)
  COALESCE(SUM(CASE WHEN t.type = 'fixed_payment' THEN -ABS(t.amount) WHEN (t.type = 'payment' AND t.destination = 'recurring_debt') THEN ABS(t.amount) ELSE 0 END), 0) AS recurring_balance,
  
  -- Coffre Euro (Euro Vault)
  COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.currency = 'euro' THEN t.euro_amount WHEN t.type = 'euro_extraction' THEN -ABS(t.euro_amount) ELSE 0 END), 0) AS euro_vault_balance,
  
  -- Coffre DZD Rent Vault (Frais Récurrents payés - Extractions DZD)
  COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.destination = 'recurring_debt' AND t.currency = 'dzd' THEN t.amount WHEN t.type = 'dzd_extraction' THEN -ABS(t.amount) ELSE 0 END), 0) AS dzd_vault_balance,

  -- Profit Rent Bot (Cumulative collected)
  COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.destination = 'recurring_debt' AND t.currency = 'euro' THEN t.euro_amount ELSE 0 END), 0) AS total_euro_rent,
  COALESCE(SUM(CASE WHEN t.type = 'payment' AND t.destination = 'recurring_debt' AND t.currency = 'dzd' THEN ABS(t.amount) ELSE 0 END), 0) AS total_dzd_rent

FROM girls g
LEFT JOIN transactions t ON g.id = t.girl_id
GROUP BY g.id, g.profile_id, g.name, g.avatar_url, g.start_date, g.position, g.is_active, g.account_type, g.status;

-- 3. Notify schema reload
NOTIFY pgrst, 'reload schema';
