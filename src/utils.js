/**
 * Utility Functions
 * Clipboard, sanitization, validation, etc.
 */

/**
 * Clean payload text - remove markdown formatting
 */
export function cleanPayload(text = '') {
  if (!text) return '';
  return String(text)
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\(d\)/gi, '')
    .replace(/__/g, '')
    .trim();
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text) {
  if (!text) return false;

  const cleanText = cleanPayload(text);

  // Try modern clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(cleanText);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand');
    }
  }

  // Fallback to legacy method
  try {
    const textArea = document.createElement('textarea');
    textArea.value = cleanText;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Clipboard copy failed:', err);
    return false;
  }
}

/**
 * Share functionality with fallback to email
 */
export async function shareContent(title, text, url) {
  const shareData = {
    title,
    text,
    url: url || window.location.href
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return true;
    } else {
      // Fallback to mailto
      const mailto = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + shareData.url)}`;
      window.location.href = mailto;
      return true;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('Share failed:', err);
    }
    return false;
  }
}

/**
 * Detect if user prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detect if running as PWA
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Get network status
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format timestamp to human-readable
 */
export function formatTimestamp(timestamp) {
  if (!timestamp) return '';

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
