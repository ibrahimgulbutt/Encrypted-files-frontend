import apiClient from './client'
import { 
  FileMetadata, 
  UploadFileRequest, 
  UploadFileResponse, 
  FileListResponse,
  DownloadFileResponse
} from '@/types/file.types'
import { PaginationParams } from '@/types/api.types'

export const filesApi = {
  /**
   * Upload encrypted file
   */
  async uploadFile(
    encryptedFile: Blob, 
    encryptedFilename: string, 
    metadata: any, 
    fileSize: number
  ): Promise<UploadFileResponse> {
    console.log('📡 FILES API DEBUG:')
    console.log('Metadata received:', metadata)
    console.log('Metadata type:', typeof metadata)
    
    const formData = new FormData()
    formData.append('file', encryptedFile)
    formData.append('encrypted_filename', encryptedFilename)
    formData.append('encrypted_metadata', JSON.stringify(metadata))
    formData.append('file_size', fileSize.toString())
    
    console.log('Final metadata JSON:', JSON.stringify(metadata))

    const response = await apiClient.post<UploadFileResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data!
  },

  /**
   * Get list of user files with pagination
   */
  async getFiles(params?: PaginationParams): Promise<FileListResponse> {
    const response = await apiClient.get<FileListResponse>('/files', { params })
    return response.data!
  },

  /**
   * Get download URL for encrypted file
   */
  async getDownloadUrl(fileId: string): Promise<{ download_url: string; expires_in: number }> {
    const response = await apiClient.get<{ download_url: string; expires_in: number }>(`/files/${fileId}/download`)
    return response.data!
  },

  /**
   * Download encrypted file using pre-signed URL
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const { download_url } = await this.getDownloadUrl(fileId)
    const response = await fetch(download_url)
    return await response.blob()
  },

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/files/${fileId}`)
    return response.data!
  },

  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const response = await apiClient.get<FileMetadata>(`/files/${fileId}`)
    return response.data!
  },

  /**
   * Search files
   */
  async searchFiles(query: string, params?: PaginationParams): Promise<FileListResponse> {
    const response = await apiClient.get<FileListResponse>('/files/search', {
      params: { q: query, ...params }
    })
    return response.data!
  },

  /**
   * Get storage stats
   */
  async getStorageStats(): Promise<{
    used: number
    limit: number
    totalFiles: number
  }> {
    const response = await apiClient.get<{
      used: number
      limit: number
      totalFiles: number
    }>('/files/stats')
    return response.data!
  },

  /**
   * Batch delete files
   */
  async deleteFiles(fileIds: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.post<{ message: string; deletedCount: number }>('/files/batch-delete', {
      fileIds
    })
    return response.data!
  },

  /**
   * Update file metadata (encrypted)
   */
  async updateFileMetadata(
    fileId: string, 
    encryptedMetadata: string
  ): Promise<FileMetadata> {
    const response = await apiClient.patch<FileMetadata>(`/files/${fileId}`, {
      encrypted_metadata: encryptedMetadata
    })
    return response.data!
  }
}