export type TransactionType =
  | 'service'
  | 'payment'
  | 'bonus'
  | 'duty'
  | 'instant_profit'
  | 'fixed_payment'
  | 'market_expense'
  | 'euro_extraction'
  | 'dzd_extraction';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Girl {
  id: string;
  profile_id: string;
  name: string;
  avatar_url: string | null;
  start_date: string;
  position: number;
  is_active: boolean; // Legacy
  account_type: 'resident' | 'nuitee' | 'admin';
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
}

export interface GirlBalance {
  girl_id: string;
  profile_id: string;
  name: string;
  avatar_url: string | null;
  start_date: string;
  position: number;
  is_active: boolean;
  account_type: 'resident' | 'nuitee' | 'admin';
  status: 'active' | 'archived' | 'blocked';
  monthly_paid: number;
  monthly_debt: number;
  net_balance: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string | null;
  position: number;
  created_at: string;
}

export interface ServiceSubcategory {
  id: string;
  category_id: string;
  name: string;
  icon: string | null;
  position: number;
  created_at: string;
}

export interface Item {
  id: string;
  profile_id: string;
  subcategory_id: string | null;
  name: string;
  item_type: 'raw_material' | 'finished';
  unit: string;
  image_url: string | null;
  cost_price: number;
  sell_price: number;
  stock_quantity: number;
  min_stock_alert?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  girl_id: string | null;
  profile_id: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  transaction_date: string;
  created_at: string;
  currency?: string;
  euro_amount?: number;
  exchange_rate?: number;
  destination?: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  unit_sell_price: number;
  unit_cost_price: number;
  total_sell_price: number;
  total_cost_price: number;
}

export interface FixedPaymentTemplate {
  id: string;
  girl_id: string;
  name: string;
  default_amount: number;
  recurrence_interval_days: number | null;
  last_executed_at: string | null;
  next_execution_date: string | null;
  created_at: string;
}

export interface Bonus {
  id: string;
  girl_id: string;
  transaction_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface InstantProfit {
  id: string;
  profile_id: string;
  transaction_id: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface MarketInput {
  id: string;
  profile_id: string;
  item_id: string;
  quantity: number;
  unit_buy_price: number;
  unit_sell_price: number;
  total_worth: number;
  shopping_date: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  finished_product_id: string;
  profile_id: string;
  batch_quantity: number;
  created_at: string;
  finished_product?: Item;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  raw_material_id: string;
  quantity_needed: number;
  raw_material?: Item;
}
