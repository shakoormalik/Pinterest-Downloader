import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, Info } from "lucide-react";

export default function Hero() {
  return (
    <section id="home" className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-secondary dark:text-dark-text leading-tight">
              Download Pinterest <span className="text-primary">Videos & Images</span> in Seconds
            </h1>
            <p className="mt-6 text-lg text-neutral-500 dark:text-neutral-300">
              The fastest, easiest way to save your favorite Pinterest content in high quality - 100% free, no watermarks, no limits.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Button
                size="lg"
                className="px-8 py-6 bg-primary hover:bg-primary/90 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300 flex items-center justify-center"
                asChild
              >
                <a href="#downloader">
                  <span>Start Downloading</span>
                  <ArrowDown className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 bg-neutral-200 dark:bg-dark-card hover:bg-neutral-300 dark:hover:bg-neutral-600 text-secondary dark:text-dark-text font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 flex items-center justify-center"
                asChild
              >
                <a href="#how-it-works">
                  <span>How It Works</span>
                  <Info className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-4">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-600 border-2 border-white dark:border-dark-bg flex items-center justify-center text-xs">U1</div>
                <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-600 border-2 border-white dark:border-dark-bg flex items-center justify-center text-xs">U2</div>
                <div className="w-10 h-10 rounded-full bg-neutral-300 dark:bg-neutral-600 border-2 border-white dark:border-dark-bg flex items-center justify-center text-xs">U3</div>
              </div>
              <div className="text-sm text-neutral-500 dark:text-neutral-300">
                <span className="font-bold">20,000+</span> happy users this month
              </div>
            </div>
          </motion.div>
          <motion.div 
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-full max-w-lg">
              <div className="absolute -top-4 -left-4 w-72 h-72 bg-primary opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
              <div className="absolute -bottom-8 right-4 w-72 h-72 bg-pink-500 opacity-10 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
              <div className="relative">
                <svg className="rounded-2xl shadow-2xl w-full h-auto bg-neutral-100 dark:bg-neutral-800 aspect-square" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
                  <rect width="500" height="500" fill="#f5f5f5" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="24px" fill="#767676">Pinterest Style Image</text>
                </svg>
                <div className="absolute -bottom-4 -right-4 bg-white dark:bg-dark-card rounded-lg shadow-lg p-4 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-secondary dark:text-dark-text">No watermarks, high quality downloads</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
