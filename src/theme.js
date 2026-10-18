import { useSyncExternalStore } from "react";

const KEY = "biztrack:theme";
const listeners = new Set();

function readInitial() {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Storage unavailable: fall through to the system preference.
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

let current = readInitial();
document.documentElement.dataset.theme = current;

export function getTheme() {
  return current;
}

export function setTheme(next) {
  current = next;
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // Ignore: the choice just will not be remembered.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")];
}
