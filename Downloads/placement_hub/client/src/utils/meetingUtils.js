export const formatTimeInTimezone = (utcTimeString, timezone) => {
  if (!utcTimeString) return 'N/A';
  
  try {
    const date = new Date(utcTimeString);
    return date.toLocaleString('en-US', {
      timeZone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return new Date(utcTimeString).toLocaleString();
  }
};

export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getTimeUntilMeeting = (startTime) => {
  if (!startTime) return null;
  
  const now = new Date();
  const meeting = new Date(startTime);
  const diff = meeting - now;
  
  if (diff < 0) return 'Past';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

