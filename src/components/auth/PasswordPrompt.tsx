'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { retrieveMasterKey } from '@/lib/crypto/keyStorage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface PasswordPromptProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function PasswordPrompt({ isOpen, onClose, onSuccess }: PasswordPromptProps) {
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { user, setMasterKey, logout } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      toast.error('Please enter your password')
      return
    }

    if (!user) {
      toast.error('User not found')
      return
    }

    setIsLoading(true)

    try {
      // Try to retrieve the master key with the provided password
      const masterKey = await retrieveMasterKey(user.id, password)
      
      // Store the master key in the auth store
      setMasterKey(masterKey)
      
      toast.success('Access restored successfully!')
      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('Failed to restore master key:', error)
      toast.error('Invalid password. Please try again.')
    } finally {
      setIsLoading(false)
      setPassword('')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      onClose()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Security Verification Required</h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Your session has been restored, but we need to verify your password to decrypt your files.
          </p>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Enter Password to Access Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Verifying...' : 'Unlock Files'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Logout Instead
                  </Button>
                </div>
              </form>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  🔒 This is required for security. Your files are encrypted with your password and cannot be accessed without it.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}