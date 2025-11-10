import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { FileMetadata, EncryptedFile, FileUploadState, EncryptionProgress } from '@/types/file.types'
import { filesApi } from '@/lib/api/files'
import { encryptFile, decryptFile, decryptFileFromBuffer, arrayBufferToBase64, base64ToUint8Array, createDownloadBlob, triggerFileDownload } from '@/lib/crypto/fileEncryption'
import { encryptMetadata, decryptMetadata, encryptFilename } from '@/lib/crypto/metadataEncryption'

// Helper function to encrypt a simple string value
async function encryptValue(value: string, masterKey: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const valueBuffer = encoder.encode(value)
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12))
  
  // Encrypt value
  const encryptedValue = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    valueBuffer
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedValue.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encryptedValue), iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

// Helper function to decrypt a simple string value
async function decryptValue(encryptedValue: string, masterKey: CryptoKey): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedValue), c => c.charCodeAt(0))
    
    // Extract IV (first 12 bytes) and encrypted data (rest)
    const iv = combined.slice(0, 12)
    const encryptedData = combined.slice(12)
    
    // Decrypt value
    const decryptedValue = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      masterKey,
      encryptedData
    )
    
    // Convert back to string
    const decoder = new TextDecoder()
    return decoder.decode(decryptedValue)
  } catch (error) {
    console.error('Failed to decrypt value:', error)
    throw new Error('Decryption failed')
  }
}

import { useAuthStore } from './authStore'
import toast from 'react-hot-toast'

interface FileState {
  // State
  files: FileMetadata[]
  isLoading: boolean
  uploadProgress: FileUploadState
  totalFiles: number
  storageUsed: number
  storageLimit: number
  currentPage: number
  totalPages: number
  selectedFiles: string[]

