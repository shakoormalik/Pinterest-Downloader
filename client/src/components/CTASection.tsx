import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-pink-500 opacity-90"></div>
      
      <motion.div 
        className="max-w-4xl mx-auto relative z-10 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Start Downloading?
        </h2>
        <p className="text-white text-opacity-90 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already enjoying high-quality Pinterest content downloads with PinDown.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="inline-block px-8 py-4 bg-white text-primary font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          asChild
        >
          <a href="#downloader">
            Download Now for Free
          </a>
        </Button>
        
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
            <CheckCircle className="text-white mr-2 h-5 w-5" />
            <span className="text-white font-medium">No registration</span>
          </div>
          <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
            <CheckCircle className="text-white mr-2 h-5 w-5" />
            <span className="text-white font-medium">No watermarks</span>
          </div>
          <div className="flex items-center bg-white bg-opacity-20 rounded-full px-4 py-2">
            <CheckCircle className="text-white mr-2 h-5 w-5" />
            <span className="text-white font-medium">Unlimited downloads</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
