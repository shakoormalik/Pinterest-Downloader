import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download } from "lucide-react";
import { PinterestMedia } from "@shared/schema";
import { useEffect } from "react";
import { createConfetti } from "@/utils/confetti";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: PinterestMedia | null;
}

export default function SuccessModal({ isOpen, onClose, media }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      createConfetti();
    }
  }, [isOpen]);

  const handleDownloadMore = () => {
    onClose();
    window.location.href = "#downloader";
  };

  if (!media) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full z-10 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-300" />
          </div>
          <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-2">Download Successful!</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Your Pinterest content has been downloaded successfully.
          </p>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownloadMore}
            >
              <Download className="mr-2 h-4 w-4" />
              Download More
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