  // Actions
  fetchFiles: (page?: number, limit?: number) => Promise<void>
  uploadFile: (file: File) => Promise<void>
  downloadFile: (fileId: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  deleteSelectedFiles: () => Promise<void>
  refreshFiles: () => Promise<void>
  setUploadProgress: (fileId: string, progress: Partial<FileUploadState[string]>) => void
  clearUploadProgress: (fileId: string) => void
  toggleFileSelection: (fileId: string) => void
  selectAllFiles: () => void
  clearSelection: () => void
  searchFiles: (query: string) => Promise<void>
  refreshStorageStats: () => Promise<void>
  initializeStorageData: (used: number, limit: number) => void
}

export const useFileStore = create<FileState>()(
  devtools(
    (set, get) => ({
      // Initial state
      files: [],
      isLoading: false,
      uploadProgress: {},
      totalFiles: 0,
      storageUsed: 0,
      storageLimit: 0,
      currentPage: 1,
      totalPages: 1,
      selectedFiles: [],

      // Fetch files with pagination
      fetchFiles: async (page = 1, limit = 20) => {
        set({ isLoading: true })
        
        try {
          const masterKey = useAuthStore.getState().masterKey
          if (!masterKey) {
            throw new Error('Master key not available')
          }

          const response = await filesApi.getFiles({ page, limit })
          
          console.log('📋 FETCH FILES DEBUG:')
          console.log('Server response files:', response.files.length)
          if (response.files.length > 0) {
            console.log('First file sample:', response.files[0])
          }
          
          // Decrypt filenames and metadata for display
          const filesWithDecryptedNames = await Promise.all(
            response.files.map(async (file) => {
            console.log(`Processing file ${file.id}:`, {
                encrypted_filename: file.encrypted_filename?.length,
                encrypted_metadata: typeof file.encrypted_metadata,
                encrypted_metadata_value: file.encrypted_metadata
              })
              
                          // Backend returns structured metadata object per API docs
            console.log('🔍 BACKEND METADATA DEBUG:', {
              type: typeof file.encrypted_metadata,
              isObject: typeof file.encrypted_metadata === 'object',
              keys: typeof file.encrypted_metadata === 'object' ? Object.keys(file.encrypted_metadata || {}) : null,
              metadata: file.encrypted_metadata
            })
            
            try {
              // Extract data from backend's structured metadata
              const metadata = file.encrypted_metadata
              if (!metadata || typeof metadata !== 'object') {
                throw new Error('Invalid metadata structure from backend')
              }
              
              // Decrypt the encrypted metadata fields using master key
              let originalName = 'Unknown File'
              let mimeType = 'application/octet-stream'
              
              if (metadata.encrypted_original_name) {
                try {
                  originalName = await decryptValue(metadata.encrypted_original_name, masterKey)
                } catch (error) {
                  console.warn('Failed to decrypt original name:', error)
                }
              }
              
              if (metadata.encrypted_type) {
                try {
                  mimeType = await decryptValue(metadata.encrypted_type, masterKey)
                } catch (error) {
                  console.warn('Failed to decrypt mime type:', error)
                }
              }
              
              return {
                ...file,
                originalName: originalName,
                mimeType: mimeType,
                originalSize: file.file_size, // Use the actual file size
                uploadedAt: file.uploaded_at,
                updatedAt: file.last_accessed || file.uploaded_at
              }
            } catch (error) {
                console.error('Error decrypting metadata for file:', file.id, error)
                return {
                  ...file,
                  originalName: 'Encrypted File',
                  mimeType: 'application/octet-stream',
                  originalSize: file.file_size || 0,
                  uploadedAt: file.uploaded_at,
                  updatedAt: file.last_accessed || file.uploaded_at
                }
              }
            })
          )

          set({
            files: filesWithDecryptedNames,
            totalFiles: response.pagination.total,
            currentPage: response.pagination.page,
            totalPages: response.pagination.total_pages,
            isLoading: false
          })
          
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Failed to fetch files')
          throw error
        }
      },

      // Upload and encrypt file
      uploadFile: async (file: File) => {
        const fileId = `${Date.now()}-${file.name}`
        
        try {
          const masterKey = useAuthStore.getState().masterKey
          if (!masterKey) {
            throw new Error('Master key not available')
          }

          // Initialize upload progress
          set((state) => ({
            uploadProgress: {
              ...state.uploadProgress,
              [fileId]: {
                file,
                progress: 0,
                stage: 'reading',
                message: 'Reading file...'
              }
            }
          }))

          // Encrypt file
          get().setUploadProgress(fileId, {
            stage: 'encrypting',
            progress: 25,
            message: 'Encrypting file...'
          })

          console.log('🚀 UPLOAD PROCESS DEBUG:')
          console.log('Starting encryption for file:', file.name)
          console.log('File size:', file.size, 'bytes')
          console.log('Using master key from store')

          const encryptedFileData = await encryptFile(file, masterKey)

          // Encrypt metadata
          get().setUploadProgress(fileId, {
            stage: 'encrypting',
            progress: 50,
            message: 'Encrypting metadata...'
          })

          // Encrypt individual metadata fields as expected by API
          get().setUploadProgress(fileId, {
            stage: 'encrypting',
            progress: 50,
            message: 'Encrypting metadata...'
          })

          const encryptedSize = await encryptValue(file.size.toString(), masterKey)
          const encryptedType = await encryptValue(file.type, masterKey)
          const encryptedOriginalName = await encryptValue(file.name, masterKey)

          // Encrypt filename separately
          get().setUploadProgress(fileId, {
            stage: 'encrypting',
            progress: 60,
            message: 'Encrypting filename...'
          })

          const encryptedFilename = await encryptFilename(file.name, masterKey)

          // Upload to server
          get().setUploadProgress(fileId, {
            stage: 'uploading',
            progress: 75,
            message: 'Uploading to server...'
          })

          // Create encrypted file blob (convert base64 back to binary)
          const binaryData = Uint8Array.from(atob(encryptedFileData.encryptedData as string), c => c.charCodeAt(0))
          const encryptedBlob = new Blob([binaryData])
          
          // Create metadata that includes encryption keys for download
          const fileMetadata = {
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            encryptedKey: encryptedFileData.encryptedKey,
            iv: encryptedFileData.iv,
            salt: encryptedFileData.salt
          }
          
          // Encrypt the complete metadata
          const encryptedMetadata = await encryptMetadata(fileMetadata, masterKey)
          
          // Prepare metadata object as expected by backend validation
          const serverMetadata = {
            encrypted_size: encryptedSize,
            encrypted_type: encryptedType, 
            encrypted_original_name: encryptedOriginalName,
            encryption_key: encryptedFileData.encryptedKey,
            iv: encryptedFileData.iv,
            salt: encryptedFileData.salt, // Key IV needed to decrypt the encryption key
            checksum: "" // TODO: Add checksum if needed
          }
          
          console.log('📤 UPLOAD API CALL DEBUG:')
          console.log('Server metadata object:', serverMetadata)
          console.log('Encrypted metadata for internal use:', encryptedMetadata.substring(0, 100))
          
          await filesApi.uploadFile(
            encryptedBlob,
            encryptedFilename,
            serverMetadata, // Send structured metadata as backend expects
            file.size
          )

          // Complete
          get().setUploadProgress(fileId, {
            stage: 'complete',
            progress: 100,
            message: 'Upload complete!'
          })

          // Refresh file list
          get().refreshFiles()
          
          toast.success(`${file.name} uploaded successfully!`)
          
          // Clear progress after delay
          setTimeout(() => {
            get().clearUploadProgress(fileId)
          }, 3000)
          
        } catch (error: any) {
          get().setUploadProgress(fileId, {
            stage: 'error',
            progress: 0,
            message: error.message || 'Upload failed',
            error: error.message
          })
          
          toast.error(error.message || 'Upload failed')
          throw error
        }
      },

      // Download and decrypt file
      downloadFile: async (fileId: string) => {
        try {
          const masterKey = useAuthStore.getState().masterKey
          if (!masterKey) {
            throw new Error('Master key not available')
          }

          const file = get().files.find(f => f.id === fileId)
          if (!file) {
            throw new Error('File not found')
          }

          toast.loading('Downloading file...', { id: fileId })

          // Download encrypted file blob
          const encryptedFileBlob = await filesApi.downloadFile(fileId)
          
          toast.loading('Decrypting file...', { id: fileId })

          console.log('📥 DOWNLOAD PROCESS DEBUG:')
          console.log('File ID:', fileId)
          console.log('Using master key from store')
          console.log('File object:', file)
          console.log('Encrypted metadata:', typeof file.encrypted_metadata, file.encrypted_metadata)
          console.log('Encrypted metadata length:', file.encrypted_metadata?.length || 'undefined')

          // Backend returns structured metadata 
          const metadata = file.encrypted_metadata
          
          console.log('🔍 DOWNLOAD METADATA DEBUG:', {
            type: typeof metadata,
            isObject: typeof metadata === 'object',
            keys: typeof metadata === 'object' ? Object.keys(metadata || {}) : null,
            hasEncryptionKey: !!metadata?.encryption_key,
            hasIV: !!metadata?.iv,
            metadata: metadata
          })

          // Validate metadata structure from backend
          if (!metadata || typeof metadata !== 'object') {
            throw new Error('Invalid metadata structure from backend')
          }
          
          // Backend now provides encryption_key, iv, and salt directly
          if (!metadata.encryption_key || !metadata.iv || !metadata.salt) {
            throw new Error('Missing encryption keys in metadata')
          }
          
          console.log('🔑 BACKEND KEYS DEBUG:')
          console.log('Encryption key exists:', !!metadata.encryption_key)
          console.log('IV exists:', !!metadata.iv)
          console.log('Salt exists:', !!metadata.salt)
          console.log('Encryption key:', metadata.encryption_key.substring(0, 50) + '...')
          console.log('File IV:', metadata.iv)
          console.log('Key salt:', metadata.salt)
          
          // Decrypt filename and mime type for download
          let originalName = 'Unknown File'
          let mimeType = 'application/octet-stream'
          
          if (metadata.encrypted_original_name) {
            try {
              originalName = await decryptValue(metadata.encrypted_original_name, masterKey)
            } catch (error) {
              console.warn('Failed to decrypt original name:', error)
            }
          }
          
          if (metadata.encrypted_type) {
            try {
              mimeType = await decryptValue(metadata.encrypted_type, masterKey)
            } catch (error) {
              console.warn('Failed to decrypt mime type:', error)
            }
          }

          // Get encrypted file data
          const encryptedDataBuffer = await encryptedFileBlob.arrayBuffer()
          
          // Decrypt the file encryption key using master key
          const encryptedKeyData = Uint8Array.from(atob(metadata.encryption_key), c => c.charCodeAt(0))
          console.log('Encrypted key data length:', encryptedKeyData.length)
          
          // Get the key IV (salt) used to encrypt the file key
          if (!metadata.salt) {
            throw new Error('Missing salt (key IV) in metadata - needed to decrypt file key')
          }
          
          const keyIV = Uint8Array.from(atob(metadata.salt), c => c.charCodeAt(0))
          console.log('Key IV length:', keyIV.length)
          
          console.log('� DECRYPTING FILE KEY:')
          console.log('Encrypted key length:', encryptedKeyData.length, '(should be 48)')
          console.log('Key IV length:', keyIV.length, '(should be 12)')
          
          // Decrypt the file key using master key and key IV
          const decryptedKeyData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: keyIV },
            masterKey,
            encryptedKeyData
          )
          
          const decryptedKeyArray = new Uint8Array(decryptedKeyData)
          console.log('Decrypted key length:', decryptedKeyArray.length, '(should be 32)')
          
          // Import the decrypted file key
          const fileKey = await crypto.subtle.importKey(
            'raw',
            decryptedKeyArray,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
          )
          
          // Convert base64 IV to Uint8Array
          const ivBytes = Uint8Array.from(atob(metadata.iv), c => c.charCodeAt(0))
          console.log('IV length:', ivBytes.length)
          
          // Decrypt the file data
          console.log('Starting file decryption...')
          const decryptedData = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: ivBytes
            },
            fileKey,
            encryptedDataBuffer
          )
          
          console.log('File decrypted successfully, size:', decryptedData.byteLength)
          
          // Create download blob
          const decryptedBlob = new Blob([decryptedData], { type: mimeType })
          const downloadUrl = URL.createObjectURL(decryptedBlob)
          
          // Trigger download
          const downloadLink = document.createElement('a')
          downloadLink.href = downloadUrl
          downloadLink.download = originalName
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          
          // Clean up
          URL.revokeObjectURL(downloadUrl)

          toast.success('File downloaded successfully!', { id: fileId })
          
        } catch (error: any) {
          toast.error(error.message || 'Download failed', { id: fileId })
          throw error
        }
      },

