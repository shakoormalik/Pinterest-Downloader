import { VercelRequest, VercelResponse } from '@vercel/node';
import { getMediaById } from '../_utils';
import axios from 'axios';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get media ID from URL parameter
    const id = req.query.id || req.url?.split('/').pop();
    
    if (!id) {
      return res.status(400).json({ error: 'Media ID is required' });
    }
    
    // Get media by ID
    const media = getMediaById(parseInt(id as string, 10));
    
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    
    // Get media URL and file extension
    const mediaUrl = media.mediaUrl;
    const fileExtension = media.mediaType === 'video' ? '.mp4' : '.jpg';
    const fileName = `pinterest-${media.mediaType}-${media.id}${fileExtension}`;
    
    try {
      // Add a proxy layer to avoid CORS issues
      const response = await axios({
        method: 'GET',
        url: mediaUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
          'Referer': 'https://www.pinterest.com/',
          'Origin': 'https://www.pinterest.com'
        }
      });
      
      // Set appropriate content type based on media type
      if (media.mediaType === 'video') {
        res.setHeader('Content-Type', 'video/mp4');
      } else {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      
      // Set download headers
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send the file data
      return res.status(200).send(Buffer.from(response.data, 'binary'));
    } catch (error) {
      console.error('Error fetching media:', error);
      
      // If proxy fails, redirect to the direct URL as a fallback
      return res.redirect(mediaUrl);
    }
  } catch (error) {
    console.error('Error downloading media:', error);
    return res.status(500).json({ 
      error: 'Failed to download media',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}