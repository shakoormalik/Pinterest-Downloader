import axios from 'axios';
import cheerio from 'cheerio';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PinterestMedia } from '../client/src/types/pinterest';

// In-memory storage for downloaded media
let mediaHistory: PinterestMedia[] = [];
let mediaCounter = 1;

/**
 * Validates a Pinterest URL format
 */
export const validatePinterestUrl = (url: string): boolean => {
  const pinterestRegex = /^(https?:\/\/)?(www\.)?pinterest\.(com|ca|co\.uk|com\.au|fr|de|ch|jp|ru|at|pt|se|dk|no|fi|nz)\/pin\/\d+\/?(\?.*)?$/;
  return pinterestRegex.test(url);
};

/**
 * Extracts the pin ID from a Pinterest URL
 */
export const extractPinId = (url: string): string | null => {
  const match = url.match(/\/pin\/(\d+)/);
  return match ? match[1] : null;
};

/**
 * Extracts media URLs from Pinterest page HTML
 */
export async function extractPinterestMedia(url: string, type: string): Promise<{
  mediaUrl: string;
  mediaType: 'image' | 'video';
  thumbnailUrl?: string | null;
  quality: string;
  metadata?: {
    title?: string;
    description?: string;
    size?: number;
    width?: number;
    height?: number;
    duration?: number;
  } | null;
}> {
  try {
    if (!validatePinterestUrl(url)) {
      throw new Error('Invalid Pinterest URL');
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
    };

    // Fetch Pinterest page content
    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);

    // First, try to extract using Open Graph tags (most reliable)
    let mediaUrl = '';
    let mediaType: 'image' | 'video' = 'image';
    let thumbnailUrl: string | null = null;
    let quality = 'standard';
    let title = $('meta[property="og:title"]').attr('content') || '';
    let description = $('meta[property="og:description"]').attr('content') || '';

    // Detect if it's a video or image
    const videoUrl = $('meta[property="og:video:secure_url"]').attr('content') || 
                     $('meta[property="og:video"]').attr('content') || 
                     $('meta[property="og:video:url"]').attr('content');
                     
    const imageUrl = $('meta[property="og:image:secure_url"]').attr('content') || 
                     $('meta[property="og:image"]').attr('content');

    // Set media type based on available data
    if (videoUrl && (type === 'hd_video' || type === 'auto')) {
      mediaType = 'video';
      mediaUrl = videoUrl;
      thumbnailUrl = imageUrl || null;
      quality = 'hd';
    } else {
      mediaType = 'image';
      mediaUrl = imageUrl || '';
      // Use high-quality image if available and requested
      if (type === 'hd_image' || type === 'auto') {
        mediaUrl = mediaUrl.replace(/\/[0-9]+x\//, '/orig/');
        quality = 'hd';
      }
    }

    // If still no media URL found, try to find it elsewhere in the HTML
    if (!mediaUrl) {
      // Look for JSON data in scripts
      const scriptContent = $('script').map((i, el) => $(el).html()).get().join(' ');
      
      // Try to find image data in script content
      const imgMatch = scriptContent.match(/"orig":\s*{\s*"url":\s*"([^"]+)"/);
      if (imgMatch && imgMatch[1]) {
        mediaUrl = imgMatch[1].replace(/\\u002F/g, '/');
        mediaType = 'image';
        quality = 'hd';
      }
      
      // Try to find video data in script content
      const videoMatch = scriptContent.match(/"video_list":\s*{\s*"V_720P":\s*{\s*"url":\s*"([^"]+)"/);
      if (videoMatch && videoMatch[1] && (type === 'hd_video' || type === 'auto')) {
        mediaUrl = videoMatch[1].replace(/\\u002F/g, '/');
        mediaType = 'video';
        quality = 'hd';
        
        // If we have a video, try to find its thumbnail
        const thumbMatch = scriptContent.match(/"thumbnails":\s*{\s*"orig":\s*{\s*"url":\s*"([^"]+)"/);
        if (thumbMatch && thumbMatch[1]) {
          thumbnailUrl = thumbMatch[1].replace(/\\u002F/g, '/');
        }
      }
    }

    // If still no media found, throw error
    if (!mediaUrl) {
      throw new Error('Could not extract media from Pinterest URL');
    }

    // Extract dimensions if available
    const widthMeta = $('meta[property="og:image:width"]').attr('content');
    const heightMeta = $('meta[property="og:image:height"]').attr('content');
    const width = widthMeta ? parseInt(widthMeta, 10) : undefined;
    const height = heightMeta ? parseInt(heightMeta, 10) : undefined;

    return {
      mediaUrl,
      mediaType,
      thumbnailUrl,
      quality,
      metadata: {
        title: title || undefined,
        description: description || undefined,
        width,
        height,
        // We can't reliably get size and duration without downloading the file
      }
    };
  } catch (error) {
    console.error('Error extracting Pinterest media:', error);
    throw new Error('Failed to extract media from Pinterest URL');
  }
}

/**
 * Process a Pinterest URL to extract media
 */
export async function processPinterestUrl(url: string, format = 'auto') {
  try {
    const extractedMedia = await extractPinterestMedia(url, format);
    
    // Create media object
    const media: PinterestMedia = {
      id: mediaCounter++,
      url,
      mediaType: extractedMedia.mediaType,
      quality: extractedMedia.quality,
      mediaUrl: extractedMedia.mediaUrl,
      thumbnailUrl: extractedMedia.thumbnailUrl || undefined,
      downloadedAt: new Date().toISOString(),
      metadata: extractedMedia.metadata || {},
    };
    
    // Add to history (limit to 50 items)
    mediaHistory = [media, ...mediaHistory.slice(0, 49)];
    
    return media;
  } catch (error) {
    console.error('Error processing Pinterest URL:', error);
    throw error;
  }
}

/**
 * Get media history
 */
export function getMediaHistory(limit = 10): PinterestMedia[] {
  return mediaHistory.slice(0, limit);
}

/**
 * Get media by ID
 */
export function getMediaById(id: number): PinterestMedia | undefined {
  return mediaHistory.find(media => media.id === id);
}

/**
 * Clear media history
 */
export function clearMediaHistory(): void {
  mediaHistory = [];
}