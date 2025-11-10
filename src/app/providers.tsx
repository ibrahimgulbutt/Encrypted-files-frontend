'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { ToastProvider } from '@/components/providers/toast-provider'
import { PasswordPrompt } from '@/components/auth/PasswordPrompt'
import { usePasswordPrompt } from '@/lib/hooks/usePasswordPrompt'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const { initialize } = useAuthStore()
  const { 
    isPasswordPromptOpen, 
    closePasswordPrompt, 
    onPasswordPromptSuccess 
  } = usePasswordPrompt()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <>
      {children}
      <ToastProvider />
      <PasswordPrompt 
        isOpen={isPasswordPromptOpen}
        onClose={closePasswordPrompt}
        onSuccess={onPasswordPromptSuccess}
      />
    </>
  )
}