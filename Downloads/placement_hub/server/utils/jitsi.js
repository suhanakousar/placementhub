/**
 * Generate a unique Jitsi meeting link
 * Jitsi meetings are just URLs: https://meet.jit.si/ANY-UNIQUE-NAME
 * 
 * @param {string} sessionId - Session ID or meeting ID for uniqueness
 * @param {string} prefix - Optional prefix (default: 'placementhub')
 * @returns {string} - Jitsi meeting URL
 */
function generateJitsiLink(sessionId, prefix = 'placementhub') {
  // Generate a random string for uniqueness
  const random = Math.random().toString(36).substring(2, 8);
  
  // Use sessionId or meetingId if provided, otherwise generate timestamp-based ID
  const id = sessionId ? sessionId.toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 12) : Date.now().toString(36);
  
  // Jitsi room names should be lowercase and URL-safe
  const roomName = `${prefix}-${id}-${random}`.toLowerCase();
  
  return `https://meet.jit.si/${roomName}`;
}

/**
 * Validate a Jitsi meeting link
 * @param {string} link - Link to validate
 * @returns {boolean} - True if valid Jitsi link
 */
function validateJitsiLink(link) {
  if (!link || typeof link !== 'string') {
    return false;
  }
  
  const trimmedLink = link.trim();
  
  // Must start with https://meet.jit.si/
  if (!trimmedLink.startsWith('https://meet.jit.si/')) {
    return false;
  }
  
  // Extract room name
  const roomName = trimmedLink.replace('https://meet.jit.si/', '').split('?')[0].split('#')[0];
  
  // Room name should be non-empty and URL-safe
  if (!roomName || roomName.length === 0) {
    return false;
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validPattern = /^[a-z0-9_-]+$/i;
  if (!validPattern.test(roomName)) {
    return false;
  }
  
  return true;
}

module.exports = {
  generateJitsiLink,
  validateJitsiLink
};

