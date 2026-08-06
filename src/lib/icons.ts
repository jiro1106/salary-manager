import {
  PiggyBank,
  Wallet,
  ShoppingBag,
  GraduationCap,
  Landmark,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Category } from "../types";

/**
 * A category wears one mark, and this is where it comes from. Typed
 * against the union so a new Category.icon member fails the build here
 * rather than silently falling back to Wallet at runtime.
 */
export const ICONS: Record<Category["icon"], LucideIcon> = {
  PiggyBank,
  Wallet,
  ShoppingBag,
  GraduationCap,
  Landmark,
  CreditCard,
  TrendingUp,
};

/**
 * The component for a category's icon, with a fallback for a value left
 * in localStorage by a scheme that had icons this one doesn't.
 */
export const iconOf = (icon: Category["icon"]): LucideIcon =>
  ICONS[icon] || Wallet;
