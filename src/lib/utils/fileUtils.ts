/**
 * File utility functions
 */

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-rar-compressed',
  'video/mp4',
  'video/avi',
  'video/mov',
  'audio/mp3',
  'audio/wav'
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Validates file type
 */
export function validateFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.includes(file.type)
}

/**
 * Validates file size
 */
export function validateFileSize(file: File, maxSize = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

/**
 * Gets file icon based on MIME type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
  return '📁'
}

/**
 * Generates a unique file ID
 */
export function generateFileId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2)}`
}

/**
 * Reads file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Reads file as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Creates a preview URL for images
 */
export function createImagePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

/**
 * Revokes a preview URL
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Checks if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Checks if file is a video
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Checks if file is an audio file
 */
export function isAudioFile(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

/**
 * Sanitizes filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255)
}