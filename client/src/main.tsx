import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Use a self-executing function to hydrate the app
(async () => {
  // Add event listener for browser paint completion
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      const root = createRoot(document.getElementById("root")!);
      root.render(<App />);
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      const root = createRoot(document.getElementById("root")!);
      root.render(<App />);
    }, 0);
  }
})();
