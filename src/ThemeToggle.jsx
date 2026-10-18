import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme";

export default function ThemeToggle({ className = "icon-button" }) {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
