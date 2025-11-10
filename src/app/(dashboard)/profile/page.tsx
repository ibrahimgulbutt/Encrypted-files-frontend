'use client'

import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Key, 
  HardDrive,
  Settings,
  Download,
  Trash2,
  AlertTriangle,
  Lock
} from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useFiles } from '@/lib/hooks/useFiles'
import { useState } from 'react'
import { formatFileSize, formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
})

type PasswordChangeForm = z.infer<typeof passwordChangeSchema>

export default function ProfilePage() {
  const { user, logout, isLoading: authLoading } = useAuth()
  const { files, deleteAllFiles, getTotalStorageUsed } = useFiles()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'storage' | 'danger'>('profile')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordChangeForm>({
    resolver: zodResolver(passwordChangeSchema)
  })

  const totalStorageUsed = getTotalStorageUsed()
  const storageLimit = 5 * 1024 * 1024 * 1024 // 5GB
  const storagePercentage = (totalStorageUsed / storageLimit) * 100

  const onPasswordChange = async (data: PasswordChangeForm) => {
    setIsChangingPassword(true)
    try {
      // This would call your API to change password
      // await changePassword(data.currentPassword, data.newPassword)
      toast.success('Password changed successfully')
      reset()
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAllFiles = async () => {
    const confirmation = window.prompt(
      'This will permanently delete ALL your files. This action cannot be undone.\n\nType "DELETE ALL FILES" to confirm:'
    )
    
    if (confirmation === 'DELETE ALL FILES') {
      try {
        await deleteAllFiles()
        toast.success('All files deleted successfully')
      } catch (error) {
        toast.error('Failed to delete files')
      }
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'This will permanently delete your account and ALL your data. This action cannot be undone.\n\nType "DELETE MY ACCOUNT" to confirm:'
    )
    
    if (confirmation === 'DELETE MY ACCOUNT') {
      try {
        // This would call your API to delete account
        // await deleteAccount()
        toast.success('Account deleted successfully')
        logout()
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader currentPage="profile" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your account settings and security preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Tabs */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <nav className="space-y-2">
                  {[
                    { id: 'profile', label: 'Profile Info', icon: User },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'storage', label: 'Storage', icon: HardDrive },
                    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id as any)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        activeTab === id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">{user.email}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Member Since</label>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-900 dark:text-white">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                      Zero-Knowledge Encryption
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Your account uses client-side encryption. We never have access to your files or encryption keys. 
                      Your privacy is completely protected.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Key className="w-5 h-5 mr-2" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit(onPasswordChange)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Current Password
                        </label>
                        <Input
                          type="password"
                          {...register('currentPassword')}
                          className={errors.currentPassword ? 'border-red-500' : ''}
                        />
                        {errors.currentPassword && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.currentPassword.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          New Password
                        </label>
                        <Input
                          type="password"
                          {...register('newPassword')}
                          className={errors.newPassword ? 'border-red-500' : ''}
                        />
                        {errors.newPassword && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.newPassword.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Confirm New Password
                        </label>
                        <Input
                          type="password"
                          {...register('confirmPassword')}
                          className={errors.confirmPassword ? 'border-red-500' : ''}
                        />
                        {errors.confirmPassword && (
                          <p className="text-red-600 text-sm mt-1">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <Button 
                        type="submit" 
                        disabled={isChangingPassword}
                        className="w-full md:w-auto"
                      >
                        {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      Security Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-300">
                            End-to-End Encryption
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            AES-256-GCM with client-side key derivation
                          </p>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-300">
                            Zero-Knowledge Architecture
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Server never sees your data or keys
                          </p>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div>
                          <p className="font-medium text-green-900 dark:text-green-300">
                            Local Key Storage
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-400">
                            Encryption keys stored securely in browser
                          </p>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HardDrive className="w-5 h-5 mr-2" />
                      Storage Usage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Used Storage</span>
                          <span>{formatFileSize(totalStorageUsed)} of {formatFileSize(storageLimit)}</span>
                        </div>
                        <Progress value={storagePercentage} className="w-full" />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {(100 - storagePercentage).toFixed(1)}% remaining
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Total Files</h4>
                          <p className="text-2xl font-bold">{files.length}</p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Average File Size</h4>
                          <p className="text-2xl font-bold">
                            {files.length > 0 ? formatFileSize(totalStorageUsed / files.length) : '0 B'}
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Largest File</h4>
                          <p className="text-2xl font-bold">
                            {files.length > 0 ? formatFileSize(Math.max(...files.map(f => f.size || f.file_size || 0))) : '0 B'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
                      Delete All Files
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                      Permanently delete all your uploaded files. This action cannot be undone.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleDeleteAllFiles}
                      className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Files
                    </Button>
                  </div>

                  <div className="p-4 border border-red-200 dark:border-red-800 rounded-lg">
                    <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
                      Delete Account
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteAccount}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Important:</strong> Due to our zero-knowledge encryption, deleted data cannot be recovered. 
                      Make sure to download any files you want to keep before deleting.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}