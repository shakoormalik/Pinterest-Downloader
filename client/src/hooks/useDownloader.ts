import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { PinterestMedia } from "@/types/pinterest";
import { validatePinterestUrl } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";

type FormatOption = 'hd_video' | 'hd_image' | 'standard_image';

interface UseDownloaderReturn {
  isProcessing: boolean;
  currentMedia: PinterestMedia | null;
  processUrl: (url: string, format: FormatOption) => Promise<PinterestMedia | null>;
  downloadMedia: (media: PinterestMedia) => Promise<void>;
  error: string | null;
}

export default function useDownloader(): UseDownloaderReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<PinterestMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processUrl = async (url: string, format: FormatOption): Promise<PinterestMedia | null> => {
    if (!url) {
      setError("Please enter a Pinterest URL");
      return null;
    }

    if (!validatePinterestUrl(url)) {
      setError("Please enter a valid Pinterest URL");
      return null;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const response = await apiRequest('POST', '/api/media/process', {
        url: url.trim(),
        type: format,
      });
      
      const data = await response.json();
      setCurrentMedia(data);
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred";
      setError(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadMedia = async (media: PinterestMedia): Promise<void> => {
    try {
      if (media.mediaUrl) {
        // Create an anchor element to trigger download
        const link = document.createElement('a');
        link.href = media.mediaUrl;
        link.download = `pinterest-media-${media.id}${media.mediaType === 'video' ? '.mp4' : '.jpg'}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download started",
          description: "Your download has started",
        });
      } else {
        throw new Error("Media URL not found");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download media";
      setError(message);
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  return {
    isProcessing,
    currentMedia,
    processUrl,
    downloadMedia,
    error
  };
}
