export interface FileMetadata {
  id: string
  encrypted_filename: string
  encrypted_metadata: any
  file_size: number
  uploaded_at: string
  last_accessed: string
  // Computed client-side after decryption
  originalName?: string
  filename?: string
  size?: number
  mimeType?: string
  uploadedAt?: string
  updatedAt?: string
  isEncrypted?: boolean
}

export interface EncryptedFile {
  id: string
  userId: string
  encryptedData: ArrayBuffer | string
  encryptedKey: string
  iv: string
  salt: string
  size: number
  encrypted_metadata: string
  createdAt: string
  updatedAt: string
}

export interface UploadFileRequest {
  encrypted_data: string // base64 encoded
  encrypted_key: string
  iv: string
  salt: string
  size: number
  encrypted_metadata: string
}

export interface UploadFileResponse {
  file_id: string
  uploaded_at: string
  storage_path: string
  file_size: number
}

export interface FileListResponse {
  files: Array<{
    id: string
    encrypted_filename: string
    encrypted_metadata: any
    file_size: number
    uploaded_at: string
    last_accessed: string
  }>
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

export interface DownloadFileResponse {
  encryptedData: string // base64 encoded
  encryptedKey: string
  iv: string
  salt: string
}

export interface EncryptionProgress {
  fileId: string
  stage: 'reading' | 'encrypting' | 'uploading' | 'complete' | 'error'
  progress: number
  message: string
}

export interface DecryptedFileData {
  data: ArrayBuffer
  filename: string
  mimeType: string
}

export interface FileUploadState {
  [fileId: string]: {
    file: File
    progress: number
    stage: EncryptionProgress['stage']
    message: string
    error?: string
  }
}