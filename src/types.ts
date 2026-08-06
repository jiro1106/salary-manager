export interface SubCategory {
  id: string;
  name: string;
  percent: number;
}

export interface Category {
  id: string;
  name: string;
  icon:
    | "PiggyBank"
    | "Wallet"
    | "ShoppingBag"
    | "GraduationCap"
    | "Landmark"
    | "CreditCard"
    | "TrendingUp";
  color: string;
  percent: number;
  subs: SubCategory[];
}

export interface HistoryBreakdownItem {
  name: string;
  percent: number;
  amount: number;
}

export interface HistoryEntry {
  id: string;
  date: string;
  salary: number;
  breakdown: HistoryBreakdownItem[];
}

export interface Config {
  salary: number;
  categories: Category[];
}
