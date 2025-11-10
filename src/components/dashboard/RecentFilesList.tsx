'use client'

import { useFiles } from '@/lib/hooks/useFiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDateRelative } from '@/lib/utils/formatters'
import { Download, Trash2, FileText, Image, Video, Music } from 'lucide-react'
import Link from 'next/link'

export function RecentFilesList() {
  const { files, downloadFile, deleteFile, getFileIcon } = useFiles()

  // Get the 5 most recent files
  const recentFiles = files
    .slice()
    .sort((a, b) => {
      const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
      const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
      return dateB - dateA
    })
    .slice(0, 5)

  if (recentFiles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No files uploaded yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by uploading your first file.
            </p>
            <div className="mt-6">
              <Link href="/files">
                <Button>
                  Upload Files
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getIconComponent = (mimeType: string | undefined) => {
    if (!mimeType) return FileText
    if (mimeType.startsWith('image/')) return Image
    if (mimeType.startsWith('video/')) return Video
    if (mimeType.startsWith('audio/')) return Music
    return FileText
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Files</CardTitle>
        <Link href="/files">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentFiles.map((file) => {
            const IconComponent = getIconComponent(file.mimeType)
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <IconComponent className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {file.originalName || 'Encrypted File'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file.uploadedAt ? formatDateRelative(file.uploadedAt) : 'Unknown date'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadFile(file.id)}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteFile(file.id)}
                    title="Delete file"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}