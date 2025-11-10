'use client'

import { useFiles } from '@/lib/hooks/useFiles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Database, Files, Upload, Download } from 'lucide-react'

export function QuickStatsCards() {
  const { 
    totalFiles, 
    storageUsed, 
    storageLimit, 
    storagePercentage,
    formatFileSize 
  } = useFiles()

  const stats = [
    {
      title: 'Total Files',
      value: totalFiles.toString(),
      icon: Files,
      description: 'Files stored securely'
    },
    {
      title: 'Storage Used',
      value: formatFileSize(storageUsed),
      icon: Database,
      description: `${storagePercentage.toFixed(1)}% of ${formatFileSize(storageLimit)}`
    },
    {
      title: 'Encryption Level',
      value: 'AES-256',
      icon: Upload,
      description: 'Military-grade security'
    },
    {
      title: 'Zero Knowledge',
      value: '100%',
      icon: Download,
      description: 'Complete privacy guaranteed'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.title === 'Storage Used' && (
                <div className="mt-3">
                  <Progress value={storagePercentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}