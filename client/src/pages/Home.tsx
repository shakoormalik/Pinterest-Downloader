import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DownloaderSection from "@/components/DownloaderSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import SuccessModal from "@/components/SuccessModal";
import ErrorModal from "@/components/ErrorModal";
import { PinterestMedia } from "@shared/schema";

export default function Home() {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState({
    message: "",
    details: ""
  });
  const [downloadedMedia, setDownloadedMedia] = useState<PinterestMedia | null>(null);

  // Function to handle successful download
  const handleDownloadSuccess = (media: PinterestMedia) => {
    setDownloadedMedia(media);
    setIsSuccessModalOpen(true);
  };

  // Function to handle download errors
  const handleDownloadError = (message: string, details: string = "") => {
    setErrorDetails({ message, details });
    setIsErrorModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <DownloaderSection 
          onDownloadSuccess={handleDownloadSuccess}
          onDownloadError={handleDownloadError}
        />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />

      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)}
        media={downloadedMedia}
      />
      
      <ErrorModal 
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorDetails.message}
        details={errorDetails.details}
      />
    </>
  );
}
