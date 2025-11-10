'use client'

import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { QuickStatsCards } from '@/components/dashboard/QuickStatsCards'
import { RecentFilesList } from '@/components/dashboard/RecentFilesList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, Shield, Key, Lock } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader currentPage="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your encrypted files with complete privacy
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-8">
          <QuickStatsCards />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Files */}
          <div className="lg:col-span-2">
            <RecentFilesList />
          </div>

          {/* Quick Actions & Security Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/files" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </Link>
                <Link href="/files" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    View All Files
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button className="w-full justify-start" variant="outline">
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Security Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-green-600" />
                  Security Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Encryption</span>
                    <span className="text-sm font-medium text-green-600">AES-256-GCM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Key Derivation</span>
                    <span className="text-sm font-medium text-green-600">PBKDF2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zero Knowledge</span>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Local Encryption</span>
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    🔒 All your files are encrypted before upload. We never see your data.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Upload & Encrypt</p>
                      <p className="text-gray-600 dark:text-gray-400">Files encrypted on your device</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Secure Storage</p>
                      <p className="text-gray-600 dark:text-gray-400">Only encrypted data on servers</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Download & Decrypt</p>
                      <p className="text-gray-600 dark:text-gray-400">Decrypt on your device only</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}