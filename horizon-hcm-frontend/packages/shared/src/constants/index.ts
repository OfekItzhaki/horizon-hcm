/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.VITE_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
  },
  FILE: {
    MAX_SIZE_MB: 10,
    AVATAR_MAX_SIZE_MB: 2,
    ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif'],
    MAX_MAINTENANCE_PHOTOS: 5,
  },
  MESSAGE: {
    MAX_LENGTH: 2000,
  },
  POLL: {
    MIN_OPTIONS: 2,
  },
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Date Formats
 */
export const DATE_FORMATS = {
  DISPLAY: 'PP', // e.g., Apr 29, 2023
  DISPLAY_WITH_TIME: 'PPp', // e.g., Apr 29, 2023, 9:00 AM
  SHORT: 'P', // e.g., 04/29/2023
  TIME: 'p', // e.g., 9:00 AM
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

/**
 * User Roles
 */
export const USER_ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  COMMITTEE_MEMBER: 'committee_member',
  OWNER: 'owner',
  TENANT: 'tenant',
} as const;

/**
 * Invoice Status
 */
export const INVOICE_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

/**
 * Payment Status
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

/**
 * Maintenance Request Status
 */
export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * Maintenance Request Priority
 */
export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/**
 * Announcement Priority
 */
export const ANNOUNCEMENT_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/**
 * Meeting Status
 */
export const MEETING_STATUS = {
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * RSVP Status
 */
export const RSVP_STATUS = {
  ATTENDING: 'attending',
  NOT_ATTENDING: 'not_attending',
  MAYBE: 'maybe',
} as const;

/**
 * Poll Status
 */
export const POLL_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  DRAFT: 'draft',
} as const;

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  ANNOUNCEMENT: 'announcement',
  MESSAGE: 'message',
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  MAINTENANCE: 'maintenance',
  MEETING: 'meeting',
  POLL: 'poll',
  SYSTEM: 'system',
} as const;

/**
 * Document Categories
 */
export const DOCUMENT_CATEGORIES = {
  FINANCIAL: 'financial',
  LEGAL: 'legal',
  MAINTENANCE: 'maintenance',
  MEETING: 'meeting',
  OTHER: 'other',
} as const;

/**
 * Theme Options
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

/**
 * Language Options
 */
export const LANGUAGES = {
  ENGLISH: 'en',
  HEBREW: 'he',
} as const;

/**
 * Session Configuration
 */
export const SESSION = {
  TIMEOUT_MINUTES: 30,
  WARNING_MINUTES: 2,
} as const;

/**
 * WebSocket Events
 */
export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  NEW_NOTIFICATION: 'notification:new',
  NEW_MESSAGE: 'message:new',
  NEW_ANNOUNCEMENT: 'announcement:new',
  MAINTENANCE_UPDATE: 'maintenance:update',
  POLL_UPDATE: 'poll:update',
} as const;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  SELECTED_BUILDING: 'selected_building',
  LANGUAGE: 'language',
  THEME: 'theme',
  BIOMETRIC_ENABLED: 'biometric_enabled',
} as const;

/**
 * Query Keys for React Query
 */
export const QUERY_KEYS = {
  AUTH: ['auth'],
  USER: ['user'],
  BUILDINGS: ['buildings'],
  APARTMENTS: ['apartments'],
  RESIDENTS: ['residents'],
  INVOICES: ['invoices'],
  PAYMENTS: ['payments'],
  REPORTS: ['reports'],
  ANNOUNCEMENTS: ['announcements'],
  MESSAGES: ['messages'],
  POLLS: ['polls'],
  MAINTENANCE: ['maintenance'],
  MEETINGS: ['meetings'],
  DOCUMENTS: ['documents'],
  NOTIFICATIONS: ['notifications'],
} as const;

/**
 * Debounce Delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  FORM_VALIDATION: 200,
  AUTO_SAVE: 30000, // 30 seconds
} as const;

/**
 * Throttle Delays (in milliseconds)
 */
export const THROTTLE_DELAYS = {
  SCROLL: 100,
  RESIZE: 200,
} as const;

/**
 * Responsive Breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 375,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1920,
} as const;

/**
 * Touch Target Minimum Size (in pixels)
 */
export const TOUCH_TARGET_SIZE = 44;

/**
 * Color Contrast Ratios (WCAG)
 */
export const CONTRAST_RATIOS = {
  NORMAL_TEXT: 4.5,
  LARGE_TEXT: 3.0,
} as const;
