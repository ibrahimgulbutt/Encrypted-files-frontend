import { PasswordStrength } from '@/types/auth.types'

/**
 * Derives a cryptographic key from a password using PBKDF2
 * @param password - User's password
 * @param salt - Random salt (base64 encoded)
 * @returns Promise<CryptoKey> - AES-256 master key
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: string
): Promise<CryptoKey> {
  console.log('🔑 MASTER KEY DERIVATION DEBUG:')
  console.log('Password length:', password.length)
  console.log('Salt (base64):', salt)
  
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)
  const saltBuffer = Uint8Array.from(atob(salt), c => c.charCodeAt(0))
  
  console.log('Salt buffer (hex):', Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('Password buffer length:', passwordBuffer.length, 'bytes')

  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive AES-256 key using PBKDF2
  console.log('Deriving key with PBKDF2 (100,000 iterations)...')
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // Make key extractable so we can store it
    ['encrypt', 'decrypt']
  )

  // Debug: Export and log the derived master key
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey)
  console.log('Derived master key (hex):', Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join(''))

  return derivedKey
}

/**
 * Generates a random salt for key derivation
 * @returns string - Base64 encoded salt (16 bytes = 24 base64 chars)
 */
export function generateSalt(): string {
  const saltArray = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...saltArray))
}

/**
 * Hashes password with salt using SHA-256 for server authentication
 * @param password - User's password
 * @param salt - Base64 encoded salt
 * @returns Promise<string> - Base64 encoded salted hash (compact for bcrypt compatibility)
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder()
  
  if (salt) {
    // Create salted hash by combining password + salt
    const saltedPassword = password + salt
    const passwordBuffer = encoder.encode(saltedPassword)
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer)
    
    // Convert to base64 for compactness (32 bytes = 44 base64 chars vs 64 hex chars)
    const hashArray = new Uint8Array(hashBuffer)
    const base64Hash = btoa(String.fromCharCode(...hashArray))
    
    // Truncate to ensure we stay under bcrypt's 72-byte limit
    return base64Hash.substring(0, 43) // 43 chars = ~32 bytes
  } else {
    // Plain password hash (backward compatibility)
    const passwordBuffer = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer)
    
    // Convert to base64 for compactness
    const hashArray = new Uint8Array(hashBuffer)
    const base64Hash = btoa(String.fromCharCode(...hashArray))
    
    // Truncate to ensure we stay under bcrypt's 72-byte limit
    return base64Hash.substring(0, 43) // 43 chars = ~32 bytes
  }
}

/**
 * Generates a random AES-256 master key
 * @returns Promise<CryptoKey> - Random AES-256 key
 */
export async function generateMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true, // Make key extractable so we can store it
    ['encrypt', 'decrypt']
  )
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns PasswordStrength object with score and feedback
 */
export function validatePasswordStrength(password: string) {
  const requirements = {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const score = Object.values(requirements).reduce((acc: number, met: boolean) => acc + (met ? 1 : 0), 0)
  
  const feedback: string[] = []
  if (!requirements.minLength) feedback.push('Use at least 12 characters')
  if (!requirements.hasUppercase) feedback.push('Add uppercase letters')
  if (!requirements.hasLowercase) feedback.push('Add lowercase letters')
  if (!requirements.hasNumber) feedback.push('Add numbers')
  if (!requirements.hasSpecialChar) feedback.push('Add special characters')

  return {
    score,
    feedback,
    requirements
  }
}

/**
 * Generates a random initialization vector
 * @returns Uint8Array - 12-byte IV for AES-GCM
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(12))
}