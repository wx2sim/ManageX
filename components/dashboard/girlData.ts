export interface GirlProfile {
  id: string;
  name: string;
  initials: string;
  status: string;
  balance: number;
  debt: number;
}

export interface ServiceEntry {
  name: string;
  category: string;
  amount: number;
}

export interface DailyConsumption {
  date: string;
  services: ServiceEntry[];
}

export interface MonthlyService {
  name: string;
  amount: number;
  dueDate: string;
}

export interface PaymentEntry {
  date: string;
  amount: number;
  method: string;
  note: string;
}

export interface BonusEntry {
  date: string;
  amount: number;
  recipient: string;
  note: string;
}

export interface InstantProfitEntry {
  date: string;
  amount: number;
  type: "profit" | "loss";
  description: string;
}

export interface MonthlyStat {
  month: string;
  balance: number;
  debt: number;
  income: number;
  spent: number;
}

export interface CategorySummary {
  category: string;
  count: number;
  totalAmount: number;
}

export interface GirlProfileDetail extends GirlProfile {
  createdAt: string;
  phone: string;
  stayType: "Permanent" | "Temporary";
  monthlyStats: MonthlyStat[];
  serviceCategories: CategorySummary[];
  dailyConsumption: DailyConsumption[];
  monthlyServices: MonthlyService[];
  payments: PaymentEntry[];
  bonuses: BonusEntry[];
  instantProfits: InstantProfitEntry[];
}

