import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Theme state: light / dark / follow-system.
 *
 * The class on <html> is what Tailwind's `dark:` variants and the token
 * overrides in styles/tailwind.css key off. It is set in THREE places and
 * they have to agree:
 *
 *   1. the inline boot script in index.html -- before first paint, so a rep
 *      on dark mode never gets a white flash while the bundle parses;
 *   2. this provider, on mount and on every change;
 *   3. the OS listener below, while the preference is "system".
 *
 * The storage key and the class name are shared with the boot script. If you
 * rename either, rename it there too -- they are deliberately duplicated
 * because the script has to run before any module loads.
 */
export const THEME_STORAGE_KEY = "crm_theme";

const ThemeContext = createContext(null);

const prefersDark = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const readStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
  } catch {
    // Storage can be disabled; the theme still works, it just will not persist.
    return "system";
  }
};

/** The colour the OS paints the status bar / browser chrome with. */
const META_THEME_COLOR = { light: "#FAF8F6", dark: "#0E1116" };

const applyTheme = (resolved) => {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  // `color-scheme` makes form controls, scrollbars and the native date picker
  // render in their dark variants -- without it a date input is a white slab
  // in the middle of a dark form.
  root.style.colorScheme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", META_THEME_COLOR[resolved]);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(readStoredTheme);
  const [systemDark, setSystemDark] = useState(prefersDark);

  const resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  // Track the OS setting even while an explicit preference is active, so
  // switching back to "system" is instantly correct rather than one render
  // behind.
  useEffect(() => {
    if (typeof window?.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event) => setSystemDark(event.matches);

    // Safari < 14 has no addEventListener on MediaQueryList.
    if (query.addEventListener) query.addEventListener("change", onChange);
    else query.addListener(onChange);

    return () => {
      if (query.removeEventListener) query.removeEventListener("change", onChange);
      else query.removeListener(onChange);
    };
  }, []);

  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore -- see readStoredTheme
    }
  }, []);

  /**
   * Toggle resolves to the OPPOSITE OF WHAT IS ON SCREEN, and commits it as
   * an explicit choice. Cycling light -> dark -> system instead would mean a
   * tap that visibly changes nothing whenever the OS already matches, which
   * reads as a broken button. "Follow system" stays available in Settings.
   */
  const toggleTheme = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  const value = useMemo(
    () => ({ theme, resolved, isDark: resolved === "dark", setTheme, toggleTheme }),
    [theme, resolved, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
