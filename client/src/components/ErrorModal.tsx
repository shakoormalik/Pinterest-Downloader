import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  details?: string;
}

export default function ErrorModal({ isOpen, onClose, message, details }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full z-10 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-300" />
          </div>
          <h3 className="text-xl font-semibold text-secondary dark:text-dark-text mb-2">Oops! Something went wrong</h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {message || "We couldn't process this URL. Please make sure it's a valid Pinterest link."}
          </p>
          {details && (
            <div className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg text-left mb-6">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                {details}
              </p>
            </div>
          )}
          <Button
            className="w-full"
            onClick={onClose}
          >
            Try Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
