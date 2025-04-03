import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-100 dark:bg-dark-card">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-secondary dark:text-dark-text mb-4">
            How It Works
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300 max-w-2xl mx-auto">
            Download your favorite Pinterest content in three simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <motion.div 
              className="bg-white dark:bg-dark-bg rounded-xl shadow-md p-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-3">Paste Pinterest URL</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Copy the URL of any Pinterest pin from the Pinterest app or website and paste it into our downloader.
              </p>
              <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-700 rounded-lg mt-4 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="400" height="200" fill="#f2f2f2" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#666">Copy Pinterest URL</text>
                </svg>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              className="bg-white dark:bg-dark-bg rounded-xl shadow-md p-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-3">Select Format</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Choose your preferred download format - HD video, HD image, or standard image depending on your needs.
              </p>
              <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-700 rounded-lg mt-4 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="400" height="200" fill="#f2f2f2" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#666">Select Format</text>
                </svg>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              className="bg-white dark:bg-dark-bg rounded-xl shadow-md p-6 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-3">Download Content</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                Preview your content and click the download button. The file will be saved directly to your device.
              </p>
              <div className="w-full h-40 bg-neutral-200 dark:bg-neutral-700 rounded-lg mt-4 overflow-hidden flex items-center justify-center">
                <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="400" height="200" fill="#f2f2f2" />
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fill="#666">Download Content</text>
                </svg>
              </div>
            </motion.div>
          </div>

          {/* Connecting Line (Desktop only) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-neutral-300 dark:bg-neutral-600 transform -translate-y-1/2 z-0"></div>
        </div>
        
        {/* Demo GIF */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-6">See It In Action</h3>
          <div className="bg-white dark:bg-dark-bg p-4 rounded-xl shadow-lg inline-block">
            <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden w-full max-w-2xl mx-auto aspect-video relative">
              <svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="800" height="450" fill="#e0e0e0" />
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="24" fill="#767676">Demo of Pinterest Downloader</text>
              </svg>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <button className="w-16 h-16 bg-primary bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center transition duration-300">
                  <PlayCircle className="h-10 w-10 text-white" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