export const girlProfiles: GirlProfileDetail[] = [
  {
    id: "1",
    name: "Lina",
    initials: "L",
    status: "Active",
    balance: 182450,
    debt: 5600,
    createdAt: "2024-08-14",
    phone: "+213 555 123 456",
    stayType: "Permanent",
    monthlyStats: [
      { month: "This month", balance: 182450, debt: 5600, income: 252000, spent: 69550 },
      { month: "Last month", balance: 158300, debt: 8400, income: 238000, spent: 72300 },
    ],
    serviceCategories: [
      { category: "Room Service", count: 12, totalAmount: 81000 },
      { category: "Wellness", count: 8, totalAmount: 54000 },
      { category: "Transport", count: 5, totalAmount: 16500 },
      { category: "Meals", count: 14, totalAmount: 57000 },
    ],
    monthlyServices: [
      { name: "Rent", amount: 105000, dueDate: "2026-07-01" },
      { name: "Wi-Fi", amount: 9500, dueDate: "2026-06-30" },
      { name: "Cleaning (4 weeks)", amount: 26000, dueDate: "2026-07-05" },
    ],
    payments: [
      { date: "2026-06-21", amount: 23000, method: "Cash", note: "Debt reduction" },
      { date: "2026-06-18", amount: 15000, method: "Card", note: "Partial payment" },
    ],
    bonuses: [
      { date: "2026-06-10", amount: 1200, recipient: "Room Service", note: "Extra service reward" },
      { date: "2026-06-05", amount: 800, recipient: "Wellness", note: "Spa assistance" },
    ],
    instantProfits: [
      { date: "2026-06-22", amount: 5200, type: "profit", description: "Sell extra wardrobe item" },
      { date: "2026-06-16", amount: 1800, type: "loss", description: "Immediate delivery fee" },
    ],
    dailyConsumption: [
      { date: "2026-06-22", services: [{ name: "Spa treatment", category: "Wellness", amount: 12000 }, { name: "Dinner", category: "Meals", amount: 4500 }] },
      { date: "2026-06-21", services: [{ name: "Room service", category: "Room Service", amount: 7200 }] },
      { date: "2026-06-20", services: [{ name: "Taxi", category: "Transport", amount: 3300 }, { name: "Breakfast", category: "Meals", amount: 2400 }] },
      { date: "2026-06-19", services: [{ name: "Gym access", category: "Wellness", amount: 8500 }] },
      { date: "2026-06-18", services: [{ name: "Laundry", category: "Room Service", amount: 5200 }] },
      { date: "2026-06-17", services: [{ name: "Dinner", category: "Meals", amount: 4600 }] },
      { date: "2026-06-16", services: [{ name: "Room service", category: "Room Service", amount: 6900 }] },
      { date: "2026-06-15", services: [{ name: "Massage", category: "Wellness", amount: 13000 }] },
      { date: "2026-06-14", services: [{ name: "Airport pickup", category: "Transport", amount: 7200 }] },
      { date: "2026-06-13", services: [{ name: "Lunch", category: "Meals", amount: 5200 }] },
    ],
  },
  {
    id: "2",
    name: "Maya",
    initials: "M",
    status: "Reserved",
    balance: 97400,
    debt: 14800,
    createdAt: "2025-01-03",
    phone: "+213 555 987 654",
    stayType: "Temporary",
    monthlyStats: [
      { month: "This month", balance: 97400, debt: 14800, income: 164000, spent: 66600 },
      { month: "Last month", balance: 89500, debt: 21000, income: 158000, spent: 68500 },
    ],
    serviceCategories: [
      { category: "Room Service", count: 8, totalAmount: 39000 },
      { category: "Wellness", count: 5, totalAmount: 30000 },
      { category: "Meals", count: 12, totalAmount: 29000 },
      { category: "Transport", count: 4, totalAmount: 12000 },
    ],
    monthlyServices: [
      { name: "Rent", amount: 85000, dueDate: "2026-06-30" },
      { name: "Wi-Fi", amount: 9300, dueDate: "2026-07-02" },
      { name: "Cleaning (4 weeks)", amount: 22000, dueDate: "2026-07-06" },
    ],
    payments: [
      { date: "2026-06-20", amount: 18000, method: "Card", note: "Debt payment" },
      { date: "2026-06-15", amount: 9000, method: "Cash", note: "Partial settlement" },
    ],
    bonuses: [
      { date: "2026-06-12", amount: 1400, recipient: "Transport", note: "Driver tip" },
      { date: "2026-06-08", amount: 600, recipient: "Meals", note: "Meal service reward" },
    ],
    instantProfits: [
      { date: "2026-06-22", amount: 4200, type: "profit", description: "Sold unused cosmetics" },
      { date: "2026-06-18", amount: 2200, type: "loss", description: "Emergency voucher" },
    ],
    dailyConsumption: [
      { date: "2026-06-22", services: [{ name: "Lunch", category: "Meals", amount: 5100 }] },
      { date: "2026-06-21", services: [{ name: "Spa session", category: "Wellness", amount: 11000 }] },
      { date: "2026-06-20", services: [{ name: "Room service", category: "Room Service", amount: 5200 }] },
      { date: "2026-06-19", services: [{ name: "Dinner", category: "Meals", amount: 4800 }] },
      { date: "2026-06-18", services: [{ name: "Gym pass", category: "Wellness", amount: 7800 }] },
      { date: "2026-06-17", services: [{ name: "Taxi", category: "Transport", amount: 4200 }] },
      { date: "2026-06-16", services: [{ name: "Breakfast", category: "Meals", amount: 2300 }] },
      { date: "2026-06-15", services: [{ name: "Room service", category: "Room Service", amount: 6400 }] },
      { date: "2026-06-14", services: [{ name: "Massage", category: "Wellness", amount: 9800 }] },
      { date: "2026-06-13", services: [{ name: "Airport shuttle", category: "Transport", amount: 7600 }] },
    ],
  },
  {
    id: "3",
    name: "Sara",
    initials: "S",
    status: "Available",
    balance: 212300,
    debt: 3200,
    createdAt: "2024-11-20",
    phone: "+213 555 456 789",
    stayType: "Permanent",
    monthlyStats: [
      { month: "This month", balance: 212300, debt: 3200, income: 294000, spent: 78800 },
      { month: "Last month", balance: 203400, debt: 4200, income: 285000, spent: 81600 },
    ],
    serviceCategories: [
      { category: "Room Service", count: 15, totalAmount: 93000 },
      { category: "Meals", count: 16, totalAmount: 68000 },
      { category: "Wellness", count: 9, totalAmount: 49500 },
      { category: "Transport", count: 7, totalAmount: 24000 },
    ],
    monthlyServices: [
      { name: "Rent", amount: 110000, dueDate: "2026-07-03" },
      { name: "Wi-Fi", amount: 9800, dueDate: "2026-07-01" },
      { name: "Cleaning (4 weeks)", amount: 28000, dueDate: "2026-07-04" },
    ],
    payments: [
      { date: "2026-06-22", amount: 32000, method: "Card", note: "Debt reduction" },
      { date: "2026-06-14", amount: 16000, method: "Cash", note: "Partial settlement" },
    ],
    bonuses: [
      { date: "2026-06-19", amount: 1700, recipient: "Wellness", note: "Premium service reward" },
      { date: "2026-06-12", amount: 900, recipient: "Meals", note: "Waitstaff tip" },
    ],
    instantProfits: [
      { date: "2026-06-20", amount: 6800, type: "profit", description: "Sold extra electronics" },
      { date: "2026-06-18", amount: 2500, type: "loss", description: "Immediate delivery fee" },
    ],
    dailyConsumption: [
      { date: "2026-06-22", services: [{ name: "Dinner", category: "Meals", amount: 5200 }, { name: "Taxi", category: "Transport", amount: 3900 }] },
      { date: "2026-06-21", services: [{ name: "Room service", category: "Room Service", amount: 8400 }] },
      { date: "2026-06-20", services: [{ name: "Spa", category: "Wellness", amount: 12500 }] },
      { date: "2026-06-19", services: [{ name: "Breakfast", category: "Meals", amount: 2700 }] },
      { date: "2026-06-18", services: [{ name: "Gym session", category: "Wellness", amount: 9000 }] },
      { date: "2026-06-17", services: [{ name: "Room service", category: "Room Service", amount: 7600 }] },
      { date: "2026-06-16", services: [{ name: "Lunch", category: "Meals", amount: 6200 }] },
      { date: "2026-06-15", services: [{ name: "Transport", category: "Transport", amount: 4300 }] },
      { date: "2026-06-14", services: [{ name: "Wellness kit", category: "Wellness", amount: 7200 }] },
      { date: "2026-06-13", services: [{ name: "Room service", category: "Room Service", amount: 7100 }] },
    ],
  },
];

export function getGirlProfileById(id: string) {
  return girlProfiles.find((profile) => profile.id === id);
}
