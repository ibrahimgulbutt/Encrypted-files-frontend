export interface UserProfile {
  id: string
  email: string
  createdAt: string
  lastLogin?: string
  storageUsed: number
  storageLimit: number
  totalFiles: number
}

export interface StorageStats {
  used: number
  limit: number
  percentage: number
  totalFiles: number
  largestFiles: Array<{
    filename: string
    size: number
  }>
}

export interface UpdateProfileRequest {
  email?: string
}

export interface DeleteAccountRequest {
  password_hash: string
}