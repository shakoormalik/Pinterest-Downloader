/**
 * Validates a Pinterest URL format
 * 
 * @param url The URL to validate
 * @returns boolean - true if valid Pinterest URL
 */
export const validatePinterestUrl = (url: string): boolean => {
  if (!url) return false;
  
  url = url.trim();
  
  // Check for Pinterest domains
  const isPinterestDomain = url.includes('pinterest.com') || url.includes('pin.it');
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return isPinterestDomain;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts the pin ID from a Pinterest URL
 * 
 * @param url Pinterest URL
 * @returns string | null - Pin ID if found, null otherwise
 */
export const extractPinId = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    
    // Handle full Pinterest URLs
    if (urlObj.hostname.includes('pinterest.com')) {
      const pathParts = urlObj.pathname.split('/');
      // Find the pin ID in the path (it's usually a numeric value)
      const pinId = pathParts.find(part => /^\d+$/.test(part));
      return pinId || null;
    }
    
    // Handle shortened pin.it URLs
    if (urlObj.hostname.includes('pin.it')) {
      // The last part of the path is typically the ID or a short code
      const pathParts = urlObj.pathname.split('/');
      return pathParts[pathParts.length - 1] || null;
    }
    
    return null;
  } catch (e) {
    return null;
  }
};
