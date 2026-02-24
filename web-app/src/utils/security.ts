import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Mask sensitive information (credit card, phone, etc.)
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return cardNumber;
  return `**** **** **** ${cardNumber.slice(-4)}`;
}

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  return `${username[0]}${'*'.repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return phone;
  return `***-***-${phone.slice(-4)}`;
}

/**
 * Validate input to prevent injection attacks
 */
export function validateInput(input: string, type: 'text' | 'email' | 'number' | 'url'): boolean {
  switch (type) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    case 'number':
      return /^\d+$/.test(input);
    case 'url':
      try {
        new URL(input);
        return true;
      } catch {
        return false;
      }
    case 'text':
    default: {
      // Check for common injection patterns
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(input));
    }
  }
}

/**
 * Generate CSRF token (should be fetched from backend in production)
 */
export function getCsrfToken(): string | null {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') : null;
}

/**
 * Clear sensitive data from storage
 */
export function clearSensitiveData(): void {
  // Clear specific keys, not all localStorage
  const sensitiveKeys = ['auth', 'tokens', 'user', 'payment'];
  sensitiveKeys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/**
 * Check if running in secure context (HTTPS)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || window.location.protocol === 'https:';
}
