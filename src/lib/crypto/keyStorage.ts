import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface KeyStorageDB extends DBSchema {
  keys: {
    key: string // userId
    value: {
      userId: string
      encryptedKey: string
      iv: string
      createdAt: number
    }
  }
}

const DB_NAME = 'EncryptedStorageKeys'
const DB_VERSION = 1

/**
 * Opens IndexedDB connection
 */
async function openKeyStorage(): Promise<IDBPDatabase<KeyStorageDB>> {
  return openDB<KeyStorageDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'userId' })
      }
    },
  })
}

/**
 * Encrypts and stores the master key in IndexedDB
 * @param userId - User ID
 * @param masterKey - Master encryption key
 * @param sessionPassword - Session password for key encryption
 */
export async function storeMasterKey(
  userId: string,
  masterKey: CryptoKey,
  sessionPassword: string
): Promise<void> {
  try {
    const db = await openKeyStorage()

    // Export the master key
    const exportedKey = await crypto.subtle.exportKey('raw', masterKey)

    // Derive key from session password
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(sessionPassword)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    console.log('🔑 MASTER KEY STORAGE DEBUG:')
    console.log('User ID:', userId)
    console.log('Session password length:', sessionPassword.length)
    
    const salt = crypto.getRandomValues(new Uint8Array(16))
    console.log('Generated salt (hex):', Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''))
    
    const storageKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    
    // Debug: Export and log master key
    console.log('Master key to store (hex):', Array.from(new Uint8Array(exportedKey)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Master key length:', exportedKey.byteLength, 'bytes')

    // Encrypt master key
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      storageKey,
      exportedKey
    )

    // Combine salt, iv, and encrypted key
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedKey.byteLength
    )
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedKey), salt.length + iv.length)

    // Store in IndexedDB
    await db.put('keys', {
      userId,
      encryptedKey: btoa(String.fromCharCode(...combined)),
      iv: btoa(String.fromCharCode(...iv)),
      createdAt: Date.now()
    })

    db.close()
  } catch (error) {
    console.error('Error storing master key:', error)
    throw new Error('Failed to store master key')
  }
}

/**
 * Retrieves and decrypts the master key from IndexedDB
 * @param userId - User ID
 * @param sessionPassword - Session password for key decryption
 * @returns Promise<CryptoKey> - Decrypted master key
 */
export async function retrieveMasterKey(
  userId: string,
  sessionPassword: string
): Promise<CryptoKey> {
  try {
    const db = await openKeyStorage()
    const keyData = await db.get('keys', userId)
    db.close()

    if (!keyData) {
      throw new Error('Master key not found')
    }

    // Convert from base64
    const combined = Uint8Array.from(atob(keyData.encryptedKey), c => c.charCodeAt(0))

    // Extract salt, iv, and encrypted key
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encryptedKey = combined.slice(28)

    console.log('🔓 MASTER KEY RETRIEVAL DEBUG:')
    console.log('User ID:', userId)
    console.log('Retrieved salt (hex):', Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Retrieved IV (hex):', Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Session password length:', sessionPassword.length)

    // Derive storage key from session password
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(sessionPassword)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    const storageKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // Decrypt master key
    const decryptedKeyBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      storageKey,
      encryptedKey
    )

    // Import as CryptoKey
    const masterKey = await crypto.subtle.importKey(
      'raw',
      decryptedKeyBuffer,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )

    console.log('Retrieved master key (hex):', Array.from(new Uint8Array(decryptedKeyBuffer)).map(b => b.toString(16).padStart(2, '0')).join(''))
    console.log('Master key successfully retrieved and imported')

    return masterKey
  } catch (error) {
    console.error('Error retrieving master key:', error)
    throw new Error('Failed to retrieve master key')
  }
}

/**
 * Deletes the master key from IndexedDB
 * @param userId - User ID
 */
export async function deleteMasterKey(userId: string): Promise<void> {
  try {
    const db = await openKeyStorage()
    await db.delete('keys', userId)
    db.close()
  } catch (error) {
    console.error('Error deleting master key:', error)
    throw new Error('Failed to delete master key')
  }
}

/**
 * Checks if a master key exists for the user
 * @param userId - User ID
 * @returns Promise<boolean> - True if key exists
 */
export async function keyExists(userId: string): Promise<boolean> {
  try {
    const db = await openKeyStorage()
    const keyData = await db.get('keys', userId)
    db.close()
    return !!keyData
  } catch (error) {
    console.error('Error checking key existence:', error)
    return false
  }
}

/**
 * Clears all stored keys (for logout)
 */
export async function clearAllKeys(): Promise<void> {
  try {
    const db = await openKeyStorage()
    await db.clear('keys')
    db.close()
  } catch (error) {
    console.error('Error clearing keys:', error)
    throw new Error('Failed to clear keys')
  }
}