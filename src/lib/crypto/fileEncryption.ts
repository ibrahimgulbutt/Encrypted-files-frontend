import { EncryptedFile, DecryptedFileData } from '@/types/file.types'
import { generateIV } from './keyDerivation'

/**
 * Converts ArrayBuffer or Uint8Array to base64 string in chunks to avoid stack overflow
 * @param buffer - ArrayBuffer or Uint8Array to convert
 * @returns string - base64 encoded string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const chunkSize = 0x8000 // 32KB chunks
  let result = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    result += String.fromCharCode(...chunk)
  }
  
  return btoa(result)
}

/**
 * Converts base64 string to Uint8Array in chunks to avoid stack overflow
 * @param base64 - base64 encoded string
 * @returns Uint8Array - decoded bytes
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // Validate base64 string format
    if (!base64 || typeof base64 !== 'string') {
      throw new Error('Invalid base64 input: not a string')
    }
    
    // Clean the base64 string (remove any whitespace)
    const cleanBase64 = base64.trim()
    
    // Check for valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
    if (!base64Regex.test(cleanBase64)) {
      console.error('Invalid base64 characters detected in string:', cleanBase64.substring(0, 100))
      throw new Error('Invalid base64 format: contains invalid characters')
    }
    
    const binary = atob(cleanBase64)
    const bytes = new Uint8Array(binary.length)
    
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    
    return bytes
  } catch (error) {
    console.error('base64ToUint8Array error:', error)
    console.error('Input base64 string length:', base64?.length)
    console.error('Input base64 string sample:', base64?.substring(0, 200))
    throw new Error(`Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Encrypts a file using AES-GCM encryption
 * @param file - File to encrypt
 * @param masterKey - User's master encryption key
 * @returns Promise<EncryptedFile> - Encrypted file data
 */
export async function encryptFile(
  file: File,
  masterKey: CryptoKey
): Promise<EncryptedFile> {
  console.log('📁 FILE ENCRYPTION DEBUG:')
  console.log('File name:', file.name)
  console.log('File size:', file.size, 'bytes')
  console.log('File type:', file.type)
  
  // Generate random file encryption key
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  
  // Debug: Export and log file key
  const exportedFileKeyDebug = await crypto.subtle.exportKey('raw', fileKey)
  console.log('Generated file key (hex):', Array.from(new Uint8Array(exportedFileKeyDebug)).map(b => b.toString(16).padStart(2, '0')).join(''))

  // Read file as ArrayBuffer
  const fileData = await file.arrayBuffer()

  // Generate IV for file encryption
  const fileIV = generateIV()
  console.log('Generated file IV (hex):', Array.from(fileIV).map(b => b.toString(16).padStart(2, '0')).join(''))

  // Encrypt file data with file key
  console.log('Encrypting file data...')
  const encryptedFileData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: fileIV as BufferSource },
    fileKey,
    fileData
  )
  console.log('File encrypted, size:', encryptedFileData.byteLength, 'bytes')

  // Export file key for encryption with master key
  const exportedFileKey = await crypto.subtle.exportKey('raw', fileKey)

  // Generate IV for file key encryption
  const keyIV = generateIV()
  console.log('Generated key IV (hex):', Array.from(keyIV).map(b => b.toString(16).padStart(2, '0')).join(''))

  // Encrypt file key with master key
  console.log('Encrypting file key with master key...')
  const encryptedFileKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: keyIV as BufferSource },
    masterKey,
    exportedFileKey
  )
  console.log('File key encrypted, size:', encryptedFileKey.byteLength, 'bytes')

  // Convert to base64 for transmission (chunked for large files)
  console.log('Converting to base64...')
  const encryptedData = arrayBufferToBase64(encryptedFileData)
  const encryptedKey = arrayBufferToBase64(encryptedFileKey)
  const iv = arrayBufferToBase64(fileIV)
  const salt = arrayBufferToBase64(keyIV)
  
  console.log('📦 ENCRYPTION RESULTS:')
  console.log('Encrypted data (base64 length):', encryptedData.length)
  console.log('Encrypted key (base64):', encryptedKey.substring(0, 50) + '...')
  console.log('File IV (base64):', iv)
  console.log('Key IV/Salt (base64):', salt)
  console.log('Original file size:', file.size)

  return {
    id: '',
    userId: '',
    encryptedData,
    encryptedKey,
    iv,
    salt,
    size: file.size,
    encrypted_metadata: '',
    createdAt: '',
    updatedAt: ''
  }
}

