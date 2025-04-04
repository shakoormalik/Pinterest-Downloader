import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Download, Clipboard, Link, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { validatePinterestUrl } from "@/utils/validation";

import { PinterestMedia } from "@/types/pinterest";
import useLocalStorage from "@/hooks/useLocalStorage";

interface DownloaderSectionProps {
  onDownloadSuccess: (media: PinterestMedia) => void;
  onDownloadError: (message: string, details?: string) => void;
}

type FormatOption = 'hd_video' | 'hd_image' | 'standard_image';

export default function DownloaderSection({ onDownloadSuccess, onDownloadError }: DownloaderSectionProps) {
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>('hd_video');
  const [showPreview, setShowPreview] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<PinterestMedia | null>(null);
  const [recentHistory, setRecentHistory] = useLocalStorage<PinterestMedia[]>("pinterest-history", []);
  const [isSearching, setIsSearching] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // We've removed the automatic URL validation effect
  // Now thumbnail will only be shown when the search button is clicked
  
  // Effect to update tab based on detected media type
  useEffect(() => {
    if (currentMedia) {
      // Set the tab based on detected media type
      if (currentMedia.mediaType === 'video') {
        setActiveTab('video');
        setSelectedFormat('hd_video');
      } else {
        setActiveTab('image');
        setSelectedFormat(currentMedia.quality === 'hd' ? 'hd_image' : 'standard_image');
      }
    }
  }, [currentMedia]);

  // Fetch history from server - we actually use the local storage history instead of server
  const { isLoading: isHistoryLoading } = useQuery({
    queryKey: ['/api/media/history'],
  });

  // Process URL mutation
  const { isPending: isProcessing } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/media/process', {
        url: url.trim(),
        type: selectedFormat,
      });
      return response.json();
    },
    onSuccess: (data: PinterestMedia) => {
      setCurrentMedia(data);
      setShowPreview(true);
      
      // Add to recent history (local)
      const updatedHistory = [data, ...recentHistory.slice(0, 4)];
      setRecentHistory(updatedHistory);
      
      // Invalidate history query
      queryClient.invalidateQueries({ queryKey: ['/api/media/history'] });
      
      // Show success toast
      toast({
        title: "Pinterest media processed!",
        description: "Your content is ready to download.",
      });
      
      // Call parent success handler
      onDownloadSuccess(data);
    },
    onError: (error: any) => {
      console.error("Error processing URL:", error);
      const errorMessage = error.message || "Failed to process Pinterest URL";
      
      // Show error toast
      toast({
        title: "Processing failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Call parent error handler
      onDownloadError(errorMessage, "Please check the URL and try again.");
    }
  });

  // Clear history mutation
  const { mutate: clearHistory } = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/media/clear-history', {});
      return response.json();
    },
    onSuccess: () => {
      // Clear local history too
      setRecentHistory([]);
      
      // Invalidate history query
      queryClient.invalidateQueries({ queryKey: ['/api/media/history'] });
      
      // Show success toast
      toast({
        title: "History cleared",
        description: "Your download history has been cleared.",
      });
    }
  });

  // Paste from clipboard handler
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (validatePinterestUrl(text)) {
        setUrl(text);
        // Removed toast notification to avoid popup
      } else {
        toast({
          title: "Invalid URL",
          description: "The clipboard content is not a valid Pinterest URL",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Clipboard error",
        description: "Could not access clipboard",
        variant: "destructive",
      });
    }
  };

  // Handle download button click
  const handleDownload = () => {
    if (!currentMedia) {
      toast({
        title: "No media to download",
        description: "Please fetch a Pinterest URL first",
        variant: "destructive",
      });
      return;
    }
    
    downloadMedia(currentMedia);
  };

  // Download the current media - optimized for performance
  const downloadMedia = async (mediaItem: PinterestMedia) => {
    try {
      const mediaUrl = mediaItem.mediaUrl;
      
      if (!mediaUrl) {
        throw new Error("No media URL available");
      }
      
      // Create a filename based on media metadata or fallback to ID
      const filename = mediaItem.metadata?.title || 
        `pinterest-${mediaItem.mediaType}-${Date.now().toString(36)}`;
      
      toast({
        title: "Starting download...",
        description: "Preparing your file, please wait.",
      });
      
      try {
        // Use our server endpoint to handle the download (avoids CORS issues)
        const downloadUrl = `/api/media/download/${mediaItem.id}`;
        
        // Open in new tab for direct download
        window.open(downloadUrl, '_blank');
        
        toast({
          title: "Download started",
          description: "Your file should begin downloading automatically.",
        });
      } catch (serverError) {
        console.log("Server download failed, trying direct method:", serverError);
        
        try {
          // Fallback to fetch API for direct download
          const response = await fetch(mediaUrl);
          
          if (!response.ok) throw new Error('Network response was not ok');
          
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          // Create temporary download link
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = filename + (mediaItem.mediaType === 'video' ? '.mp4' : '.jpg');
          document.body.appendChild(a);
          a.click();
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl); // Free memory
          }, 100);
          
          toast({
            title: "Download successful!",
            description: "Your file has been downloaded.",
          });
        } catch (fetchError) {
          console.log("Fetch download failed, falling back to basic link:", fetchError);
          // Last resort fallback
          window.open(mediaUrl, '_blank');
          
          toast({
            title: "Download started in new tab",
            description: "If it doesn't start automatically, right-click and select 'Save As'.",
          });
        }
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download the media. Try again or check your browser settings.",
        variant: "destructive",
      });
    }
  };

  // Copy media link to clipboard
  const copyMediaLink = (mediaUrl: string | null) => {
    if (!mediaUrl) return;
    
    navigator.clipboard.writeText(mediaUrl);
    toast({
      title: "Link copied",
      description: "Media link copied to clipboard",
    });
  };

  // Function to get Pinterest media URL - using direct URLs now since Pinterest blocks proxies
  const getProxiedImageUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    
    // For Pinterest images, ensure we get high quality version
    if (url.includes('pinimg.com')) {
      return url.replace(/\/[0-9]+x\//, '/orig/');
    }
    
    return url;
  };
  
  // Function to get Pinterest video URL with the same approach
  const getProxiedVideoUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    
    // For Pinterest videos, ensure we get high quality version
    if (url.includes('pinimg.com')) {
      return url.replace(/\/[0-9]+x\//, '/orig/');
    }
    
    return url;
  };

  // Format time for display
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <section id="downloader" className="py-16 px-4 sm:px-6 lg:px-8 bg-neutral-100 dark:bg-dark-card">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-secondary dark:text-dark-text mb-4">
            Download Pinterest Content
          </h2>
          <p className="text-neutral-500 dark:text-neutral-300 max-w-2xl mx-auto">
            Simply paste the Pinterest URL and choose your preferred format. We'll handle the rest!
          </p>
        </motion.div>

        <motion.div 
          className="bg-white dark:bg-dark-bg rounded-2xl shadow-xl p-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Downloader Form */}
          <div className="space-y-6">
            <div className="input-focus-effect">
              <label htmlFor="pinterest-url" className="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-2">Pinterest URL</label>
              <div className="flex">
                <Input
                  type="text"
                  id="pinterest-url"
                  placeholder="https://pinterest.com/pin/123456789/"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-grow p-3 rounded-l-lg text-secondary dark:text-dark-text dark:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none border-l-0 p-3"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-5 w-5" />
                </Button>
                <Button
                  type="button"
                  variant="default"
                  disabled={isSearching}
                  className="rounded-l-none rounded-r-lg bg-neutral-900 hover:bg-black text-white dark:bg-neutral-800 dark:hover:bg-neutral-700 px-4 py-3 flex items-center"
                  onClick={async () => {
                    if (url && validatePinterestUrl(url)) {
                      try {
                        // Set loading state first
                        setIsSearching(true);
                        
                        // Process URL to get the actual media
                        const response = await apiRequest('POST', '/api/media/process', {
                          url: url.trim(),
                          type: selectedFormat,
                        });
                        
                        const mediaData: PinterestMedia = await response.json();
                        
                        // Set current media and show the preview immediately
                        setCurrentMedia(mediaData);
                        setShowPreview(true);
                        console.log("Media data from server:", mediaData);
                        
                        // Scroll to the preview section
                        setTimeout(() => {
                          document.getElementById('preview-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                        
                        // Add to recent history (local)
                        const updatedHistory = [mediaData, ...recentHistory.slice(0, 4)];
                        setRecentHistory(updatedHistory);
                        
                        // Invalidate history query
                        queryClient.invalidateQueries({ queryKey: ['/api/media/history'] });
                        
                        toast({
                          title: "Media found!",
                          description: "Pinterest content is ready for download.",
                        });
                      } catch (error: any) {
                        console.error("Error fetching preview:", error);
                        
                        toast({
                          title: "Failed to fetch preview",
                          description: error.message || "Could not process this Pinterest URL",
                          variant: "destructive",
                        });
                        
                        onDownloadError("Failed to fetch preview", "Please check the URL and try again.");
                      } finally {
                        setIsSearching(false);
                      }
                    } else {
                      toast({
                        title: "Invalid URL",
                        description: "Please enter a valid Pinterest URL",
                        variant: "destructive",
                      });
                    }
                  }}
                  title="Search and get preview"
                >
                  {isSearching ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <span className="mr-2">Search</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M15 3h6v6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </>
                  )}
                </Button>
              </div>
              
              {/* Loading indicator - only shows when actively searching */}
              {isSearching && (
                <div className="mt-3">
                  <div className="text-xs text-center text-neutral-500">
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Searching for Pinterest content...
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-500 dark:text-neutral-300 mb-2">Select Format</label>
              
              {/* Tab selector */}
              <div className="grid grid-cols-2 mb-4">
                <button
                  className={`px-4 py-3 font-medium text-sm border ${activeTab === 'video' 
                    ? 'text-white bg-primary border-primary rounded-tl-md' 
                    : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 rounded-tl-md'}`}
                  onClick={() => {
                    setActiveTab('video');
                    setSelectedFormat('hd_video');
                  }}
                >
                  Video
                </button>
                <button
                  className={`px-4 py-3 font-medium text-sm border ${activeTab === 'image' 
                    ? 'text-white bg-primary border-primary rounded-tr-md' 
                    : 'text-neutral-500 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 rounded-tr-md'}`}
                  onClick={() => {
                    setActiveTab('image');
                    setSelectedFormat('hd_image');
                  }}
                >
                  Image
                </button>
              </div>
              
              {/* Format content panel with conditional rendering based on active tab */}
              <div className="border border-neutral-200 dark:border-neutral-700 rounded-b-lg p-5">
                {/* Video format options */}
                {activeTab === 'video' && (
                  <div>
                    {/* Show preview of the video if we have currentMedia */}
                    {currentMedia && currentMedia.mediaType === 'video' && (
                      <div className="mb-4 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">Preview:</div>
                        <div className="flex justify-center">
                          <div className="w-3/4 rounded-md overflow-hidden bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600">
                            <video 
                              src={getProxiedVideoUrl(currentMedia.mediaUrl)}
                              poster={getProxiedImageUrl(currentMedia.thumbnailUrl)}
                              controls
                              className="w-full h-auto object-contain max-h-[150px]"
                              preload="metadata"
                              onError={(e) => {
                                console.log("Format preview video error");
                                const target = e.target as HTMLVideoElement;
                                target.style.display = 'none';
                                target.parentElement?.classList.add('video-error');
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      className={`${selectedFormat === 'hd_video' 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-neutral-600'} 
                        border rounded-lg p-4 cursor-pointer hover:border-primary transition duration-200`}
                      onClick={() => setSelectedFormat('hd_video')}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 ${selectedFormat === 'hd_video' ? 'border-primary' : 'border-neutral-300 dark:border-neutral-500'} flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full ${selectedFormat === 'hd_video' ? 'bg-primary' : ''}`}></div>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-secondary dark:text-dark-text">HD Video</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Best quality (MP4)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Image format options */}
                {activeTab === 'image' && (
                  <div className="space-y-4">
                    {/* Show preview of the image if we have currentMedia */}
                    {currentMedia && currentMedia.mediaType === 'image' && (
                      <div className="mb-4 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 text-center">Preview:</div>
                        <div className="flex justify-center">
                          <div className="w-1/2 rounded-md overflow-hidden bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600">
                            <img 
                              src={getProxiedImageUrl(currentMedia.mediaUrl)}
                              alt="Pinterest image preview" 
                              className="w-full h-auto object-contain"
                              onError={(e) => {
                                console.log("Format preview image error, trying direct URL");
                                const target = e.target as HTMLImageElement;
                                // Try using the original URL directly as a last resort
                                target.src = currentMedia.mediaUrl || '';
                                
                                // If that also fails, show a minimal error state
                                target.onerror = () => {
                                  console.log("All image sources failed");
                                  target.onerror = null; // Prevent infinite loop
                                  target.style.display = 'block';
                                  target.style.minHeight = '100px';
                                  target.alt = "Image unavailable - try downloading directly";
                                };
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div 
                      className={`${selectedFormat === 'hd_image' 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-neutral-600'} 
                        border rounded-lg p-4 cursor-pointer hover:border-primary transition duration-200`}
                      onClick={() => setSelectedFormat('hd_image')}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 ${selectedFormat === 'hd_image' ? 'border-primary' : 'border-neutral-300 dark:border-neutral-500'} flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full ${selectedFormat === 'hd_image' ? 'bg-primary' : ''}`}></div>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-secondary dark:text-dark-text">HD Image</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Best resolution (JPG)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`${selectedFormat === 'standard_image' 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-neutral-600'} 
                        border rounded-lg p-4 cursor-pointer hover:border-primary transition duration-200`}
                      onClick={() => setSelectedFormat('standard_image')}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 ${selectedFormat === 'standard_image' ? 'border-primary' : 'border-neutral-300 dark:border-neutral-500'} flex items-center justify-center`}>
                          <div className={`w-3 h-3 rounded-full ${selectedFormat === 'standard_image' ? 'bg-primary' : ''}`}></div>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-secondary dark:text-dark-text">Standard Image</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Faster download (JPG)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Button
                type="button"
                onClick={handleDownload}
                disabled={!currentMedia || isProcessing}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : !currentMedia ? (
                  <>
                    <span>Enter URL and click search first</span>
                    <Download className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    <span>Download Now</span>
                    <Download className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && currentMedia && (
            <div 
              id="preview-section" 
              className="mt-8">
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
                <h3 className="text-lg font-semibold text-secondary dark:text-dark-text mb-4">Preview</h3>
                
                <div className="bg-neutral-100 dark:bg-dark-card rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-1/3 mb-4 md:mb-0">
                    <div className={`rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-600 ${currentMedia.mediaType === 'video' ? '' : 'aspect-square'}`}>
                      {currentMedia.mediaType === 'video' ? (
                        <video 
                          key={`video-${currentMedia.id}-${Date.now()}`}
                          src={getProxiedVideoUrl(currentMedia.mediaUrl)}
                          poster={getProxiedImageUrl(currentMedia.thumbnailUrl)}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full max-h-[300px] object-contain"
                          preload="auto"
                          onError={(e) => {
                            console.log("Video failed to load through proxy, trying direct URL");
                            const target = e.target as HTMLVideoElement;
                            // Try using the direct URL as fallback
                            target.src = currentMedia.mediaUrl || '';
                            
                            // Add a second error handler for the fallback URL
                            target.onerror = () => {
                              console.log("All video sources failed");
                              target.onerror = null; // Prevent infinite loop
                              
                              // Display a simple message when video can't be loaded
                              const videoContainer = target.parentElement;
                              if (videoContainer) {
                                target.style.display = 'none';
                                
                                // Create a message element for better UX
                                const messageDiv = document.createElement('div');
                                messageDiv.className = 'flex flex-col items-center justify-center h-full w-full p-4 text-center';
                                messageDiv.innerHTML = `
                                  <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-neutral-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <p class="text-neutral-700 dark:text-neutral-300 font-medium">Video preview unavailable</p>
                                  <p class="text-xs text-neutral-500 mt-1">Try downloading directly</p>
                                `;
                                videoContainer.appendChild(messageDiv);
                              }
                            };
                            
                            // Try to play the video with the direct URL
                            target.load();
                          }}
                        />
                      ) : (
                        <img 
                          key={`preview-${currentMedia.id}-${Date.now()}`} // Force re-render with unique key
                          src={getProxiedImageUrl(currentMedia.thumbnailUrl || currentMedia.mediaUrl)} 
                          alt="Pinterest content" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.log("Preview image error, trying fallback");
                            // If thumbnail fails, try using the media URL as fallback
                            const target = e.target as HTMLImageElement;
                            const currentSrc = target.src;
                            
                            // Try mediaUrl if it exists and is different
                            if (currentMedia.mediaUrl && currentSrc !== currentMedia.mediaUrl) {
                              console.log("Using mediaUrl fallback for preview:", currentMedia.mediaUrl);
                              target.src = getProxiedImageUrl(currentMedia.mediaUrl);
                            } else {
                              console.log("All preview image sources failed");
                              target.style.display = 'none';
                              target.parentElement?.classList.add('image-error');
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  <div className="w-full md:w-2/3 md:pl-6">
                    <div className="space-y-3">
                      <div className="pt-2 flex space-x-3">
                        <Button 
                          className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition duration-200 flex items-center justify-center"
                          onClick={() => downloadMedia(currentMedia)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download Now</span>
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="px-3 py-2"
                          onClick={() => currentMedia.mediaUrl ? copyMediaLink(currentMedia.mediaUrl) : null}
                          title="Copy link"
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="px-3 py-2"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Section */}
          <div className="mt-8">
            <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-secondary dark:text-dark-text">Recently Downloaded</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearHistory()}
                  className="text-sm text-primary hover:text-primary/90 dark:text-primary dark:hover:text-primary/90 transition duration-200"
                >
                  Clear All
                </Button>
              </div>
              
              {isHistoryLoading ? (
                <div className="py-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="mt-2 text-neutral-500 dark:text-neutral-400">Loading history...</p>
                </div>
              ) : recentHistory && recentHistory.length > 0 ? (
                <div className="space-y-4">
                  {recentHistory.map((item, index) => (
                    <div 
                      key={index}
                      className="flex items-center bg-neutral-50 dark:bg-dark-bg rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition duration-200"
                    >
                      <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded overflow-hidden flex-shrink-0">
                        {item.mediaType === 'video' && (
                          <div className="relative w-full h-full">
                            <img 
                              key={`history-video-${item.id}-${Date.now()}`}
                              src={getProxiedImageUrl(item.thumbnailUrl || item.mediaUrl)}
                              alt="Pinterest content" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log("History video thumbnail error, trying fallback");
                                const target = e.target as HTMLImageElement;
                                const currentSrc = target.src;
                                
                                if (currentSrc !== item.mediaUrl && item.mediaUrl) {
                                  console.log("Using mediaUrl fallback for history video:", item.mediaUrl);
                                  target.src = getProxiedImageUrl(item.mediaUrl);
                                } else {
                                  target.style.display = 'none';
                                  target.parentElement?.classList.add('image-error');
                                }
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {item.mediaType !== 'video' && (item.thumbnailUrl || item.mediaUrl) && (
                          <img 
                            key={`history-image-${item.id}-${Date.now()}`}
                            src={getProxiedImageUrl(item.thumbnailUrl || item.mediaUrl)}
                            alt="Pinterest content" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.log("History image thumbnail error, trying fallback");
                              const target = e.target as HTMLImageElement;
                              const currentSrc = target.src;
                              
                              if (currentSrc !== item.mediaUrl && item.mediaUrl) {
                                console.log("Using mediaUrl fallback for history image:", item.mediaUrl);
                                target.src = getProxiedImageUrl(item.mediaUrl);
                              } else {
                                target.style.display = 'none';
                                target.parentElement?.classList.add('image-error');
                              }
                            }}
                          />
                        )}
                        
                        {item.mediaType !== 'video' && !item.thumbnailUrl && !item.mediaUrl && (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-300 dark:bg-neutral-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-grow">
                        <div className="flex justify-between">
                          <p className="font-medium text-secondary dark:text-dark-text truncate">
                            Pinterest content
                          </p>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatTimeAgo(new Date(item.downloadedAt))}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{item.url}</p>
                        <div className="flex space-x-2 mt-1">
                          <span className="text-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded">
                            {item.mediaType === 'video' ? 'Video' : 'Image'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-2 p-2 text-neutral-400 hover:text-primary dark:text-neutral-500 dark:hover:text-primary transition duration-200"
                        onClick={() => downloadMedia(item)}
                      >
                        <Download className="h-5 w-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-neutral-500 dark:text-neutral-400">No download history yet. Start by downloading something!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
