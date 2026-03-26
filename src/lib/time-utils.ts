/**
 * Time and duration utilities
 */

export function secondsToMs(seconds: number) {
  return seconds * 1000;
}

export function minutesToMs(minutes: number) {
  return minutes * 60 * 1000;
}

export function hoursToMs(hours: number) {
  return hours * 60 * 60 * 1000;
}

export function daysToMs(days: number) {
  return days * 24 * 60 * 60 * 1000;
}

export function msToSeconds(ms: number) {
  return Math.floor(ms / 1000);
}

export function msToMinutes(ms: number) {
  return Math.floor(ms / 60000);
}

export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

export function isExpired(expiryTime: number) {
  return Date.now() > expiryTime;
}

export function timeUntil(expiryTime: number) {
  return Math.max(0, expiryTime - Date.now());
}