/**
 * Decrypts an encrypted file from ArrayBuffer
 * @param encryptedFile - Encrypted file data as buffers
 * @param masterKey - User's master encryption key  
 * @param filename - Original filename
 * @param mimeType - Original mime type
 * @returns Promise<DecryptedFileData> - Decrypted file data
 */
export async function decryptFileFromBuffer(
  encryptedFile: { 
    encryptedData: ArrayBuffer; 
    encryptedKey: ArrayBuffer; 
    iv: ArrayBuffer; 
    salt: ArrayBuffer 
  },
  masterKey: CryptoKey,
  filename: string,
  mimeType: string
): Promise<DecryptedFileData> {
  console.log('🔓 FILE DECRYPTION DEBUG:')
  console.log('Filename:', filename)
  console.log('MIME type:', mimeType)
  console.log('Encrypted data size:', encryptedFile.encryptedData.byteLength, 'bytes')
  console.log('Encrypted key size:', encryptedFile.encryptedKey.byteLength, 'bytes')
  console.log('File IV (hex):', Array.from(new Uint8Array(encryptedFile.iv)).map(b => b.toString(16).padStart(2, '0')).join(''))
  console.log('Key IV/Salt (hex):', Array.from(new Uint8Array(encryptedFile.salt)).map(b => b.toString(16).padStart(2, '0')).join(''))
  // Decrypt file key with master key
  console.log('Decrypting file key with master key...')
  const decryptedFileKeyBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: encryptedFile.salt },
    masterKey,
    encryptedFile.encryptedKey
  )
  console.log('File key decrypted, key (hex):', Array.from(new Uint8Array(decryptedFileKeyBuffer)).map(b => b.toString(16).padStart(2, '0')).join(''))

  // Import decrypted file key
  console.log('Importing decrypted file key...')
  const fileKey = await crypto.subtle.importKey(
    'raw',
    decryptedFileKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  console.log('File key imported successfully')

  // Decrypt file data
  console.log('Decrypting file data with file key...')
  const decryptedFileBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: encryptedFile.iv },
    fileKey,
    encryptedFile.encryptedData
  )
  console.log('File data decrypted successfully, size:', decryptedFileBuffer.byteLength, 'bytes')
  console.log('✅ DECRYPTION COMPLETE')

  return {
    data: decryptedFileBuffer,
    filename,
    mimeType
  }
}

/**
 * Decrypts an encrypted file
 * @param encryptedFile - Encrypted file data
 * @param masterKey - User's master encryption key
 * @returns Promise<DecryptedFileData> - Decrypted file data
 */
export async function decryptFile(
  encryptedFile: { encryptedData: string; encryptedKey: string; iv: string; salt: string },
  masterKey: CryptoKey,
  filename: string,
  mimeType: string
): Promise<DecryptedFileData> {
  // Convert from base64
  const encryptedKeyBuffer = base64ToUint8Array(encryptedFile.encryptedKey)
  const keyIV = base64ToUint8Array(encryptedFile.salt)
  const encryptedDataBuffer = base64ToUint8Array(encryptedFile.encryptedData)
  const fileIV = base64ToUint8Array(encryptedFile.iv)

  // Decrypt file key with master key
  const decryptedFileKeyBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: keyIV as BufferSource },
    masterKey,
    encryptedKeyBuffer as BufferSource
  )

  // Import decrypted file key
  const fileKey = await crypto.subtle.importKey(
    'raw',
    decryptedFileKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )

  // Decrypt file data with file key
  const decryptedFileData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fileIV as BufferSource },
    fileKey,
    encryptedDataBuffer as BufferSource
  )

  return {
    data: decryptedFileData,
    filename,
    mimeType
  }
}

/**
 * Encrypts a data chunk for streaming
 * @param chunk - Data chunk to encrypt
 * @param key - Encryption key
 * @param iv - Initialization vector
 * @returns Promise<ArrayBuffer> - Encrypted chunk
 */
export async function encryptChunk(
  chunk: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    chunk
  )
}

/**
 * Decrypts a data chunk for streaming
 * @param encryptedChunk - Encrypted chunk to decrypt
 * @param key - Decryption key
 * @param iv - Initialization vector
 * @returns Promise<ArrayBuffer> - Decrypted chunk
 */
export async function decryptChunk(
  encryptedChunk: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encryptedChunk
  )
}

/**
 * Creates a download blob from decrypted file data
 * @param decryptedData - Decrypted file data
 * @returns Blob - File blob for download
 */
export function createDownloadBlob(decryptedData: DecryptedFileData): Blob {
  return new Blob([decryptedData.data], { type: decryptedData.mimeType })
}

/**
 * Triggers file download in browser
 * @param blob - File blob
 * @param filename - Download filename
 */
export function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}