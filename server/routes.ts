import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { pinterestUrlSchema, PinterestUrlInput, insertPinterestMediaSchema } from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

// Helper function to validate and process Pinterest URL
async function processPinterestUrl(input: PinterestUrlInput) {
  try {
    // In a real implementation, this would properly extract media from Pinterest URLs
    // using their API or scraping techniques. For this demo, we'll simulate the process
    
    // Simulate an API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const urlObj = new URL(input.url);
    const pathParts = urlObj.pathname.split('/');
    const pinId = pathParts.find(part => /^\d+$/.test(part)) || "unknown";
    
    // Generate placeholder data based on the requested type
    let mediaType = "image";
    let quality = "standard";
    
    if (input.type === "hd_video") {
      mediaType = "video";
      quality = "hd";
    } else if (input.type === "hd_image") {
      mediaType = "image";
      quality = "hd";
    }
    
    // Create a simulated response
    const mediaData = {
      url: input.url,
      mediaType,
      quality,
      thumbnailUrl: `https://placekitten.com/500/500?pin=${pinId}`,
      mediaUrl: `https://placekitten.com/1200/1200?pin=${pinId}`,
      metadata: {
        width: 1200,
        height: 1200,
        duration: mediaType === "video" ? 18 : undefined,
        size: mediaType === "video" ? 12400000 : 2400000, // 12.4MB for video, 2.4MB for image
        title: `Pinterest ${mediaType} ${pinId}`
      }
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
