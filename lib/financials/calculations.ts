import { Transaction, TransactionItem } from '../types';

/**
 * Interface representing the summary metrics calculated from a list of transactions.
 */
export interface TransactionSummary {
  income: number;    // Money collected (payments + positive instant profits)
  spent: number;     // Money paid out (bonuses + negative instant profits / losses)
  debtAdded: number; // Liabilities registered (services + duties + fixed payments)
  profit: number;    // Net margin (income - spent)
}

/**
 * Calculates summary metrics (income, spent, debt added, profit) from a list of transactions.
 * 
 * - Payments are counted as income.
 * - Bonuses are counted as spent.
 * - Instant profits are added to income if positive, or spent if negative.
 * - Services, duties, and fixed payments are considered liabilities (debt added).
 * 
 * @param transactions - Array of transactions to process
 * @returns An object containing the calculated financial summary
 */
export function calculateTransactionSummary(transactions: Transaction[]): TransactionSummary {
  let income = 0;   
  let spent = 0;    
  let debtAdded = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount);
    
    if (tx.type === 'payment') {
      income += amt;
    } else if (tx.type === 'bonus') {
      spent += amt;
    } else if (tx.type === 'instant_profit') {
      if (amt > 0) {
        income += amt;
      } else {
        spent += Math.abs(amt);
      }
    } else if (tx.type === 'service' || tx.type === 'duty' || tx.type === 'fixed_payment') {
      debtAdded += amt;
    }
  });

  return {
    income,
    spent,
    debtAdded,
    profit: income - spent,
  };
}

/**
 * Calculates the total selling value of a list of items in the shopping cart.
 * Multiplies the quantity of each item by its unit sell price.
 * 
 * @param items - Array of items in the cart
 * @returns Total cost to the resident
 */
export function calculateCartTotal(items: { quantity: number; unit_sell_price: number }[]): number {
  return items.reduce((sum, item) => sum + (item.quantity * item.unit_sell_price), 0);
}

/**
 * Calculates total profit from a list of transaction items.
 * Profit is defined as (Total Sell Price - Total Cost Price).
 * 
 * @param items - Array of recorded transaction items
 * @returns Net profit from these items
 */
export function calculateProfit(items: TransactionItem[]): number {
  return items.reduce((acc, item) => {
    return acc + (item.total_sell_price - item.total_cost_price);
  }, 0);
}
