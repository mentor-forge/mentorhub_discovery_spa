import type { Card, ConfigResponse, Error, Notification } from './types'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'

const API_BASE = `${import.meta.env.BASE_URL}api`
const DEFAULT_OFFSET = 0
const DEFAULT_SIZE = 20

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Error
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('access_token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorData: Error | null = null
    try {
      errorData = await response.json()
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      redirectToIdpLogin()
    }

    throw new ApiError(
      errorData?.error || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      errorData || undefined
    )
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T
  }

  return response.json()
}

function paginationHeaders(
  offset = DEFAULT_OFFSET,
  size = DEFAULT_SIZE
): Record<string, string> {
  return {
    offset: String(offset),
    size: String(size),
  }
}

function buildCardPath(endpoint: string, name?: string): string {
  const trimmed = name?.trim()
  if (!trimmed) {
    return endpoint
  }
  return `${endpoint}?name=${encodeURIComponent(trimmed)}`
}

export const api = {
  async getConfig(): Promise<ConfigResponse> {
    return request<ConfigResponse>('/config')
  },

  async getHomeCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE
  ): Promise<Card[]> {
    return request<Card[]>('/cards', {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getEventCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE
  ): Promise<Card[]> {
    return request<Card[]>('/cards/events', {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getMemberCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE,
    name?: string
  ): Promise<Card[]> {
    return request<Card[]>(buildCardPath('/cards/members', name), {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getResourceCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE,
    name?: string
  ): Promise<Card[]> {
    return request<Card[]>(buildCardPath('/cards/resources', name), {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getPathCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE,
    name?: string
  ): Promise<Card[]> {
    return request<Card[]>(buildCardPath('/cards/paths', name), {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getPlanCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE,
    name?: string
  ): Promise<Card[]> {
    return request<Card[]>(buildCardPath('/cards/plans', name), {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getProductCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE,
    name?: string
  ): Promise<Card[]> {
    return request<Card[]>(buildCardPath('/cards/products', name), {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async getNotificationCards(
    offset = DEFAULT_OFFSET,
    size = DEFAULT_SIZE
  ): Promise<Card[]> {
    return request<Card[]>('/cards/notifications', {
      method: 'GET',
      headers: paginationHeaders(offset, size),
    })
  },

  async dismissNotification(notificationId: string): Promise<Notification> {
    return request<Notification>(
      `/notification/dismiss/${encodeURIComponent(notificationId)}`,
      { method: 'POST' }
    )
  },

  async cancelNotification(notificationId: string): Promise<Notification> {
    return request<Notification>(
      `/notification/cancel/${encodeURIComponent(notificationId)}`,
      { method: 'POST' }
    )
  },
}

export { ApiError }