      // Delete file
      deleteFile: async (fileId: string) => {
        try {
          const file = get().files.find(f => f.id === fileId)
          const filename = file?.originalName || 'file'
          
          await filesApi.deleteFile(fileId)
          
          // Remove from local state
          set((state) => ({
            files: state.files.filter(f => f.id !== fileId),
            selectedFiles: state.selectedFiles.filter(id => id !== fileId),
            totalFiles: state.totalFiles - 1
          }))
          
          toast.success(`${filename} deleted successfully!`)
          
        } catch (error: any) {
          toast.error(error.message || 'Delete failed')
          throw error
        }
      },

      // Delete selected files
      deleteSelectedFiles: async () => {
        const { selectedFiles } = get()
        
        if (selectedFiles.length === 0) {
          toast.error('No files selected')
          return
        }

        try {
          await Promise.all(selectedFiles.map(fileId => filesApi.deleteFile(fileId)))
          
          // Remove from local state
          set((state) => ({
            files: state.files.filter(f => !selectedFiles.includes(f.id)),
            selectedFiles: [],
            totalFiles: state.totalFiles - selectedFiles.length
          }))
          
          toast.success(`${selectedFiles.length} files deleted successfully!`)
          
        } catch (error: any) {
          toast.error(error.message || 'Batch delete failed')
          throw error
        }
      },

