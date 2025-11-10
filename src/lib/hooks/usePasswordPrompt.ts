import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

/**
 * Hook to manage password prompt state
 * Shows password prompt when user is authenticated but master key is missing
 */
export function usePasswordPrompt() {
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false)
  const { isAuthenticated, masterKey, isInitialized } = useAuthStore()

  useEffect(() => {
    // Show password prompt if user is authenticated but master key is missing
    if (isInitialized && isAuthenticated && !masterKey) {
      setIsPasswordPromptOpen(true)
    } else {
      setIsPasswordPromptOpen(false)
    }
  }, [isAuthenticated, masterKey, isInitialized])

  const closePasswordPrompt = () => {
    setIsPasswordPromptOpen(false)
  }

  const onPasswordPromptSuccess = () => {
    setIsPasswordPromptOpen(false)
  }

  return {
    isPasswordPromptOpen,
    closePasswordPrompt,
    onPasswordPromptSuccess
  }
}