import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { User } from '@/types/auth.types'
import { authApi } from '@/lib/api/auth'
import { 
  deriveKeyFromPassword, 
  generateSalt, 
  hashPassword, 
  generateMasterKey 
} from '@/lib/crypto/keyDerivation'
import { storeMasterKey, retrieveMasterKey, deleteMasterKey } from '@/lib/crypto/keyStorage'
import toast from 'react-hot-toast'

interface AuthState {
  // State
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  masterKey: CryptoKey | null
  isInitialized: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  checkAuth: () => Promise<void>
  setMasterKey: (key: CryptoKey) => void
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
      masterKey: null,
      isInitialized: false,

      // Initialize auth state from localStorage
      initialize: async () => {
        set({ isLoading: true })
        
        try {
          const token = localStorage.getItem('auth_token')
          const userData = localStorage.getItem('user')
          
          if (token && userData) {
            const user = JSON.parse(userData)
            
            // Verify token is still valid
            const isValid = await authApi.verifyToken()
            
            if (isValid) {
              set({ 
                token, 
                user, 
                isAuthenticated: true,
                isInitialized: true 
              })
              
              // Note: Master key is not restored automatically for security
              // User will need to re-enter password to decrypt files
              
              return
            }
          }
          
          // Clear invalid/expired auth data
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          
        } catch (error) {
          console.error('Auth initialization error:', error)
        } finally {
          set({ isLoading: false, isInitialized: true })
        }
      },

      // User login
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Get user's salt from server (secure approach)
          const { salt: userSalt } = await authApi.getSalt(email)
          
          // Hash password with salt for server
          const passwordHash = await hashPassword(password, userSalt)
          
          // Login user
          const response = await authApi.login({
            email,
            password_hash: passwordHash
          })
          
          // Generate master key using the same salt from server
          const masterKey = await deriveKeyFromPassword(password, userSalt)
          
          // Store master key locally (encrypted with session password)
          await storeMasterKey(response.user.id, masterKey, password)
          
          set({
            user: response.user,
            token: response.access_token,
            masterKey,
            isAuthenticated: true,
            isLoading: false
          })
          
          toast.success('Login successful!')
          
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Login failed')
          throw error
        }
      },

      // User registration
      register: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Generate salt for this user
          const userSalt = generateSalt()
          
          // Hash password with salt for server
          const passwordHash = await hashPassword(password, userSalt)
          
          // Register user on server
          const response = await authApi.register({
            email,
            password_hash: passwordHash,
            salt: userSalt
          })
          
          // Generate master encryption key
          const masterKey = await deriveKeyFromPassword(password, userSalt)
          
          // Store master key locally
          await storeMasterKey(response.user_id, masterKey, password)
          
          // Store salt locally for future login (temporary until getSalt endpoint is implemented)
          localStorage.setItem(`user_salt_${email}`, userSalt)
          
          // Registration successful, but need to login to get token
          // So just show success message and redirect to login
          set({
            isLoading: false
          })
          
          toast.success('Registration successful! Please login to continue.')
          
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Registration failed')
          throw error
        }
      },

      // User logout
      logout: async () => {
        set({ isLoading: true })
        
        try {
          const { user } = get()
          
          // Logout from server
          await authApi.logout()
          
          // Clear master key from IndexedDB
          if (user) {
            await deleteMasterKey(user.id)
            // Clear user's salt from localStorage
            localStorage.removeItem(`user_salt_${user.email}`)
          }
          
          set({
            user: null,
            token: null,
            masterKey: null,
            isAuthenticated: false,
            isLoading: false
          })
          
          toast.success('Logged out successfully')
          
        } catch (error: any) {
          console.error('Logout error:', error)
          
          // Force logout locally even if server fails
          set({
            user: null,
            token: null,
            masterKey: null,
            isAuthenticated: false,
            isLoading: false
          })
        }
      },

      // Refresh token
      refreshToken: async () => {
        try {
          const response = await authApi.refreshToken()
          
          set({
            token: response.access_token
          })
          
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Force logout on refresh failure
          get().logout()
        }
      },

      // Check authentication status
      checkAuth: async () => {
        const { isInitialized } = get()
        
        if (!isInitialized) {
          await get().initialize()
          return
        }
        
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
          set({ isAuthenticated: false })
          return
        }
        
        try {
          const isValid = await authApi.verifyToken()
          
          if (!isValid) {
            get().logout()
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          get().logout()
        }
      },

      // Set master key (when user re-enters password)
      setMasterKey: (key: CryptoKey) => {
        set({ masterKey: key })
      },

      // Change password (requires re-encryption)
      changePassword: async (currentPassword: string, newPassword: string) => {
        set({ isLoading: true })
        
        try {
          const { user } = get()
          if (!user) throw new Error('User not authenticated')
          
          // Hash passwords
          const currentPasswordHash = await hashPassword(currentPassword)
          const newPasswordHash = await hashPassword(newPassword)
          const newSalt = generateSalt()
          
          // Change password on server
          await authApi.changePassword({
            old_password_hash: currentPasswordHash,
            new_password_hash: newPasswordHash,
            new_salt: newSalt
          })
          
          // Generate new master key
          const newMasterKey = await deriveKeyFromPassword(newPassword, newSalt)
          
          // Store new master key
          await storeMasterKey(user.id, newMasterKey, newPassword)
          
          set({ 
            masterKey: newMasterKey,
            isLoading: false 
          })
          
          toast.success('Password changed successfully!')
          
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Failed to change password')
          throw error
        }
      }
    }),
    {
      name: 'auth-store'
    }
  )
)