      // Refresh files
      refreshFiles: async () => {
        const { currentPage } = get()
        await get().fetchFiles(currentPage)
      },

      // Set upload progress
      setUploadProgress: (fileId: string, progress: Partial<FileUploadState[string]>) => {
        set((state) => ({
          uploadProgress: {
            ...state.uploadProgress,
            [fileId]: {
              ...state.uploadProgress[fileId],
              ...progress
            }
          }
        }))
      },

      // Clear upload progress
      clearUploadProgress: (fileId: string) => {
        set((state) => {
          const { [fileId]: removed, ...remaining } = state.uploadProgress
          return { uploadProgress: remaining }
        })
      },

      // Toggle file selection
      toggleFileSelection: (fileId: string) => {
        set((state) => ({
          selectedFiles: state.selectedFiles.includes(fileId)
            ? state.selectedFiles.filter(id => id !== fileId)
            : [...state.selectedFiles, fileId]
        }))
      },

      // Select all files
      selectAllFiles: () => {
        set((state) => ({
          selectedFiles: state.files.map(f => f.id)
        }))
      },

      // Clear selection
      clearSelection: () => {
        set({ selectedFiles: [] })
      },

      // Search files
      searchFiles: async (query: string) => {
        set({ isLoading: true })
        
        try {
          const masterKey = useAuthStore.getState().masterKey
          if (!masterKey) {
            throw new Error('Master key not available')
          }

          const response = await filesApi.searchFiles(query)
          
          // Decrypt filenames for display
          const filesWithDecryptedNames = await Promise.all(
            response.files.map(async (file) => {
              try {
                // Handle new format where encrypted_metadata is an object containing the actual encrypted metadata string
                const encryptedMetadataString = typeof file.encrypted_metadata === 'object' 
                  ? file.encrypted_metadata?.encrypted_metadata 
                  : file.encrypted_metadata;
                
                const metadata = await decryptMetadata(encryptedMetadataString, masterKey)
                return {
                  ...file,
                  originalName: metadata.filename
                }
              } catch (error) {
                return {
                  ...file,
                  originalName: 'Encrypted File'
                }
              }
            })
          )

          set({
            files: filesWithDecryptedNames,
            totalFiles: response.pagination.total,
            isLoading: false
          })
          
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Search failed')
          throw error
        }
      },

      // Refresh storage stats
      refreshStorageStats: async () => {
        try {
          const stats = await filesApi.getStorageStats()
          set({
            storageUsed: stats.used,
            storageLimit: stats.limit,
            totalFiles: stats.totalFiles
          })
        } catch (error: any) {
          console.error('Failed to refresh storage stats:', error)
        }
      },

      // Initialize storage data from login response
      initializeStorageData: (used: number, limit: number) => {
        set({
          storageUsed: used,
          storageLimit: limit
        })
      }
    }),
    {
      name: 'file-store'
    }
  )
)