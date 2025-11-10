import { FileMetadata } from '@/types/file.types'

/**
 * Encrypts file metadata (filename, size, type, and encryption keys)
 * @param metadata - File metadata to encrypt
 * @param masterKey - User's master encryption key
 * @returns Promise<string> - Base64 encoded encrypted metadata
 */
export async function encryptMetadata(
  metadata: { 
    filename: string; 
    size: number; 
    mimeType: string;
    encryptedKey?: string;
    iv?: string;
    salt?: string;
  },
  masterKey: CryptoKey
): Promise<string> {
  const metadataString = JSON.stringify(metadata)
  const encoder = new TextEncoder()
  const metadataBuffer = encoder.encode(metadataString)

  // Generate IV for metadata encryption
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt metadata
  const encryptedMetadata = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    metadataBuffer
  )

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedMetadata.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedMetadata), iv.length)

  // Return as base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts file metadata
 * @param encryptedMetadata - Base64 encoded encrypted metadata
 * @param masterKey - User's master encryption key
 * @returns Promise<FileMetadata> - Decrypted metadata
 */
export async function decryptMetadata(
  encryptedMetadata: string,
  masterKey: CryptoKey
): Promise<{ 
  filename: string; 
  size: number; 
  mimeType: string;
  encryptedKey?: string;
  iv?: string;
  salt?: string;
}> {
  try {
    console.log('🔍 METADATA DECRYPTION DEBUG:')
    console.log('Raw encrypted metadata:', typeof encryptedMetadata, encryptedMetadata?.length || 'undefined')
    console.log('Metadata sample:', encryptedMetadata?.substring(0, 100) || 'N/A')
    
    // Validate input
    if (!encryptedMetadata || typeof encryptedMetadata !== 'string') {
      throw new Error(`Invalid metadata: ${typeof encryptedMetadata}`)
    }
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedMetadata), c => c.charCodeAt(0))

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encryptedData = combined.slice(12)

    // Decrypt metadata
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedData
    )

    // Decode and parse JSON
    const decoder = new TextDecoder()
    const metadataString = decoder.decode(decryptedBuffer)
    
    return JSON.parse(metadataString)
  } catch (error) {
    // Handle legacy or corrupted metadata by returning defaults
    console.warn('Failed to decrypt metadata, using defaults:', error)
    return {
      filename: 'Unknown File',
      size: 0,
      mimeType: 'application/octet-stream'
    }
  }
}

/**
 * Encrypts just the filename
 * @param filename - Filename to encrypt
 * @param masterKey - User's master encryption key
 * @returns Promise<string> - Base64 encoded encrypted filename
 */
export async function encryptFilename(
  filename: string,
  masterKey: CryptoKey
): Promise<string> {
  const encoder = new TextEncoder()
  const filenameBuffer = encoder.encode(filename)

  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt filename
  const encryptedFilename = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    filenameBuffer
  )

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedFilename.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedFilename), iv.length)

  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts just the filename
 * @param encryptedFilename - Base64 encoded encrypted filename
 * @param masterKey - User's master encryption key
 * @returns Promise<string> - Decrypted filename
 */
export async function decryptFilename(
  encryptedFilename: string,
  masterKey: CryptoKey
): Promise<string> {
  // Convert from base64
  const combined = Uint8Array.from(atob(encryptedFilename), c => c.charCodeAt(0))

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12)
  const encryptedData = combined.slice(12)

  // Decrypt filename
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    encryptedData
  )

  // Decode string
  const decoder = new TextDecoder()
  return decoder.decode(decryptedBuffer)
}