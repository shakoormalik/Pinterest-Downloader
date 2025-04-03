import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import * as cheerio from "cheerio";
import { pinterestUrlSchema, PinterestUrlInput, insertPinterestMediaSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

// Helper function to extract actual Pinterest data
async function extractPinterestMedia(url: string, type: string): Promise<{
  thumbnailUrl: string; 
  mediaUrl: string; 
  mediaType: string;
  metadata: any;
}> {
  try {
    console.log(`Extracting media from Pinterest URL: ${url}`);
    
    // Fetch the Pinterest page
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log(`Got response from Pinterest, parsing content`);
    
    const $ = cheerio.load(response.data);
    let thumbnailUrl = '';
    let mediaUrl = '';
    let mediaType = type.includes('video') ? 'video' : 'image';
    
    // Extract metadata
    const title = $('title').text().trim() || 'Pinterest Content';
    
    // Look for meta tags with image/video information
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogVideo = $('meta[property="og:video"]').attr('content');
    const ogVideoUrl = $('meta[property="og:video:url"]').attr('content');
    const ogVideoSecureUrl = $('meta[property="og:video:secure_url"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    
    // Look deeper for video content in script tags (Pinterest often hides video URLs in JSON)
    let scriptVideoUrl = '';
    try {
      // Find scripts with JSON content that might contain video URLs
      const scriptTags = $('script').filter((i, el) => {
        const scriptContent = $(el).html() || '';
        return scriptContent.includes('VideoObject') || 
               scriptContent.includes('contentUrl') || 
               scriptContent.includes('.mp4');
      });
      
      // Extract video URLs from script tags
      scriptTags.each((i, el) => {
        const scriptContent = $(el).html() || '';
        
        // Try to find video URLs
        const videoUrlMatch = scriptContent.match(/"contentUrl":\s*"([^"]+\.mp4[^"]*)"/);
        if (videoUrlMatch && videoUrlMatch[1]) {
          scriptVideoUrl = videoUrlMatch[1].replace(/\\/g, '');
          return false; // break the loop
        }
        
        // Alternative pattern
        const videoMatch = scriptContent.match(/"url":\s*"([^"]+\.mp4[^"]*)"/);
        if (videoMatch && videoMatch[1]) {
          scriptVideoUrl = videoMatch[1].replace(/\\/g, '');
          return false; // break the loop
        }
      });
    } catch (err) {
      console.error('Error parsing script tags for video:', err);
    }
    
    console.log(`Meta tags - ogImage: ${ogImage ? 'found' : 'not found'}, ogVideo: ${ogVideo ? 'found' : 'not found'}, scriptVideo: ${scriptVideoUrl ? 'found' : 'not found'}`);
    
    // Find the main image or video - prioritize video if requested
    if (mediaType === 'video' && (ogVideo || ogVideoUrl || ogVideoSecureUrl || scriptVideoUrl || ogType.includes('video'))) {
      // We found a video or strong indicators of video
      mediaUrl = scriptVideoUrl || ogVideoSecureUrl || ogVideoUrl || ogVideo || '';
      thumbnailUrl = ogImage || '';
      
      // If we found a video URL, ensure it's marked as a video
      if (mediaUrl) {
        mediaType = 'video';
      } else {
        // We couldn't find a video URL despite indicators, let's look for video tags
        const videoSources = $('video source, video').map((i, el) => {
          return $(el).attr('src') || '';
        }).get().filter(Boolean);
        
        if (videoSources.length > 0) {
          mediaUrl = videoSources[0];
          mediaType = 'video';
        } else {
          // Still no video, fall back to image
          mediaType = 'image';
        }
      }
    } else {
      // Either it's an image or we couldn't find video, use image
      mediaType = 'image';
      
      // Try different selectors to find high-quality images
      const imageSelectors = [
        'meta[property="og:image"]',
        'meta[property="pinterest:pinimage"]',
        'img[src*="orig"]', // Original Pinterest images often have 'orig' in the URL
        'img[src*="736x"]', // High-res Pinterest thumbnails
      ];
      
      // Try each selector until we find an image
      for (const selector of imageSelectors) {
        const found = $(selector).first();
        if (found.length) {
          mediaUrl = found.attr('content') || found.attr('src') || '';
          if (mediaUrl) break;
        }
      }
      
      // If we still didn't find an image, try any image on the page
      if (!mediaUrl) {
        const anyImg = $('img').first();
        mediaUrl = anyImg.attr('src') || '';
      }
      
      thumbnailUrl = mediaUrl;
    }
    
    console.log(`Extracted media URL: ${mediaUrl ? mediaUrl.substring(0, 50) + '...' : 'not found'}`);
    
    // If still no media found, fall back to a reliable sample
    if (!mediaUrl) {
      console.log('Could not extract media from Pinterest URL, using fallback');
      throw new Error('Could not extract media from Pinterest URL');
    }
    
    // Attempt to get actual dimensions from meta tags
    let width = 0, height = 0, duration = 0;
    
    const ogImageWidth = $('meta[property="og:image:width"]').attr('content');
    const ogImageHeight = $('meta[property="og:image:height"]').attr('content');
    const ogVideoDuration = $('meta[property="og:video:duration"]').attr('content');
    
    if (ogImageWidth) width = parseInt(ogImageWidth);
    if (ogImageHeight) height = parseInt(ogImageHeight);
    if (ogVideoDuration) duration = parseInt(ogVideoDuration);
    
    // If we couldn't get dimensions from meta tags, try to estimate from URL patterns
    if (!width || !height) {
      // Pinterest images often have dimensions in the URL like "736x"
      const dimensionMatch = mediaUrl.match(/\/([0-9]+)x\//);
      if (dimensionMatch && dimensionMatch[1]) {
        const dimension = parseInt(dimensionMatch[1]);
        
        if (mediaType === 'image') {
          // Pinterest images are often square, but sometimes rectangular
          // If dimension is for width (most common)
          width = dimension;
          height = dimension; // Assume square unless we find height
          
          // Look for height in URL (less common pattern)
          const heightMatch = mediaUrl.match(/\/[0-9]+x([0-9]+)\//);
          if (heightMatch && heightMatch[1]) {
            height = parseInt(heightMatch[1]);
          }
        } else if (mediaType === 'video') {
          // Videos are usually 16:9 ratio
          if (dimension >= 720) {
            // Likely width
            width = dimension;
            height = Math.round(dimension * 9 / 16);
          } else {
            // Might be height
            height = dimension;
            width = Math.round(dimension * 16 / 9);
          }
        }
      }
    }
    
    // If we still don't have dimensions, use realistic defaults based on format
    if (!width || !height) {
      if (type === 'hd_video') {
        width = 1280;
        height = 720;
      } else if (type === 'hd_image') {
        width = 1200;
        height = 1200;
      } else {
        width = 736;
        height = 736;
      }
    }
    
    // Calculate realistic file size based on dimensions and type
    let size = 0;
    if (mediaType === 'video') {
      // Video size calculation (roughly 500KB per second for HD)
      const videoDuration = duration || 15; // Default to 15 seconds if unknown
      size = videoDuration * (type === 'hd_video' ? 500000 : 250000);
    } else {
      // Image size calculation (roughly 100KB per 100K pixels for JPG)
      const pixelCount = width * height;
      size = Math.round(pixelCount * 0.001);
      
      // Adjust based on quality
      if (type === 'hd_image') {
        size = Math.max(size, 800000); // At least 800KB for HD
      } else {
        size = Math.min(size, 500000); // Cap at 500KB for standard
      }
    }
    
    const metadata = {
      width,
      height,
      duration: mediaType === 'video' ? (duration || 15) : undefined,
      size,
      title: title
    };
    
    return {
      thumbnailUrl,
      mediaUrl,
      mediaType,
      metadata
    };
  } catch (error) {
    console.error('Error extracting Pinterest media:', error);
    throw new Error('Failed to extract media from Pinterest URL. Please try a different URL.');
  }
}

// Helper function to validate and process Pinterest URL
async function processPinterestUrl(input: PinterestUrlInput) {
  try {
    // Extract pin ID from URL for logging/reference
    const pinId = input.url.match(/pin\/(\d+)\/?/)?.[1] || 
                  input.url.match(/\/([^\/]+)$/)?.[1] || "unknown";
    
    console.log(`Processing Pinterest URL for pin ID: ${pinId}`);
    
    // Set quality based on input type
    let quality = "standard";
    if (input.type === "hd_video" || input.type === "hd_image") {
      quality = "hd";
    }
    
    // Extract actual media from Pinterest
    const extractedMedia = await extractPinterestMedia(input.url, input.type);
    
    // Create response with real Pinterest data
    const mediaData = {
      url: input.url,
      mediaType: extractedMedia.mediaType,
      quality,
      thumbnailUrl: extractedMedia.thumbnailUrl,
      mediaUrl: extractedMedia.mediaUrl,
      metadata: extractedMedia.metadata
    };
    
    return mediaData;
  } catch (error) {
    console.error("Error processing Pinterest URL:", error);
    throw new Error("Failed to process Pinterest URL. Please check the URL and try again.");
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API prefix
  const apiPrefix = "/api";
  
  // Get media history
  app.get(`${apiPrefix}/media/history`, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const history = await storage.getMediaHistory(limit);
      return res.json(history);
    } catch (error) {
      console.error("Error fetching media history:", error);
      return res.status(500).json({ message: "Failed to fetch media history" });
    }
  });
  
  // Clear media history
  app.post(`${apiPrefix}/media/clear-history`, async (req: Request, res: Response) => {
    try {
      await storage.clearMediaHistory();
      return res.json({ message: "Media history cleared successfully" });
    } catch (error) {
      console.error("Error clearing media history:", error);
      return res.status(500).json({ message: "Failed to clear media history" });
    }
  });
  
  // Process Pinterest URL
  app.post(`${apiPrefix}/media/process`, async (req: Request, res: Response) => {
    try {
      // Validate input
      const validatedData = pinterestUrlSchema.parse(req.body);
      
      // Process the URL
      const mediaData = await processPinterestUrl(validatedData);
      
      // Save to storage
      const savedMedia = await storage.createMedia(mediaData);
      
      return res.json(savedMedia);
    } catch (error) {
      console.error("Error processing media:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input",
          details: error.errors 
        });
      }
      
      return res.status(500).json({ 
        message: error instanceof Error ? error.message : "An unknown error occurred" 
      });
    }
  });
  
  // Download media by ID
  app.get(`${apiPrefix}/media/download/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }
      
      const media = await storage.getMediaById(id);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      
      // In a real implementation, we would stream the file
      // For this demo, we'll redirect to the media URL
      return res.json({ downloadUrl: media.mediaUrl });
    } catch (error) {
      console.error("Error downloading media:", error);
      return res.status(500).json({ message: "Failed to download media" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
