import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { User } from '@/types/auth.types'
import toast from 'react-hot-toast'

interface UseAuthReturn {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  masterKey: CryptoKey | null
  isInitialized: boolean
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  
  // Utilities
  requireAuth: () => boolean
  redirectToLogin: (returnUrl?: string) => void
}

/**
 * Authentication hook that provides user state and auth actions
 */
export function useAuth(): UseAuthReturn {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isLoading,
    masterKey,
    isInitialized,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    changePassword: storeChangePassword,
    initialize,
    checkAuth
  } = useAuthStore()

  // Initialize auth state on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  // Check auth status periodically
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        checkAuth()
      }, 5 * 60 * 1000) // Check every 5 minutes

      return () => clearInterval(interval)
    }
  }, [isAuthenticated, checkAuth])

  const login = useCallback(async (email: string, password: string) => {
    try {
      await storeLogin(email, password)
      router.push('/dashboard')
    } catch (error) {
      // Error handling is done in the store
      throw error
    }
  }, [storeLogin, router])

  const register = useCallback(async (email: string, password: string) => {
    try {
      await storeRegister(email, password)
      router.push('/dashboard')
    } catch (error) {
      // Error handling is done in the store
      throw error
    }
  }, [storeRegister, router])

  const logout = useCallback(async () => {
    try {
      await storeLogout()
      router.push('/')
    } catch (error) {
      // Force redirect even if logout fails
      router.push('/')
    }
  }, [storeLogout, router])

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      await storeChangePassword(currentPassword, newPassword)
      toast.success('Password changed successfully! Please re-login for security.')
      
      // Force logout after password change for security
      setTimeout(() => {
        logout()
      }, 2000)
    } catch (error) {
      throw error
    }
  }, [storeChangePassword, logout])

  const requireAuth = useCallback((): boolean => {
    if (!isAuthenticated || !user) {
      redirectToLogin()
      return false
    }
    return true
  }, [isAuthenticated, user])

  const redirectToLogin = useCallback((returnUrl?: string) => {
    const url = returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login'
    router.push(url)
  }, [router])

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    masterKey,
    isInitialized,
    
    // Actions
    login,
    register,
    logout,
    changePassword,
    
    // Utilities
    requireAuth,
    redirectToLogin
  }
}