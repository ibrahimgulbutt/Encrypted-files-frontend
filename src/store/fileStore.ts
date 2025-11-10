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
          
          // Decrypt filenames and metadata for display
          const filesWithDecryptedNames = await Promise.all(
            response.files.map(async (file) => {
              try {
                const metadata = await decryptMetadata(file.encrypted_metadata, masterKey)
                return {
                  ...file,
                  originalName: metadata.filename,
                  mimeType: metadata.mimeType,
                  originalSize: metadata.size,
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
          
          // Prepare server metadata (for backward compatibility)
          const serverMetadata = {
            encrypted_size: encryptedSize,
            encrypted_type: encryptedType,
            encrypted_original_name: encryptedOriginalName,
            encrypted_key: encryptedFileData.encryptedKey,
            iv: encryptedFileData.iv,
            salt: encryptedFileData.salt
          }
          
          await filesApi.uploadFile(
            encryptedBlob,
            encryptedFilename,
            encryptedMetadata, // Use the encrypted metadata that includes keys
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

          // Decrypt metadata to get original filename and encryption keys
          const metadata = await decryptMetadata(file.encrypted_metadata, masterKey)
          
          // Debug: Check metadata structure
          console.log('Decrypted metadata:', metadata)
          console.log('encryptedKey exists:', !!metadata.encryptedKey)

          // Work directly with ArrayBuffer to avoid base64 conversion issues
          const encryptedDataBuffer = await encryptedFileBlob.arrayBuffer()
          
          // Check if metadata has encryption keys (new format)
          if (!metadata.encryptedKey || !metadata.iv || !metadata.salt) {
            // Handle legacy files - these were uploaded before we fixed the metadata format
            console.warn('Legacy file detected - encryption keys not found in metadata')
            console.log('Available file fields:', Object.keys(file))
            
            throw new Error('This file was uploaded with an older version that stored encryption keys differently. The download feature is not available for legacy files. Please delete and re-upload this file to enable downloads.')
          }
          
          // Extract encryption info from metadata and convert from base64 to ArrayBuffer
          const encryptionData = {
            encryptedData: encryptedDataBuffer,
            encryptedKey: base64ToUint8Array(metadata.encryptedKey).buffer as ArrayBuffer,
            iv: base64ToUint8Array(metadata.iv).buffer as ArrayBuffer,
            salt: base64ToUint8Array(metadata.salt).buffer as ArrayBuffer
          }

          // Decrypt file using buffer-based method
          const decryptedFile = await decryptFileFromBuffer(
            encryptionData,
            masterKey,
            metadata.filename,
            metadata.mimeType
          )

          // Create and download blob
          const blob = createDownloadBlob(decryptedFile)
          triggerFileDownload(blob, metadata.filename)

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
                const metadata = await decryptMetadata(file.encrypted_metadata, masterKey)
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