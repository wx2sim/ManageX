import { TransactionItem } from '../types';

/**
 * Calculates total profit from a list of transaction items (Sell Price - Cost Price).
 */
export function calculateProfit(items: TransactionItem[]): number {
  return items.reduce((acc, item) => {
    return acc + (item.total_sell_price - item.total_cost_price);
  }, 0);
}
