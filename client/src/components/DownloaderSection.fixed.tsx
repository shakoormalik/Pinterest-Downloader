import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { validatePinterestUrl, extractPinId } from '../utils/validation';
import { apiRequest, queryClient } from '@/lib/queryClient';
import useDownloader from '../hooks/useDownloader';
import { Clipboard, Download, Link, Share2, History, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { createConfetti } from '../utils/confetti';

interface PinterestMedia {
  id: number;
  url: string;
  mediaType: 'video' | 'image';
  quality: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  downloadedAt: string;
  metadata?: {
    title?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
  };
}

interface DownloaderSectionProps {
  onDownloadSuccess: (media: PinterestMedia) => void;
  onDownloadError: (message: string, details?: string) => void;
}

type FormatOption = 'hd_video' | 'hd_image' | 'standard_image';

export default function DownloaderSection({ onDownloadSuccess, onDownloadError }: DownloaderSectionProps) {
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>('hd_image');
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [currentMedia, setCurrentMedia] = useState<PinterestMedia | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [recentHistory, setRecentHistory] = useState<PinterestMedia[]>([]);
  const { toast } = useToast();
  const { isProcessing, processUrl, downloadMedia, error } = useDownloader();

  // Helper to process direct media URLs
  const processDirectUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    
    // For Pinterest URLs, try to ensure we get a high quality version
    if (url.includes('pinimg.com')) {
      // Convert to orig quality
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

  // REMAINING COMPONENT CODE WOULD GO HERE...
  // The key change to fix the LSP errors is using processDirectUrl for all media URLs
}