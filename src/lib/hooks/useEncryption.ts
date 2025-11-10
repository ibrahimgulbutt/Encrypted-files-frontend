import { useCallback, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { encryptFile, decryptFile } from '@/lib/crypto/fileEncryption'
import { encryptMetadata, decryptMetadata } from '@/lib/crypto/metadataEncryption'
import { EncryptedFile, DecryptedFileData } from '@/types/file.types'
import toast from 'react-hot-toast'

interface EncryptionProgress {
  stage: 'reading' | 'encrypting' | 'decrypting' | 'complete' | 'error'
  progress: number
  message: string
}

interface UseEncryptionReturn {
  // State
  isEncrypting: boolean
  isDecrypting: boolean
  progress: EncryptionProgress | null
  
  // Actions
  encryptFileWithProgress: (file: File) => Promise<Omit<EncryptedFile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  decryptFileWithProgress: (
    encryptedFile: { encryptedData: string; encryptedKey: string; iv: string; salt: string },
    filename: string,
    mimeType: string
  ) => Promise<DecryptedFileData>
  encryptFileMetadata: (metadata: { filename: string; size: number; mimeType: string }) => Promise<string>
  decryptFileMetadata: (encryptedMetadata: string) => Promise<{ filename: string; size: number; mimeType: string }>
  
  // Utilities
  validateMasterKey: () => boolean
  clearProgress: () => void
}

/**
 * Encryption hook that provides file encryption/decryption with progress tracking
 */
export function useEncryption(): UseEncryptionReturn {
  const { masterKey } = useAuthStore()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [progress, setProgress] = useState<EncryptionProgress | null>(null)

  const updateProgress = useCallback((update: Partial<EncryptionProgress>) => {
    setProgress(prev => prev ? { ...prev, ...update } : null)
  }, [])

  const validateMasterKey = useCallback((): boolean => {
    if (!masterKey) {
      toast.error('Master key not available. Please login again.')
      return false
    }
    return true
  }, [masterKey])

  const encryptFileWithProgress = useCallback(async (file: File) => {
    if (!validateMasterKey()) {
      throw new Error('Master key not available')
    }

    setIsEncrypting(true)
    setProgress({
      stage: 'reading',
      progress: 0,
      message: 'Reading file...'
    })

    try {
      // Simulate progress for reading file
      updateProgress({ progress: 10, message: 'Preparing encryption...' })
      
      // Start encryption
      updateProgress({
        stage: 'encrypting',
        progress: 25,
        message: 'Encrypting file data...'
      })

      const encryptedFileData = await encryptFile(file, masterKey!)
      
      updateProgress({
        progress: 80,
        message: 'Finalizing encryption...'
      })

      // Complete
      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Encryption complete!'
      })

      return encryptedFileData

    } catch (error) {
      setProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Encryption failed'
      })
      throw error
    } finally {
      setIsEncrypting(false)
      // Clear progress after delay
      setTimeout(() => setProgress(null), 3000)
    }
  }, [masterKey, validateMasterKey, updateProgress])

  const decryptFileWithProgress = useCallback(async (
    encryptedFile: { encryptedData: string; encryptedKey: string; iv: string; salt: string },
    filename: string,
    mimeType: string
  ) => {
    if (!validateMasterKey()) {
      throw new Error('Master key not available')
    }

    setIsDecrypting(true)
    setProgress({
      stage: 'decrypting',
      progress: 0,
      message: 'Preparing decryption...'
    })

    try {
      updateProgress({ progress: 25, message: 'Decrypting file key...' })
      
      updateProgress({ progress: 50, message: 'Decrypting file data...' })
      
      const decryptedFileData = await decryptFile(
        encryptedFile,
        masterKey!,
        filename,
        mimeType
      )
      
      updateProgress({ progress: 90, message: 'Preparing download...' })

      setProgress({
        stage: 'complete',
        progress: 100,
        message: 'Decryption complete!'
      })

      return decryptedFileData

    } catch (error) {
      setProgress({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Decryption failed'
      })
      throw error
    } finally {
      setIsDecrypting(false)
      // Clear progress after delay
      setTimeout(() => setProgress(null), 3000)
    }
  }, [masterKey, validateMasterKey, updateProgress])

  const encryptFileMetadata = useCallback(async (
    metadata: { filename: string; size: number; mimeType: string }
  ) => {
    if (!validateMasterKey()) {
      throw new Error('Master key not available')
    }

    try {
      return await encryptMetadata(metadata, masterKey!)
    } catch (error) {
      toast.error('Failed to encrypt metadata')
      throw error
    }
  }, [masterKey, validateMasterKey])

  const decryptFileMetadata = useCallback(async (encryptedMetadata: string) => {
    if (!validateMasterKey()) {
      throw new Error('Master key not available')
    }

    try {
      return await decryptMetadata(encryptedMetadata, masterKey!)
    } catch (error) {
      console.error('Failed to decrypt metadata:', error)
      // Return fallback metadata instead of throwing
      return {
        filename: 'Encrypted File',
        size: 0,
        mimeType: 'application/octet-stream'
      }
    }
  }, [masterKey, validateMasterKey])

  const clearProgress = useCallback(() => {
    setProgress(null)
  }, [])

  return {
    // State
    isEncrypting,
    isDecrypting,
    progress,
    
    // Actions
    encryptFileWithProgress,
    decryptFileWithProgress,
    encryptFileMetadata,
    decryptFileMetadata,
    
    // Utilities
    validateMasterKey,
    clearProgress
  }
}