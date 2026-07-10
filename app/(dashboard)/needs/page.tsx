import { createClient } from '@/lib/supabase/server';
import NeedsClientView from '@/components/needs/NeedsClientView';

export default async function NeedsPage() {
  const supabase = await createClient();

  // Fetch items, girls, and needs
  const [
    { data: items },
    { data: girls },
    { data: needs }
  ] = await Promise.all([
    supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
    supabase
      .from('girls')
      .select('id, name, account_type')
      .eq('status', 'active')
      .order('name', { ascending: true }),
    supabase
      .from('needs')
      .select('*, girls(name)')
      .order('created_at', { ascending: false })
  ]);

  // Derive Stock Alerts
  // Active alerts: stock_quantity is below or equal to min_stock_alert (defaulting to 0 if null)
  // AND there is no completed stock alert need recorded for it.
  const completedStockItemIds = new Set(
    (needs || [])
      .filter(n => n.type === 'stock_alert' && n.is_completed)
      .map(n => n.item_id)
  );

  const activeStockAlerts = (items || []).filter(item => {
    const alertThreshold = item.min_stock_alert !== null ? item.min_stock_alert : 0;
    const isBelowThreshold = item.stock_quantity <= alertThreshold;
    return isBelowThreshold && !completedStockItemIds.has(item.id);
  });

  // Completed Stock Alerts: Needs records of type stock_alert within the last 30 days
  // (Filter out alerts for items that have been restocked - stock_quantity > threshold)
  const completedStockAlerts = (needs || []).filter(n => {
    if (n.type !== 'stock_alert' || !n.is_completed) return false;
    const targetItem = (items || []).find(i => i.id === n.item_id);
    if (!targetItem) return false; // Item deleted
    
    // Check if it's older than 30 days
    const completedDate = new Date(n.completed_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (completedDate < thirtyDaysAgo) return false;

    const alertThreshold = targetItem.min_stock_alert !== null ? targetItem.min_stock_alert : 0;
    return targetItem.stock_quantity <= alertThreshold; // If restocked, it shouldn't show up at all
  });

  // Resident Demands
  const activeDemands = (needs || []).filter(n => n.type === 'resident_demand' && !n.is_completed);
  
  const completedDemands = (needs || []).filter(n => {
    if (n.type !== 'resident_demand' || !n.is_completed) return false;
    
    const completedDate = new Date(n.completed_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return completedDate >= thirtyDaysAgo;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-pink-600 font-bold font-sans">Shopping & Demands</p>
        {/* Removed hardcoded untranslated header */}
        <p className="text-xs text-zinc-500 mt-1">
          Manage stock alerts and resident shopping requests side-by-side.
        </p>
      </div>

      <NeedsClientView
        items={items || []}
        girls={girls || []}
        activeStockAlerts={activeStockAlerts}
        completedStockAlerts={completedStockAlerts}
        activeDemands={activeDemands}
        completedDemands={completedDemands}
      />
    </div>
  );
}
