import { Category } from "../types";
import { uid } from "./format";
import { AQUA, LIME, PUNCH, ZEST } from "./palette";

export type TemplateCategoryDef = Omit<Category, "id">;

export interface Template {
  id: string;
  name: string;
  description: string;
  categories: TemplateCategoryDef[];
}

// One ink per job, held steady across every template: needs are punch,
// wants are zest, savings are lime. Those three are the palette's opening
// run and they are what a reader sees before touching anything.
//
// A template that carries a fourth category — the money you set aside
// rather than spend — takes aqua, which is the next ink along. That is the
// same order `App.addCategory` walks, so the fourth card a template ships
// and the fourth card a reader adds come out the same colour rather than
// two different ones. Violet closes the run and belongs to no template; it
// is the fifth, and the first ink past anything shipped.
export const TEMPLATES: Template[] = [
  {
    id: "default",
    name: "Default",
    description: "The standard 50/30/20 rule.",
    categories: [
      {
        name: "Needs",
        icon: "Wallet",
        color: PUNCH,
        percent: 50,
      },
      {
        name: "Wants",
        icon: "ShoppingBag",
        color: ZEST,
        percent: 30,
      },
      {
        name: "Savings",
        icon: "PiggyBank",
        color: LIME,
        percent: 20,
      },
    ],
  },
  {
    id: "student",
    name: "Student",
    description: "No rent, food, or utilities to cover yet.",
    categories: [
      {
        name: "Needs",
        icon: "GraduationCap",
        color: PUNCH,
        percent: 30,
      },
      {
        name: "Wants",
        icon: "ShoppingBag",
        color: ZEST,
        percent: 40,
      },
      {
        name: "Savings",
        icon: "PiggyBank",
        color: LIME,
        percent: 30,
      },
    ],
  },
  {
    id: "freelancer",
    name: "Freelancer",
    description: "Sets aside tax money and a slow-month buffer first.",
    categories: [
      {
        name: "Needs",
        icon: "Wallet",
        color: PUNCH,
        percent: 40,
      },
      {
        name: "Tax & buffer",
        icon: "Landmark",
        color: AQUA,
        percent: 15,
      },
      {
        name: "Wants",
        icon: "ShoppingBag",
        color: ZEST,
        percent: 20,
      },
      {
        name: "Savings",
        icon: "PiggyBank",
        color: LIME,
        percent: 25,
      },
    ],
  },
  {
    id: "debt-payoff",
    name: "Debt payoff",
    description: "Clears what you owe before anything discretionary.",
    categories: [
      {
        name: "Needs",
        icon: "Wallet",
        color: PUNCH,
        percent: 50,
      },
      {
        name: "Wants",
        icon: "ShoppingBag",
        color: ZEST,
        percent: 10,
      },
      {
        name: "Debt payoff",
        icon: "CreditCard",
        color: AQUA,
        percent: 20,
      },
      {
        name: "Savings",
        icon: "PiggyBank",
        color: LIME,
        percent: 20,
      },
    ],
  },
  {
    id: "aggressive-saver",
    name: "Aggressive saver",
    description: "Lean spending, maximum savings and investing.",
    categories: [
      {
        name: "Needs",
        icon: "Wallet",
        color: PUNCH,
        percent: 40,
      },
      {
        name: "Wants",
        icon: "ShoppingBag",
        color: ZEST,
        percent: 15,
      },
      {
        name: "Savings & investments",
        icon: "TrendingUp",
        color: LIME,
        percent: 45,
      },
    ],
  },
];

export const defaultCategories = (): Category[] =>
  instantiateTemplate(TEMPLATES[0]);

export const instantiateTemplate = (template: Template): Category[] =>
  template.categories.map((c) => ({ ...c, id: uid() }));

/**
 * Which template the current split came from, or null once it has been
 * edited away from all of them. Derived rather than stored, so the
 * masthead chip and the gallery's "already your split" state stay
 * honest the moment a percentage changes.
 */
export const matchTemplate = (categories: Category[]): Template | null =>
  TEMPLATES.find(
    (t) =>
      t.categories.length === categories.length &&
      t.categories.every(
        (def, i) =>
          def.name === categories[i].name &&
          def.percent === Number(categories[i].percent),
      ),
  ) ?? null;

/** The split a set of categories reads as: "50 / 30 / 20". */
export const splitOf = (categories: Category[]): string =>
  categories.map((c) => Math.round(Number(c.percent) || 0)).join(" / ");
