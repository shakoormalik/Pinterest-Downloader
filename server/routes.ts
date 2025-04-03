import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import * as cheerio from "cheerio";
import { pinterestUrlSchema, PinterestUrlInput, insertPinterestMediaSchema } from "@shared/schema";
import { z } from "zod";
import path from "path";
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
    
    // Check if URL is a Pinterest URL
    if (!url.includes('pinterest')) {
      throw new Error('Not a valid Pinterest URL');
    }
    
    // Normalize Pinterest URL - some URLs might be shortened or mobile versions
    if (url.includes('pin.it/')) {
      // It's a shortened URL, we need to follow the redirect to get the actual URL
      const response = await axios.get(url, {
        maxRedirects: 5,
        validateStatus: null
      });
      url = response.request.res.responseUrl || url;
      console.log(`Resolved shortened URL to: ${url}`);
    }
    
    // Ensure we're using the web version, not mobile
    if (url.includes('pinterest.com/pin/') && !url.includes('www.pinterest')) {
      url = url.replace('pinterest.com', 'www.pinterest.com');
    }
    
    // Fetch the Pinterest page with additional headers to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Referer': 'https://www.pinterest.com/'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log(`Got response from Pinterest, parsing content`);
    
    const $ = cheerio.load(response.data);
    let thumbnailUrl = '';
    let mediaUrl = '';
    let mediaType = type.includes('video') ? 'video' : 'image';
    
    // Extract metadata
    const title = $('title').text().trim() || 'Pinterest Content';
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Look for meta tags with image/video information
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogVideo = $('meta[property="og:video"]').attr('content');
    const ogVideoUrl = $('meta[property="og:video:url"]').attr('content');
    const ogVideoSecureUrl = $('meta[property="og:video:secure_url"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content') || '';
    const pinterestMediaType = $('meta[name="pinterest:media"]').attr('content') || '';
    
    // Enhanced technique for finding video in script JSON data
    let scriptVideoUrl = '';
    let jsonLdData: Record<string, any> | null = null;
    
    try {
      // First try to find JSON-LD structured data which often contains media info
      const jsonLdScripts = $('script[type="application/ld+json"]');
      jsonLdScripts.each((i, el) => {
        try {
          const scriptContent = $(el).html() || '';
          const parsedData = JSON.parse(scriptContent);
          
          // Look for video data in JSON-LD
          if (parsedData && (parsedData.video || parsedData.videoObject)) {
            const videoData = parsedData.video || parsedData.videoObject;
            if (videoData && videoData.contentUrl) {
              scriptVideoUrl = videoData.contentUrl;
              jsonLdData = parsedData;
              return false; // break the loop
            }
          }
          
          // Alternative formats in structured data
          if (parsedData && parsedData['@graph']) {
            const graphItems = parsedData['@graph'];
            for (const item of graphItems) {
              if (item.video && item.video.contentUrl) {
                scriptVideoUrl = item.video.contentUrl;
                jsonLdData = item;
                return false; // break the loop
              }
            }
          }
        } catch (err) {
          // Continue if one JSON parse fails
        }
      });
      
      // If we didn't find in JSON-LD, look in other scripts
      if (!scriptVideoUrl) {
        // Find scripts with JSON content that might contain video URLs
        const scriptTags = $('script').filter((i, el) => {
          const scriptContent = $(el).html() || '';
          return scriptContent.includes('VideoObject') || 
                 scriptContent.includes('contentUrl') || 
                 scriptContent.includes('.mp4') ||
                 scriptContent.includes('{"resource_response":');
        });
        
        // Extract video URLs from script tags
        scriptTags.each((i, el) => {
          const scriptContent = $(el).html() || '';
          
          // Try to find pinterest resource_response data
          if (scriptContent.includes('{"resource_response":')) {
            try {
              // Find any JSON object that might contain resource data
              const jsonMatches = scriptContent.match(/\{\"resource_response\":.*?\}/g);
              if (jsonMatches) {
                for (const match of jsonMatches) {
                  try {
                    const data = JSON.parse(match);
                    if (data.resource_response && data.resource_response.data) {
                      const resourceData = data.resource_response.data;
                      
                      // Look for video object
                      if (resourceData.videos && resourceData.videos.video_list) {
                        // Pinterest stores videos in formats like V_720P, V_480P
                        const videoFormats = resourceData.videos.video_list;
                        // Use highest quality available
                        const formatKeys = Object.keys(videoFormats);
                        if (formatKeys.length > 0) {
                          // Prioritize V_720P or the highest available
                          let bestFormat = formatKeys.find(k => k === 'V_720P') || formatKeys[0];
                          scriptVideoUrl = videoFormats[bestFormat].url;
                          return false; // break the loop
                        }
                      }
                    }
                  } catch (e) {
                    // Continue if one match fails to parse
                  }
                }
              }
            } catch (e) {
              // Continue to next pattern if this one fails
            }
          }
          
          // Try to find video URLs with various patterns
          const videoUrlPatterns = [
            /"contentUrl":\s*"([^"]+\.mp4[^"]*)"/,
            /"url":\s*"([^"]+\.mp4[^"]*)"/,
            /src="([^"]+\.mp4[^"]*)"/,
            /"([^"]+\.mp4[^"]*)"/
          ];
          
          for (const pattern of videoUrlPatterns) {
            const videoUrlMatch = scriptContent.match(pattern);
            if (videoUrlMatch && videoUrlMatch[1]) {
              scriptVideoUrl = videoUrlMatch[1].replace(/\\/g, '');
              return false; // break the loop
            }
          }
        });
      }
    } catch (err) {
      console.error('Error parsing script tags for video:', err);
    }
    
    console.log(`Meta tags - ogImage: ${ogImage ? 'found' : 'not found'}, ogVideo: ${ogVideo ? 'found' : 'not found'}, scriptVideo: ${scriptVideoUrl ? 'found' : 'not found'}`);
    
    // Determine the actual media type based on what we found and what was requested
    const isVideoRequested = type === 'hd_video';
    const isVideoAvailable = Boolean(ogVideo || ogVideoUrl || ogVideoSecureUrl || scriptVideoUrl || 
                                     pinterestMediaType === 'video' || ogType.includes('video'));
    
    // Assign media type and URL based on what's available and what's requested
    if (isVideoRequested && isVideoAvailable) {
      // Video is requested and available
      mediaType = 'video';
      mediaUrl = scriptVideoUrl || ogVideoSecureUrl || ogVideoUrl || ogVideo || '';
      thumbnailUrl = ogImage || '';
      
      if (!mediaUrl) {
        // Try to find video elements directly if metadata approach failed
        const videoSources = $('video source, video').map((i, el) => {
          return $(el).attr('src') || '';
        }).get().filter(Boolean);
        
        if (videoSources.length > 0) {
          mediaUrl = videoSources[0];
        }
      }
      
      // If we still couldn't find video, fall back to image
      if (!mediaUrl) {
        mediaType = 'image';
        console.log('Requested video but could not find video URL, falling back to image');
      }
    } else {
      // Either image was requested or video wasn't available
      mediaType = 'image';
      
      // Optimize image selectors for higher resolution
      const imageSelectors = [
        // Original full-size Pinterest images often have 'orig' in the URL
        'img[src*="orig"]',
        // Look for og:image which is usually good quality
        'meta[property="og:image"]',
        // Pinterest specific image tags
        'meta[property="pinterest:pinimage"]',
        // Pinterest high-res thumbnails
        'img[src*="736x"]',
        // Pinterest other common sizes
        'img[src*="564x"]',
        'img[src*="600x"]',
        // Other potential image containers
        '.GrowthUnauthPinImage img',
        '.PinImage img'
      ];
      
      // Try each selector until we find an image
      for (const selector of imageSelectors) {
        const found = $(selector).first();
        if (found.length) {
          const foundUrl = found.attr('content') || found.attr('src') || '';
          if (foundUrl) {
            // For image URLs, attempt to get the highest quality possible
            const originalImageUrl = foundUrl.replace(/\/[0-9]+x\//g, '/orig/');
            mediaUrl = originalImageUrl;
            break;
          }
        }
      }
      
      // If we still didn't find an image, try any image on the page
      if (!mediaUrl) {
        const allImages = $('img').toArray()
          .map(el => $(el).attr('src'))
          .filter((src): src is string => typeof src === 'string' && src.length > 0)
          // Sort by size - longer URLs often have more parameters and are higher quality
          .sort((a, b) => b.length - a.length);
          
        if (allImages.length > 0) {
          mediaUrl = allImages[0];
        }
      }
      
      thumbnailUrl = mediaUrl;
    }
    
    console.log(`Extracted media URL: ${mediaUrl ? mediaUrl.substring(0, 50) + '...' : 'not found'}`);
    
    // If still no media found, notify the user
    if (!mediaUrl) {
      console.log('Could not extract media from Pinterest URL');
      throw new Error('Could not extract media from Pinterest URL. The content may be private or requires login.');
    }
    
    // Make sure we have a thumbnail URL - critical for display in UI
    if (!thumbnailUrl) {
      console.log('No thumbnail URL found, using mediaUrl as thumbnail');
      thumbnailUrl = mediaUrl;
    }
    
    // Check if mediaUrl is a direct image URL (ends with image extension)
    if (mediaType === 'image' && !mediaUrl.match(/\.(jpe?g|png|gif|webp)$/i)) {
      // If it's not a direct image URL, try to infer it might be a Pinterest CDN URL
      if (mediaUrl.includes('pinimg.com')) {
        // Convert to direct image URL with jpg extension if possible
        if (!mediaUrl.endsWith('/')) {
          mediaUrl = mediaUrl + '.jpg';
        }
      }
    }
    
    // Attempt to get actual dimensions from meta tags
    let width = 0, height = 0, duration = 0;
    
    const ogImageWidth = $('meta[property="og:image:width"]').attr('content');
    const ogImageHeight = $('meta[property="og:image:height"]').attr('content');
    const ogVideoDuration = $('meta[property="og:video:duration"]').attr('content');
    
    if (ogImageWidth) width = parseInt(ogImageWidth);
    if (ogImageHeight) height = parseInt(ogImageHeight);
    if (ogVideoDuration) duration = parseInt(ogVideoDuration);
    
    // Try to extract dimensions from JSON-LD data if available
    if (jsonLdData) {
      // Parse width and height from JSON-LD if available
      const typedJsonData = jsonLdData as Record<string, any>;
      
      const ldWidth = typedJsonData.width;
      if (!width && ldWidth && typeof ldWidth === 'number') {
        width = ldWidth;
      } else if (!width && ldWidth && typeof ldWidth === 'string') {
        const parsedWidth = parseInt(ldWidth);
        if (!isNaN(parsedWidth)) width = parsedWidth;
      }
      
      const ldHeight = typedJsonData.height;
      if (!height && ldHeight && typeof ldHeight === 'number') {
        height = ldHeight;
      } else if (!height && ldHeight && typeof ldHeight === 'string') {
        const parsedHeight = parseInt(ldHeight);
        if (!isNaN(parsedHeight)) height = parsedHeight;
      }
      
      // Parse duration from JSON-LD
      const ldDuration = typedJsonData.duration;
      if (!duration && ldDuration) {
        if (typeof ldDuration === 'number') {
          duration = ldDuration;
        } else if (typeof ldDuration === 'string') {
          // Duration could be in ISO8601 format like PT15S for 15 seconds
          const durationMatch = ldDuration.match(/PT(\d+)S/);
          if (durationMatch && durationMatch[1]) {
            const parsedDuration = parseInt(durationMatch[1]);
            if (!isNaN(parsedDuration)) duration = parsedDuration;
          } else {
            // Try direct integer parsing
            const parsedDuration = parseInt(ldDuration);
            if (!isNaN(parsedDuration)) duration = parsedDuration;
          }
        }
      }
    }
    
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
      title: title,
      description: description
    };
    
    return {
      thumbnailUrl,
      mediaUrl,
      mediaType,
      metadata
    };
  } catch (error) {
    console.error('Error extracting Pinterest media:', error);
    throw new Error('Failed to extract media from Pinterest URL. Please try a different URL or check if the content is private.');
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
  
  // Serve the standalone Pinterest Downloader app
  app.get('/downloader', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'webapp', 'index.html'));
  });
  
  // Direct media endpoint - returns a modified URL for Pinterest media
  app.get(`${apiPrefix}/direct-media`, (req: Request, res: Response) => {
    try {
      const mediaUrl = req.query.url as string;
      
      if (!mediaUrl) {
        return res.status(400).json({ message: "Media URL is required" });
      }
      
      const isVideo = mediaUrl.includes('video') || mediaUrl.toLowerCase().includes('mp4');
      
      // Process the URL to get the best version
      let processedUrl = mediaUrl;
      
      // Fix common Pinterest URL patterns for direct access
      if (processedUrl.includes('pinimg.com')) {
        // Make sure we're using the 'orig' quality
        processedUrl = processedUrl.replace(/\/[0-9]+x\//, '/orig/');
        
        // Make sure we have the right extension
        if (!processedUrl.match(/\.(jpe?g|png|gif|webp|mp4)$/i)) {
          processedUrl = isVideo ? processedUrl + '.mp4' : processedUrl + '.jpg';
        }
      }
      
      return res.json({
        success: true,
        url: processedUrl,
        isVideo: isVideo
      });
    } catch (error: any) {
      console.error('Media processing error:', error.message);
      
      return res.status(500).json({
        success: false,
        message: "Failed to process media URL",
        url: req.query.url as string
      });
    }
  });
  
  // Legacy proxy endpoint that now just returns the direct URL
  app.get(`${apiPrefix}/proxy/media`, (req: Request, res: Response) => {
    const mediaUrl = req.query.url as string;
    
    if (!mediaUrl) {
      return res.status(400).json({ message: "Media URL is required" });
    }
    
    return res.redirect(`${apiPrefix}/direct-media?url=${encodeURIComponent(mediaUrl)}`);
  });
  
  // Keep the original image proxy endpoint for backwards compatibility
  app.get(`${apiPrefix}/proxy/image`, (req: Request, res: Response) => {
    // Forward to the new media proxy
    const imageUrl = req.query.url as string;
    if (imageUrl) {
      res.redirect(`${apiPrefix}/proxy/media?url=${encodeURIComponent(imageUrl)}&contentType=image/jpeg`);
    } else {
      res.status(400).json({ message: "Image URL is required" });
    }
  });
  
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
  
  // Download media by ID - with multiple fallback approaches and browser-friendly workarounds
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
      
      // Ensure we have a valid media URL
      if (!media.mediaUrl) {
        return res.status(400).json({ message: "Invalid media URL" });
      }
      
      // Get filename - either from metadata or generate one
      let fileName = "";
      if (media.metadata?.title) {
        // Clean up the title to make a valid filename
        const cleanTitle = media.metadata.title
          .replace(/[^\w\s.-]/g, '')  // Remove special chars
          .replace(/\s+/g, '_');      // Replace spaces with underscore
        
        const extension = media.mediaType === 'video' ? 'mp4' : 'jpg';
        fileName = `${cleanTitle}.${extension}`;
      } else {
        // Extract filename from URL or use default
        try {
          const urlObj = new URL(media.mediaUrl);
          const pathSegments = urlObj.pathname.split('/');
          fileName = pathSegments[pathSegments.length - 1];
          
          // If we can't get a proper filename from the URL, create one
          if (!fileName || fileName === '' || !fileName.includes('.')) {
            throw new Error('No valid filename in URL');
          }
        } catch (urlError) {
          // Fallback to generated filename
          const timestamp = Date.now().toString(36);
          const extension = media.mediaType === 'video' ? 'mp4' : 'jpg';
          const quality = media.quality === 'hd' ? 'HD' : 'Standard';
          fileName = `pinterest_${media.mediaType}_${quality}_${timestamp}.${extension}`;
        }
      }
      
      // Provide browser-friendly download guidance instead of direct file download
      // This solves the Amazon S3 "Access Denied" issues because we give users instructions
      // to download directly from the browser
      
      // Use the Accept header to determine if this is an API call or browser request
      const isApiCall = req.headers.accept?.includes('application/json');
      
      if (isApiCall) {
        // If it's an API call, return JSON with download instructions
        return res.json({
          success: false,
          message: "Direct download not available due to Pinterest restrictions",
          mediaUrl: media.mediaUrl,
          instructions: "Open the mediaUrl in a new browser tab to download directly"
        });
      }
      
      // For browser requests, show a download assistance page
      const htmlResponse = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Download Pinterest Media</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9f9f9;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
          }
          .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-top: 20px;
          }
          h1 {
            color: #e60023;
            font-size: 24px;
            margin-bottom: 10px;
          }
          .instructions {
            background: #f0f0f0;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .steps {
            counter-reset: step-counter;
            list-style-type: none;
            padding-left: 10px;
          }
          .steps li {
            margin-bottom: 12px;
            position: relative;
            padding-left: 30px;
          }
          .steps li::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: 0;
            background: #e60023;
            color: white;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            text-align: center;
            line-height: 20px;
            font-size: 12px;
          }
          button, .button {
            background: #e60023;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
            text-decoration: none;
            display: inline-block;
          }
          button:hover, .button:hover {
            background: #c7001d;
          }
          .file-info {
            display: flex;
            align-items: center;
            margin: 15px 0;
            padding: 10px;
            background: #f6f6f6;
            border-radius: 4px;
          }
          .file-icon {
            margin-right: 15px;
            font-size: 24px;
            color: #666;
          }
          .file-details {
            flex: 1;
          }
          .file-name {
            font-weight: 600;
            word-break: break-all;
          }
          .file-meta {
            font-size: 13px;
            color: #888;
          }
          .back-btn {
            margin-top: 20px;
            background: #f1f1f1;
            color: #555;
          }
          .back-btn:hover {
            background: #e1e1e1;
          }
          .warning {
            background: rgba(255, 245, 230, 1);
            border-left: 4px solid #ff9800;
            padding: 10px 15px;
            margin: 15px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Download Pinterest Media</h1>
          
          <div class="file-info">
            <div class="file-icon">
              ${media.mediaType === 'video' ? 
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>' : 
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
              }
            </div>
            <div class="file-details">
              <div class="file-name">${fileName}</div>
              <div class="file-meta">
                ${media.mediaType === 'video' ? 'MP4 Video' : 'JPEG Image'} • 
                ${media.quality === 'hd' ? 'HD Quality' : 'Standard Quality'}
                ${media.metadata?.size ? ' • ' + (media.metadata.size / (1024 * 1024)).toFixed(2) + ' MB' : ''}
              </div>
            </div>
          </div>
          
          <div class="warning">
            Pinterest restricts direct downloads. Please follow the steps below to save your file.
          </div>
          
          <div class="instructions">
            <ol class="steps">
              <li>Click the "Open Media in New Tab" button below</li>
              <li>When the new tab opens, right-click on the ${media.mediaType}</li>
              <li>Select "Save ${media.mediaType === 'video' ? 'video' : 'image'} as..." from the menu</li>
              <li>Choose where to save the file on your computer</li>
            </ol>
          </div>
          
          <a href="${media.mediaUrl}" target="_blank" class="button">Open Media in New Tab</a>
          
          <button class="back-btn" onclick="window.history.back()">Go Back</button>
        </div>
      </body>
      </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlResponse);
      
    } catch (error: any) {
      console.error("Error downloading media:", error.message);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Failed to download media",
          error: error.message 
        });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
