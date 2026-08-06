import { Category } from "../types";
import { TEMPLATES, instantiateTemplate } from "./templates";

// The seed palette lives in ./palette alongside its cut edges, because a
// face colour is never used without one. Re-exported here so the old
// import site keeps working.
export { CATEGORY_COLORS } from "./palette";

export const defaultCategories = (): Category[] =>
  instantiateTemplate(TEMPLATES[0]);
