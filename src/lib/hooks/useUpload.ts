import { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useFiles } from './useFiles'
import { validateFileType, validateFileSize, MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/utils/fileUtils'
import toast from 'react-hot-toast'

interface UploadState {
  isUploading: boolean
  uploadedCount: number
  totalCount: number
  currentFile: string | null
  errors: string[]
}

interface UseUploadReturn {
  // State
  uploadState: UploadState
  isDragActive: boolean
  
  // Dropzone props
  getRootProps: () => any
  getInputProps: () => any
  
  // Actions
  uploadFiles: (files: File[]) => Promise<void>
  cancelUpload: () => void
  clearErrors: () => void
  
  // Validation
  validateFiles: (files: File[]) => { valid: File[]; invalid: Array<{ file: File; error: string }> }
}

/**
 * File upload hook with drag & drop support and validation
 */
export function useUpload(): UseUploadReturn {
  const { uploadFiles: storeUploadFiles } = useFiles()
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    uploadedCount: 0,
    totalCount: 0,
    currentFile: null,
    errors: []
  })
  
  const uploadCancelRef = useRef<boolean>(false)

  const validateFiles = useCallback((files: File[]) => {
    const valid: File[] = []
    const invalid: Array<{ file: File; error: string }> = []

    files.forEach(file => {
      // Check file size
      if (!validateFileSize(file, MAX_FILE_SIZE)) {
        invalid.push({
          file,
          error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
        })
        return
      }

      // Check file type
      if (!validateFileType(file)) {
        invalid.push({
          file,
          error: 'File type not supported'
        })
        return
      }

      // Check for duplicate names in the current batch
      const duplicate = valid.find(validFile => validFile.name === file.name)
      if (duplicate) {
        invalid.push({
          file,
          error: 'Duplicate file name in selection'
        })
        return
      }

      valid.push(file)
    })

    return { valid, invalid }
  }, [])

  const uploadFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      toast.error('No files selected')
      return
    }

    // Validate files
    const { valid, invalid } = validateFiles(files)
    
    if (invalid.length > 0) {
      const errorMessages = invalid.map(({ file, error }) => `${file.name}: ${error}`)
      setUploadState(prev => ({
        ...prev,
        errors: errorMessages
      }))
      
      toast.error(`${invalid.length} file(s) failed validation`)
      
      if (valid.length === 0) {
        return
      }
    }

    // Start upload process
    setUploadState({
      isUploading: true,
      uploadedCount: 0,
      totalCount: valid.length,
      currentFile: null,
      errors: invalid.length > 0 ? uploadState.errors : []
    })

    uploadCancelRef.current = false

    try {
      for (let i = 0; i < valid.length; i++) {
        if (uploadCancelRef.current) {
          toast('Upload cancelled', { icon: 'ℹ️' })
          break
        }

        const file = valid[i]
        
        setUploadState(prev => ({
          ...prev,
          currentFile: file.name
        }))

        try {
          await storeUploadFiles([file])
          
          setUploadState(prev => ({
            ...prev,
            uploadedCount: prev.uploadedCount + 1,
            currentFile: null
          }))

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Upload failed'
          
          setUploadState(prev => ({
            ...prev,
            errors: [...prev.errors, `${file.name}: ${errorMessage}`]
          }))
          
          // Continue with other files
          console.error(`Failed to upload ${file.name}:`, error)
        }
      }

      // Show completion message
      const successCount = uploadState.uploadedCount
      const errorCount = uploadState.errors.length
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} file(s)`)
      } else if (successCount > 0 && errorCount > 0) {
        toast.success(`Uploaded ${successCount} file(s) with ${errorCount} error(s)`)
      } else if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} file(s)`)
      }

    } finally {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        currentFile: null
      }))
    }
  }, [validateFiles, storeUploadFiles, uploadState.errors])

  const cancelUpload = useCallback(() => {
    uploadCancelRef.current = true
    setUploadState(prev => ({
      ...prev,
      isUploading: false,
      currentFile: null
    }))
    toast('Cancelling upload...', { icon: 'ℹ️' })
  }, [])

  const clearErrors = useCallback(() => {
    setUploadState(prev => ({
      ...prev,
      errors: []
    }))
  }, [])

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    uploadFiles(acceptedFiles)
  }, [uploadFiles])

  const onDropRejected = useCallback((rejectedFiles: any[]) => {
    const errors = rejectedFiles.map(({ file, errors }) => {
      const errorMessages = errors.map((error: any) => {
        switch (error.code) {
          case 'file-too-large':
            return 'File too large'
          case 'file-invalid-type':
            return 'File type not supported'
          case 'too-many-files':
            return 'Too many files'
          default:
            return error.message
        }
      })
      return `${file.name}: ${errorMessages.join(', ')}`
    })

    setUploadState(prev => ({
      ...prev,
      errors: [...prev.errors, ...errors]
    }))

    toast.error(`${rejectedFiles.length} file(s) rejected`)
  }, [])

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    onDropRejected,
    accept: ALLOWED_FILE_TYPES.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxSize: MAX_FILE_SIZE,
    maxFiles: 10,
    disabled: uploadState.isUploading
  })

  return {
    // State
    uploadState,
    isDragActive,
    
    // Dropzone props
    getRootProps,
    getInputProps,
    
    // Actions
    uploadFiles,
    cancelUpload,
    clearErrors,
    
    // Validation
    validateFiles
  }
}