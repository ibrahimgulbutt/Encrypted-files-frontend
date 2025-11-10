export const APP_NAME = 'Encrypted Storage'
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const ENCRYPTION_SETTINGS = {
  PBKDF2_ITERATIONS: 100000,
  AES_KEY_LENGTH: 256,
  IV_LENGTH: 12,
  SALT_LENGTH: 32
}

export const FILE_UPLOAD_SETTINGS = {
  MAX_FILES: 10,
  CHUNK_SIZE: 1024 * 1024, // 1MB
  ALLOWED_EXTENSIONS: [
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx',
    '.zip', '.rar', '.mp4', '.avi', '.mov', '.mp3', '.wav'
  ]
}

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_OPEN: 'sidebar_open'
}

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  FILES: '/files',
  PROFILE: '/profile'
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY: '/auth/verify'
  },
  FILES: {
    LIST: '/files',
    UPLOAD: '/files/upload',
    DOWNLOAD: (id: string) => `/files/${id}/download`,
    DELETE: (id: string) => `/files/${id}`,
    METADATA: (id: string) => `/files/${id}`,
    SEARCH: '/files/search',
    STATS: '/files/stats'
  },
  USER: {
    PROFILE: '/user/profile',
    STORAGE: '/user/storage',
    ACTIVITY: '/user/activity',
    DELETE_ACCOUNT: '/user/account'
  }
}

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type is not supported.',
  ENCRYPTION_FAILED: 'Failed to encrypt file.',
  DECRYPTION_FAILED: 'Failed to decrypt file.',
  MASTER_KEY_NOT_FOUND: 'Master key not found. Please login again.'
}

export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTER_SUCCESS: 'Registration successful!',
  LOGOUT_SUCCESS: 'Logged out successfully',
  FILE_UPLOAD_SUCCESS: 'File uploaded successfully!',
  FILE_DELETE_SUCCESS: 'File deleted successfully!',
  PASSWORD_CHANGE_SUCCESS: 'Password changed successfully!'
}