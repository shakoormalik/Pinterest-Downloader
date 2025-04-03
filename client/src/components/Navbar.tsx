import { useState, useEffect } from "react";
import { Link } from "wouter";
import ThemeToggle from "@/components/ThemeToggle";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we should hide the navbar
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHiding(true);
      } else {
        setIsHiding(false);
      }
      
      // Determine if we should add the shadow
      if (currentScrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav 
      className={cn(
        "fixed w-full bg-white dark:bg-dark-bg shadow-md z-50 transition-all duration-300",
        isHiding && "transform -translate-y-full",
        !isScrolled && "shadow-none"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-primary text-2xl transform -rotate-45">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" transform="rotate(135 12 12)"></path>
                </svg>
              </span>
              <span className="font-bold text-xl text-secondary dark:text-dark-text">PinDown</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <a href="#home" className="text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary transition duration-200">Home</a>
              <a href="#features" className="text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary transition duration-200">Features</a>
              <a href="#how-it-works" className="text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary transition duration-200">How It Works</a>
              <a href="#faq" className="text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 border-transparent hover:border-primary transition duration-200">FAQ</a>
            </div>
          </div>
          <div className="flex items-center">
            <ThemeToggle className="mr-4" />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <HamburgerMenuIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden bg-white dark:bg-dark-bg shadow-md ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <a 
            href="#home" 
            className="block px-3 py-2 rounded-md text-base font-medium text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary hover:bg-neutral-200 dark:hover:bg-dark-card"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </a>
          <a 
            href="#features" 
            className="block px-3 py-2 rounded-md text-base font-medium text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary hover:bg-neutral-200 dark:hover:bg-dark-card"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Features
          </a>
          <a 
            href="#how-it-works" 
            className="block px-3 py-2 rounded-md text-base font-medium text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary hover:bg-neutral-200 dark:hover:bg-dark-card"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            How It Works
          </a>
          <a 
            href="#faq" 
            className="block px-3 py-2 rounded-md text-base font-medium text-neutral-500 dark:text-dark-text hover:text-primary dark:hover:text-primary hover:bg-neutral-200 dark:hover:bg-dark-card"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            FAQ
          </a>
        </div>
      </div>
    </nav>
  );
}
