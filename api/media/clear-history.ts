import { VercelRequest, VercelResponse } from '@vercel/node';
import { clearMediaHistory } from '../_utils';

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
    // Clear media history
    clearMediaHistory();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Media history cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing media history:', error);
    return res.status(500).json({ 
      error: 'Failed to clear media history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}