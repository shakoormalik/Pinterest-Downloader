import { useState, useCallback, memo, lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import DownloaderSection from "@/components/DownloaderSection";
import ErrorModal from "@/components/ErrorModal";
import { PinterestMedia } from "@/types/pinterest";

// Lazy-loaded components for performance optimization
const LazyFeaturesSection = lazy(() => import("@/components/FeaturesSection"));
const LazyHowItWorksSection = lazy(() => import("@/components/HowItWorksSection"));
const LazyTestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const LazyFAQSection = lazy(() => import("@/components/FAQSection"));
const LazyCTASection = lazy(() => import("@/components/CTASection"));
const LazyFooter = lazy(() => import("@/components/Footer"));

// Simple loading component for lazy sections
const SectionLoader = memo(() => (
  <div className="w-full py-12 flex justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
));
SectionLoader.displayName = 'SectionLoader';

// Memoized error modal component for better performance
const MemoizedErrorModal = memo(ErrorModal);
MemoizedErrorModal.displayName = 'MemoizedErrorModal';

export default function Home() {
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorDetails, setErrorDetails] = useState({
    message: "",
    details: ""
  });

  // Memoized callback functions to prevent unnecessary re-renders
  const handleDownloadSuccess = useCallback((media: PinterestMedia) => {
    // The download happens directly from the DownloaderSection component
    // We keep this function for future extensions if needed
  }, []);

  const handleDownloadError = useCallback((message: string, details: string = "") => {
    setErrorDetails({ message, details });
    setIsErrorModalOpen(true);
  }, []);

  const handleCloseErrorModal = useCallback(() => {
    setIsErrorModalOpen(false);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        {/* Critical path components loaded eagerly */}
        <Hero />
        <DownloaderSection 
          onDownloadSuccess={handleDownloadSuccess}
          onDownloadError={handleDownloadError}
        />
        
        {/* Non-critical components loaded lazily */}
        <Suspense fallback={<SectionLoader />}>
          <LazyFeaturesSection />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <LazyHowItWorksSection />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <LazyTestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <LazyFAQSection />
        </Suspense>
        
        <Suspense fallback={<SectionLoader />}>
          <LazyCTASection />
        </Suspense>
      </main>
      
      <Suspense fallback={<SectionLoader />}>
        <LazyFooter />
      </Suspense>
      
      <MemoizedErrorModal 
        isOpen={isErrorModalOpen}
        onClose={handleCloseErrorModal}
        message={errorDetails.message}
        details={errorDetails.details}
      />
    </>
  );
}
