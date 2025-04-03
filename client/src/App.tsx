import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect, lazy, Suspense, memo, createContext, useContext } from "react";

// Create theme context for better performance
type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// Export theme hook for components to use
export const useTheme = () => useContext(ThemeContext);

// Lazy loaded routes with dynamic imports for code splitting
const LazyHome = lazy(() => import("@/pages/Home"));
const LazyNotFound = lazy(() => import("@/pages/not-found"));

// Memo-ized loading component to prevent unnecessary re-renders
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

// Memo-ized router component
const Router = memo(() => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        <Route path="/" component={LazyHome} />
        <Route component={LazyNotFound} />
      </Switch>
    </Suspense>
  );
});
Router.displayName = 'Router';

// Apply theme script runs before React hydration to avoid flash
// This script is added to the document in a useEffect with the highest priority
const createThemeScript = () => {
  const script = document.createElement('script');
  script.innerHTML = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.setAttribute('data-theme', theme);
      } catch (e) {}
    })();
  `;
  script.id = 'theme-script';
  return script;
};

function App() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  // First priority effect - runs once on initial render
  useEffect(() => {
    // Only add script if it doesn't exist
    if (!document.getElementById('theme-script')) {
      document.head.prepend(createThemeScript());
    }
    
    // Read theme directly
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = storedTheme || (prefersDark ? "dark" : "light");
    
    setTheme(initialTheme);
    setIsThemeLoaded(true);
    
    // Set theme attribute for CSS variables
    document.documentElement.setAttribute('data-theme', initialTheme);
    
    // Cleanup
    return () => {
      const script = document.getElementById('theme-script');
      if (script) script.remove();
    };
  }, []);

  // Update document when theme changes (but not on first load)
  useEffect(() => {
    if (!isThemeLoaded) return;
    
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem("theme", theme);
  }, [theme, isThemeLoaded]);

  // Memoized toggle function
  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  // Theme provider value
  const themeContextValue = {
    theme,
    toggleTheme
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={themeContextValue}>
        <div className="min-h-screen bg-background text-foreground font-sans">
          <Router />
        </div>
        <Toaster />
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
