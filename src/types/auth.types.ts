export interface User {
  id: string
  email: string
  createdAt: string
  lastLogin?: string
  storageUsed: number
  storageLimit: number
}

export interface LoginRequest {
  email: string
  password_hash: string
}

export interface RegisterRequest {
  email: string
  password_hash: string
  salt: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: User
}

export interface RefreshTokenResponse {
  token: string
}

export interface ChangePasswordRequest {
  old_password_hash: string
  new_password_hash: string
  new_salt: string
}

export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumber: boolean
    hasSpecialChar: boolean
  }
}