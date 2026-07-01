/**
 * BUSINESS LOGIC: Money Input / Output & Equations
 * 
 * This file serves as the centralized source of truth for all mathematical 
 * financial operations. It determines what adds to the balance (debt/owed) 
 * and what subtracts from it (payments).
 *
 * THE CORE EQUATION:
 * Net Balance = (Total Debt Added) - (Total Payments Made)
 * 
 * - When Net Balance > 0: The Resident owes the House money.
 * - When Net Balance < 0: The House owes the Resident money (Credit).
 *
 * COMPONENT USAGE:
 * - StatsTable.tsx -> calculateTransactionSummary() -> To show global income/spent/profit.
 * - ItemList.tsx (Service Cart) -> calculateCartTotal() -> Realtime cart amount before checkout.
 * - (DB Views compute net_balance using similar rules).
 */

import { Transaction, TransactionItem } from './types';

export interface TransactionSummary {
  income: number;    // Money collected (payments + positive instant profits)
  spent: number;     // Money paid out (negative instant profits / losses)
  debtAdded: number; // Liabilities registered (services + duties + fixed payments)
  profit: number;    // Net margin (income - spent)
  bonusReceived: number; // Isolated bucket for bonuses received from residents
}

/**
 * Calculates summary metrics (income, spent, debt added, profit, bonusReceived) from a list of transactions.
 * 
 * THE RULES (What affects what):
 * 1. Payments -> counts as Income (decreases Resident's net_balance).
 * 2. Bonuses -> counts as Bonus Received (Isolated bucket, does NOT affect Resident's net_balance).
 * 3. Instant Profits -> if positive, Income; if negative, Spent (Does NOT affect Resident's net_balance).
 * 4. Services, Duties, Fixed Payments -> counts as Debt Added (increases Resident's net_balance).
 * 
 * @param transactions - Array of transactions to process
 * @returns An object containing the calculated financial summary
 */
export function calculateTransactionSummary(transactions: Transaction[]): TransactionSummary {
  let income = 0;   
  let spent = 0;    
  let debtAdded = 0;
  let bonusReceived = 0;

  transactions.forEach((tx) => {
    const amt = Number(tx.amount);
    
    if (tx.type === 'payment') {
      income += amt;
    } else if (tx.type === 'bonus') {
      bonusReceived += amt;
    } else if (tx.type === 'instant_profit') {
      if (amt > 0) {
        income += amt;
      } else {
        spent += Math.abs(amt);
      }
    } else if (tx.type === 'market_expense') {
      spent += Math.abs(amt);
    } else if (tx.type === 'service' || tx.type === 'duty' || tx.type === 'fixed_payment') {
      debtAdded += amt;
    }
  });

  return {
    income,
    spent,
    debtAdded,
    profit: income - spent,
    bonusReceived,
  };
}

/**
 * Calculates the total selling value of a list of items in the shopping cart.
 * 
 * RULE: (Quantity * Unit Sell Price)
 * Used by ItemList.tsx to show real-time cart cost.
 * This cost will eventually be recorded as a 'Service' transaction, INCREASING Resident's debt.
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
