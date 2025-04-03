import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Film,
  Infinity,
  Smartphone,
  History,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div 
      className="bg-white dark:bg-dark-card rounded-xl shadow-md hover:shadow-lg p-6 transition duration-300 transform hover:translate-y-[-5px]"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-2">{title}</h3>
      <p className="text-neutral-500 dark:text-neutral-400">
        {description}
      </p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="text-primary text-xl" />,
      title: "Lightning Fast",
      description: "Our optimized servers process your request in milliseconds, so you don't have to wait.",
    },
    {
      icon: <Shield className="text-primary text-xl" />,
      title: "100% Safe & Secure",
      description: "We don't store your downloads or personal data. Your privacy is our priority.",
    },
    {
      icon: <Film className="text-primary text-xl" />,
      title: "Multiple Formats",
      description: "Download videos, HD images, or standard images based on your needs.",
    },
    {
      icon: <Infinity className="text-primary text-xl" />,
      title: "Unlimited Downloads",
      description: "No daily limits or restrictions. Download as many pins as you want, completely free.",
    },
    {
      icon: <Smartphone className="text-primary text-xl" />,
      title: "Mobile Friendly",
      description: "Works perfectly on all devices - download pins on your phone, tablet, or computer.",
    },
    {
      icon: <History className="text-primary text-xl" />,
      title: "Download History",
      description: "Keep track of your downloads and easily access them again without re-entering URLs.",
    },
  ];

  return (
    <section id="features" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-secondary dark:text-dark-text mb-4">
            Why Choose PinDown?
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300 max-w-2xl mx-auto">
            We've built the most reliable Pinterest downloader with features you'll actually use
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={0.1 * index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
