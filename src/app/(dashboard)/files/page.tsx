'use client'

import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Trash2, 
  Eye, 
  Share2,
  File,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  Grid,
  List
} from 'lucide-react'
import { useFiles } from '@/lib/hooks/useFiles'
import { useUpload } from '@/lib/hooks/useUpload'
import { useState, useMemo } from 'react'
import { formatFileSize, formatDate } from '@/lib/utils'

const getFileIcon = (mimeType: string | undefined, size: number = 20) => {
  if (!mimeType) return <File size={size} />
  if (mimeType.startsWith('image/')) return <Image size={size} />
  if (mimeType.startsWith('video/')) return <Video size={size} />
  if (mimeType.startsWith('audio/')) return <Music size={size} />
  if (mimeType.includes('zip') || mimeType.includes('archive')) return <Archive size={size} />
  if (mimeType.includes('text') || mimeType.includes('document')) return <FileText size={size} />
  return <File size={size} />
}

export default function FilesPage() {
  const { files, isLoading, deleteFile, downloadFile } = useFiles()
  const { uploadFiles, uploadState } = useUpload()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const matchesSearch = file.originalName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false
      const matchesFilter = filterType === 'all' || (file.mimeType?.startsWith(filterType) ?? false)
      return matchesSearch && matchesFilter
    })
  }, [files, searchQuery, filterType])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files
    if (fileList) {
      uploadFiles(Array.from(fileList))
    }
  }

  const handleDelete = async (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      await deleteFile(fileId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader currentPage="files" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Files
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage your encrypted files
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild className="cursor-pointer">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {uploadState.isUploading && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                Uploading Files... ({uploadState.uploadedCount}/{uploadState.totalCount})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress 
                value={(uploadState.uploadedCount / uploadState.totalCount) * 100} 
                className="w-full" 
              />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                {uploadState.currentFile ? `Uploading: ${uploadState.currentFile}` : 'Processing...'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="all">All Files</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="text">Documents</option>
              </select>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none border-l-0"
                >
                  <Grid className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List/Grid */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading files...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {files.length === 0 
                    ? 'Upload your first file to get started with encrypted storage'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {files.length === 0 && (
                  <label htmlFor="file-upload">
                    <Button asChild className="cursor-pointer">
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First File
                      </span>
                    </Button>
                  </label>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium">Name</th>
                        <th className="text-left py-3 px-4 font-medium">Size</th>
                        <th className="text-left py-3 px-4 font-medium">Modified</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-right py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => (
                        <tr 
                          key={file.id} 
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <div className="text-gray-500 mr-3">
                                {getFileIcon(file.mimeType)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {file.originalName}
                                </p>
                                {file.isEncrypted && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    Encrypted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                            {formatFileSize(file.size || file.file_size || 0)}
                          </td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                            {file.updatedAt ? formatDate(file.updatedAt) : 'Unknown date'}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant="outline">
                              {file.mimeType ? file.mimeType.split('/')[0] : 'unknown'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(file.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <div 
                      key={file.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-gray-500">
                          {getFileIcon(file.mimeType, 24)}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadFile(file.id)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                          {file.originalName}
                        </h4>
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                          <span>{formatFileSize(file.size || file.file_size || 0)}</span>
                          {file.isEncrypted && (
                            <Badge variant="secondary" className="text-xs">
                              Encrypted
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {file.updatedAt ? formatDate(file.updatedAt) : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}