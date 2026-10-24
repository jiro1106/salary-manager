export type Theme = "system" | "light" | "dark";

const KEY = "salary-manager:theme";

// A per-reader preference rather than part of the config, so it bypasses
// `storage`: a theme that fails to save costs nothing worth an alert.
export function storedTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: Theme = storedTheme()) {
  const dark =
    theme === "dark" ||
    (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // still applies for this visit
  }
  applyTheme(theme);
}
