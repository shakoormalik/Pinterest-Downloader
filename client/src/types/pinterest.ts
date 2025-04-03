/**
 * Represents Pinterest media (image or video) with its metadata
 */
export interface PinterestMedia {
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
    description?: string;
  };
}

/**
 * Input for processing Pinterest URLs
 */
export interface PinterestUrlInput {
  url: string;
  format?: 'hd_video' | 'hd_image' | 'standard_image' | 'auto';
}