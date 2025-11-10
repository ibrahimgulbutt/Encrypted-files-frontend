import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // Modal states
  isUploadModalOpen: boolean
  isDeleteDialogOpen: boolean
  isChangePasswordModalOpen: boolean
  
  // Selected items
  selectedFileId: string | null
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  
  // Loading states
  globalLoading: boolean
  
  // Sidebar
  isSidebarOpen: boolean
  
  // Actions
  openUploadModal: () => void
  closeUploadModal: () => void
  openDeleteDialog: (fileId: string) => void
  closeDeleteDialog: () => void
  openChangePasswordModal: () => void
  closeChangePasswordModal: () => void
  setSelectedFileId: (fileId: string | null) => void
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setGlobalLoading: (loading: boolean) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isUploadModalOpen: false,
      isDeleteDialogOpen: false,
      isChangePasswordModalOpen: false,
      selectedFileId: null,
      theme: 'system',
      globalLoading: false,
      isSidebarOpen: false,

      // Modal actions
      openUploadModal: () => set({ isUploadModalOpen: true }),
      closeUploadModal: () => set({ isUploadModalOpen: false }),
      
      openDeleteDialog: (fileId: string) => set({ 
        isDeleteDialogOpen: true, 
        selectedFileId: fileId 
      }),
      closeDeleteDialog: () => set({ 
        isDeleteDialogOpen: false, 
        selectedFileId: null 
      }),
      
      openChangePasswordModal: () => set({ isChangePasswordModalOpen: true }),
      closeChangePasswordModal: () => set({ isChangePasswordModalOpen: false }),

      // File selection
      setSelectedFileId: (fileId: string | null) => set({ selectedFileId: fileId }),

      // Theme actions
      toggleTheme: () => {
        const currentTheme = get().theme
        const newTheme = currentTheme === 'light' ? 'dark' : 'light'
        set({ theme: newTheme })
        
        // Persist theme preference
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', newTheme)
        }
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme })
        
        // Persist theme preference
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', theme)
        }
      },

      // Loading states
      setGlobalLoading: (loading: boolean) => set({ globalLoading: loading }),

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ isSidebarOpen: open })
    }),
    {
      name: 'ui-store'
    }
  )
)