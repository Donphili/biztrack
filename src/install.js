import { useEffect, useState } from "react";

let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

// Registered as soon as the app starts, because the browser can fire this before the page is drawn.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  notify();
});
window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  notify();
});

export function useInstall() {
  const [, refresh] = useState(0);
  useEffect(() => {
    const listener = () => refresh((count) => count + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    notify();
  }

  return { canInstall: Boolean(deferredPrompt), standalone, ios, install };
}
