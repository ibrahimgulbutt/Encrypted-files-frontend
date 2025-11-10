import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

/**
 * Formats bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Formats date relative to now
 */
export function formatDateRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }

  try {
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'HH:mm')}`
    }

    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'HH:mm')}`
    }

    return formatDistanceToNow(dateObj, { addSuffix: true })
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Formats date to standard format
 */
export function formatDate(date: string | Date, formatString = 'PPP'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  try {
    return format(dateObj, formatString)
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Formats number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString()
}

/**
 * Formats percentage
 */
export function formatPercentage(value: number, total: number): string {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return `${Math.round(percentage)}%`
}

/**
 * Formats duration in milliseconds
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  }

  return `${seconds}s`
}

/**
 * Truncates text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Capitalizes first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Formats file count
 */
export function formatFileCount(count: number): string {
  if (count === 0) return 'No files'
  if (count === 1) return '1 file'
  return `${formatNumber(count)} files`
}