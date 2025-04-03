import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQSection() {
  const faqs: FAQItem[] = [
    {
      question: "Is this service completely free?",
      answer: "Yes, PinDown is 100% free to use. We don't charge any fees, and there are no hidden costs. You can download as many Pinterest videos and images as you want without paying anything."
    },
    {
      question: "Is it legal to download Pinterest content?",
      answer: "Our service is designed for personal use only. Please respect copyright laws and Pinterest's terms of service. Do not download content for commercial purposes without proper permissions from the content creators."
    },
    {
      question: "What formats can I download Pinterest content in?",
      answer: "You can download Pinterest content in multiple formats: HD Video (MP4), HD Image (high resolution), and Standard Image (regular resolution). Choose the format that best suits your needs."
    },
    {
      question: "Can I download multiple pins at once?",
      answer: "Currently, our tool supports downloading one pin at a time. However, you can use it as many times as you need without any limits. We're working on adding batch download functionality in a future update."
    },
    {
      question: "Do you store my downloaded content?",
      answer: "No, we don't store any content you download. Your downloads go directly to your device. We only keep a reference to your recent downloads in your browser's local storage for convenience, but this data never leaves your device."
    }
  ];

  return (
    <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-100 dark:bg-dark-card">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-secondary dark:text-dark-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300">
            Everything you need to know about PinDown
          </p>
        </motion.div>

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="bg-white dark:bg-dark-bg rounded-lg shadow-md overflow-hidden mb-4">
                <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-neutral-50 dark:hover:bg-neutral-800">
                  <span className="font-medium text-secondary dark:text-dark-text text-left">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-neutral-600 dark:text-neutral-300">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
