import apiClient from './client'
import { LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest } from '@/types/auth.types'

export const authApi = {
  /**
   * User registration
   */
  async register(data: RegisterRequest): Promise<{ user_id: string; email: string; created_at: string }> {
    const response = await apiClient.post<{ user_id: string; email: string; created_at: string }>('/auth/register', data)
    return response.data!
  },

  /**
   * Get user's salt for secure login (server-side storage for cross-device compatibility)
   */
  async getSalt(email: string): Promise<{ salt: string }> {
    const response = await apiClient.post<{ salt: string }>('/auth/get-salt', { email })
    return response.data!
  },

  /**
   * User login
   */



  /**
   * User login
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    
    if (response.data) {
      // Store token and user data
      apiClient.setAuthToken(response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    
    return response.data!
  },

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      // Even if logout fails on server, clear local data
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      apiClient.clearAuthToken()
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ access_token: string; expires_in: number }> {
    const response = await apiClient.post<{ access_token: string; expires_in: number }>('/auth/refresh')
    
    if (response.data) {
      apiClient.setAuthToken(response.data.access_token)
    }
    
    return response.data!
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await apiClient.patch<{ message: string }>('/user/password', data)
    return response.data!
  },

  /**
   * Verify token validity
   */
  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/verify')
      return true
    } catch (error) {
      return false
    }
  },

  /**
   * Request password reset (shows warning about data loss)
   * Note: This endpoint may not be implemented due to zero-knowledge architecture
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email })
    return response.data!
  }
}