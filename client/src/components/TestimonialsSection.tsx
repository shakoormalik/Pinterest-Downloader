import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface TestimonialProps {
  rating: number;
  text: string;
  name: string;
  role: string;
  initials: string;
  delay: number;
}

function Testimonial({ rating, text, name, role, initials, delay }: TestimonialProps) {
  return (
    <motion.div 
      className="bg-white dark:bg-dark-card rounded-xl shadow-md p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center mb-4">
        <div className="text-primary">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`inline-block h-4 w-4 ${i < rating ? 'fill-current' : 'fill-none'}`}
            />
          ))}
        </div>
        <span className="ml-2 text-neutral-500 dark:text-neutral-400">{rating.toFixed(1)}</span>
      </div>
      <p className="text-neutral-600 dark:text-neutral-300 mb-4">
        {text}
      </p>
      <div className="flex items-center">
        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center text-neutral-500 dark:text-neutral-400">{initials}</div>
        <div className="ml-3">
          <p className="font-medium text-secondary dark:text-dark-text">{name}</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const testimonials = [
    {
      rating: 5,
      text: "I use Pinterest all the time for my design work. This downloader is a game-changer - so fast and easy to use! The HD quality is perfect for my projects.",
      name: "Jessica D.",
      role: "Graphic Designer",
      initials: "JD",
    },
    {
      rating: 5,
      text: "Best Pinterest downloader I've found! I love that I can download videos in HD quality. The download history feature is super convenient too.",
      name: "Michael R.",
      role: "Content Creator",
      initials: "MR",
    },
    {
      rating: 4.5,
      text: "I was looking for a way to save Pinterest videos for my mood boards. This tool is exactly what I needed - simple, fast, and completely free!",
      name: "Sarah L.",
      role: "Fashion Blogger",
      initials: "SL",
    },
  ];

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-secondary dark:text-dark-text mb-4">
            What Our Users Say
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300 max-w-2xl mx-auto">
            Join thousands of happy users who download Pinterest content with PinDown
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial 
              key={index}
              rating={testimonial.rating}
              text={testimonial.text}
              name={testimonial.name}
              role={testimonial.role}
              initials={testimonial.initials}
              delay={0.1 * index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
