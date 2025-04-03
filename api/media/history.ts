import { VercelRequest, VercelResponse } from '@vercel/node';
import { getMediaHistory } from '../_utils';

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
    // Get limit from query parameter or use default
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    
    // Get media history
    const history = getMediaHistory(limit);
    
    // Return the history data
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error getting media history:', error);
    return res.status(500).json({ 
      error: 'Failed to get media history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}