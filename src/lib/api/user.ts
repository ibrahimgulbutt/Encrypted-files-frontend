import apiClient from './client'
import { UserProfile, StorageStats, UpdateProfileRequest } from '@/types/user.types'

export const userApi = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>('/user/profile')
    return response.data!
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    const response = await apiClient.patch<UserProfile>('/user/profile', data)
    return response.data!
  },

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<StorageStats> {
    const response = await apiClient.get<StorageStats>('/user/storage')
    return response.data!
  },

  /**
   * Delete user account
   */
  async deleteAccount(passwordHash: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/user/account', {
      data: { password_hash: passwordHash }
    })
    return response.data!
  },

  /**
   * Get account activity log
   */
  async getActivityLog(): Promise<Array<{
    id: string
    action: string
    timestamp: string
    ip?: string
    userAgent?: string
  }>> {
    const response = await apiClient.get<Array<{
      id: string
      action: string
      timestamp: string
      ip?: string
      userAgent?: string
    }>>('/user/activity')
    return response.data!
  }
}