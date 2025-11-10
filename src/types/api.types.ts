export interface ApiResponse<T = any> {
  data?: T
  message: string
  success: boolean
  error?: string
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}