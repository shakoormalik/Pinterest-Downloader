import { VercelRequest, VercelResponse } from '@vercel/node';
import { processPinterestUrl } from '../_utils';
import { PinterestUrlInput } from '../../client/src/types/pinterest';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url, format = 'auto' } = req.body as PinterestUrlInput;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Process the Pinterest URL
    const media = await processPinterestUrl(url, format);
    
    // Return the media data
    return res.status(200).json(media);
  } catch (error) {
    console.error('Error processing Pinterest URL:', error);
    return res.status(500).json({ 
      error: 'Failed to process Pinterest URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}