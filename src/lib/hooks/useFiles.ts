import { useCallback, useEffect, useState } from 'react'
import { useFileStore } from '@/store/fileStore'
import { useAuthStore } from '@/store/authStore'
import { FileMetadata, FileUploadState } from '@/types/file.types'
import { formatBytes } from '@/lib/utils/formatters'
import toast from 'react-hot-toast'

interface UseFilesReturn {
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
  
  // Computed
  storagePercentage: number
  availableStorage: number
  
  // Actions
  fetchFiles: (page?: number) => Promise<void>
  uploadFiles: (files: File[]) => Promise<void>
  downloadFile: (fileId: string) => Promise<void>
  deleteFile: (fileId: string) => Promise<void>
  deleteSelectedFiles: () => Promise<void>
  deleteAllFiles: () => Promise<void>
  searchFiles: (query: string) => Promise<void>
  refreshFiles: () => Promise<void>
  getTotalStorageUsed: () => number
  
  // Selection
  toggleFileSelection: (fileId: string) => void
  selectAllFiles: () => void
  clearSelection: () => void
  
  // Utilities
  getFileIcon: (mimeType: string) => string
  formatFileSize: (size: number) => string
  isFileSelected: (fileId: string) => boolean
}

/**
 * File management hook that provides file operations and state
 */
export function useFiles(): UseFilesReturn {
  const { masterKey, user } = useAuthStore()
  const {
    files,
    isLoading,
    uploadProgress,
    totalFiles,
    storageUsed,
    storageLimit,
    currentPage,
    totalPages,
    selectedFiles,
    fetchFiles: storeFetchFiles,
    uploadFile: storeUploadFile,
    downloadFile: storeDownloadFile,
    deleteFile: storeDeleteFile,
    deleteSelectedFiles: storeDeleteSelectedFiles,
    searchFiles: storeSearchFiles,
    refreshFiles: storeRefreshFiles,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    initializeStorageData
  } = useFileStore()

  const [searchQuery, setSearchQuery] = useState('')

  // Initialize storage data from user if not already set
  useEffect(() => {
    if (user && storageLimit === 0) {
      initializeStorageData(
        user.storageUsed || 0,
        user.storageLimit || 5368709120 // 5GB default
      )
    }
  }, [user, storageLimit, initializeStorageData])

  const fetchFiles = useCallback(async (page = 1) => {
    if (!masterKey) {
      // Don't show error toast if user is authenticated but just needs to enter password
      if (user) {
        console.log('Master key required for file operations')
      } else {
        toast.error('Please login to view files')
      }
      return
    }
    
    try {
      await storeFetchFiles(page)
    } catch (error) {
      console.error('Failed to fetch files:', error)
    }
  }, [masterKey, storeFetchFiles, user])

  // Auto-fetch files when master key becomes available
  useEffect(() => {
    if (masterKey && user) {
      fetchFiles()
    }
  }, [masterKey, user, fetchFiles])

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!masterKey) {
      toast.error('Please login to upload files')
      return
    }

    if (files.length === 0) {
      toast.error('No files selected')
      return
    }

    // Check storage limit
    const totalSize = files.reduce((acc, file) => acc + file.size, 0)
    const availableSpace = storageLimit - storageUsed
    
    if (totalSize > availableSpace) {
      toast.error(`Not enough storage space. Need ${formatBytes(totalSize)}, have ${formatBytes(availableSpace)}`)
      return
    }

    // Upload files sequentially to avoid overwhelming the system
    for (const file of files) {
      try {
        await storeUploadFile(file)
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error)
        // Continue with other files
      }
    }
  }, [masterKey, storeUploadFile, storageLimit, storageUsed])

  const downloadFile = useCallback(async (fileId: string) => {
    if (!masterKey) {
      toast.error('Please login to download files')
      return
    }

    try {
      await storeDownloadFile(fileId)
    } catch (error) {
      console.error('Failed to download file:', error)
    }
  }, [masterKey, storeDownloadFile])

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      await storeDeleteFile(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    }
  }, [storeDeleteFile])

  const deleteSelectedFiles = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('No files selected')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFiles.length} file(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      await storeDeleteSelectedFiles()
    } catch (error) {
      console.error('Failed to delete selected files:', error)
    }
  }, [selectedFiles, storeDeleteSelectedFiles])

  const searchFiles = useCallback(async (query: string) => {
    setSearchQuery(query)
    
    if (!query.trim()) {
      // If empty query, fetch all files
      await fetchFiles()
      return
    }

    try {
      await storeSearchFiles(query)
    } catch (error) {
      console.error('Failed to search files:', error)
    }
  }, [fetchFiles, storeSearchFiles])

  const refreshFiles = useCallback(async () => {
    if (searchQuery) {
      await searchFiles(searchQuery)
    } else {
      await fetchFiles(currentPage)
    }
  }, [searchQuery, searchFiles, fetchFiles, currentPage])

  // Utility functions
  const getFileIcon = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType === 'application/pdf') return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📊'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️'
    return '📁'
  }, [])

  const formatFileSize = useCallback((size: number): string => {
    return formatBytes(size)
  }, [])

  const isFileSelected = useCallback((fileId: string): boolean => {
    return selectedFiles.includes(fileId)
  }, [selectedFiles])

  const deleteAllFiles = useCallback(async () => {
    if (files.length === 0) {
      toast.error('No files to delete')
      return
    }

    try {
      // Delete all files by calling the delete API for each file
      for (const file of files) {
        await storeDeleteFile(file.id)
      }
      toast.success('All files deleted successfully')
    } catch (error) {
      console.error('Failed to delete all files:', error)
      toast.error('Failed to delete some files')
    }
  }, [files, storeDeleteFile])

  const getTotalStorageUsed = useCallback((): number => {
    return storageUsed
  }, [storageUsed])

  // Computed values
  const storagePercentage = storageLimit > 0 ? (storageUsed / storageLimit) * 100 : 0
  const availableStorage = storageLimit - storageUsed

  return {
    // State
    files,
    isLoading,
    uploadProgress,
    totalFiles,
    storageUsed,
    storageLimit,
    currentPage,
    totalPages,
    selectedFiles,
    
    // Computed
    storagePercentage,
    availableStorage,
    
    // Actions
    fetchFiles,
    uploadFiles,
    downloadFile,
    deleteFile,
    deleteSelectedFiles,
    deleteAllFiles,
    searchFiles,
    refreshFiles,
    getTotalStorageUsed,
    
    // Selection
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    
    // Utilities
    getFileIcon,
    formatFileSize,
    isFileSelected
  }
}