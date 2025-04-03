import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SunIcon, MoonIcon } from "lucide-react";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    if (theme === "light") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  return (
    <button 
      onClick={toggleTheme}
      className={cn(
        "bg-neutral-200 dark:bg-neutral-500 rounded-full w-12 h-6 flex items-center p-1 focus:outline-none",
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className={cn(
        "toggle-circle bg-white dark:bg-dark-text rounded-full w-4 h-4 flex items-center justify-center shadow transition-transform duration-300",
        theme === "dark" && "transform translate-x-6"
      )}>
        {theme === "dark" ? (
          <MoonIcon className="h-3 w-3" />
        ) : (
          <SunIcon className="h-3 w-3 text-yellow-500" />
        )}
      </div>
    </button>
  );
}
