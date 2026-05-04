import type { ThemeAccent, ThemeMode } from "@/types/viewer";

const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

export function getSystemThemeMode(): Exclude<ThemeMode, "system"> {
  return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function applyTheme(themeMode: ThemeMode, themeAccent: ThemeAccent) {
  const resolvedTheme = themeMode === "system" ? getSystemThemeMode() : themeMode;
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.dataset.theme = resolvedTheme;
  root.dataset.themeMode = themeMode;
  root.dataset.accent = themeAccent;
}

export function subscribeSystemTheme(
  callback: () => void,
): () => void {
  const media = window.matchMedia(THEME_MEDIA_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
