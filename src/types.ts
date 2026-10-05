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

export interface Expense {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  created_at: string;
}

export interface ExpenseDraft {
  title: string;
  amount: string;
  categoryId: string;
}

export interface ExpenseErrors {
  title?: string;
  amount?: string;
  categoryId?: string;
}

export interface Config {
  salary: number;
  categories: Category[];
  expenses?: Expense[];
}
