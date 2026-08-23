import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { redirectToIdpLogin, useAuth } from '@mentor-forge/mentorhub_spa_utils'
import { api } from './client'
import type { Card, Notification } from './types'

vi.mock('@mentor-forge/mentorhub_spa_utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mentor-forge/mentorhub_spa_utils')>()
  return {
    ...actual,
    redirectToIdpLogin: vi.fn(),
    useAuth: vi.fn(() => ({
      logout: vi.fn(),
      isAuthenticated: { value: false },
      roles: { value: [] },
    })),
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: {
      get: (name: string) => name === 'content-length' ? '100' : null
    },
    json: async () => body
  }
}

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    vi.mocked(redirectToIdpLogin).mockClear()
    vi.mocked(useAuth).mockClear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Config', () => {
    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it('should fetch config successfully', async () => {
      const mockConfig = {
        config_items: [],
        versions: [],
        enumerators: [],
        token: { claims: {} }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (name: string) => name === 'content-length' ? '100' : null
        },
        json: async () => mockConfig
      })

      const result = await api.getConfig()

      expect(result).toEqual(mockConfig)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/config',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })
  })

  describe('Card lists', () => {
    const cards: Card[] = [
      {
        _id: '665f1c2a9b1e4c0a1b2c3d4e',
        name: 'Example card',
        description: 'Example card body',
        link: 'https://example.com/card',
        type: 'Resource',
      },
    ]

    beforeEach(() => {
      localStorage.setItem('access_token', 'test-token')
    })

    it.each([
      ['home', '/api/cards', () => api.getHomeCards()],
      ['resources', '/api/cards/resources', () => api.getResourceCards()],
      ['paths', '/api/cards/paths', () => api.getPathCards()],
      ['plans', '/api/cards/plans', () => api.getPlanCards()],
    ])('should fetch %s cards with default pagination headers', async (_, url, call) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(cards))

      const result = await call()

      expect(result).toEqual(cards)
      expect(mockFetch).toHaveBeenCalledWith(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
          offset: '0',
          size: '20',
        },
      })
    })

    it('should pass custom pagination values as request headers', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse(cards))

      await api.getResourceCards(40, 100)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/cards/resources',
        expect.objectContaining({
          headers: expect.objectContaining({
            offset: '40',
            size: '100',
          }),
        })
      )
    })
  })

  describe('Notification dismiss', () => {
    it('should post without a body and return the Notification document', async () => {
      localStorage.setItem('access_token', 'test-token')
      const notification: Notification = {
        _id: '665f1c2a9b1e4c0a1b2c3d4e',
        name: 'welcome',
        message: 'Welcome to Mentor Hub',
        status: 'active',
        dismissed: {
          from_ip: '127.0.0.1',
          by_user: 'test-user',
          at_time: '2026-08-23T20:00:00Z',
          correlation_id: 'test-correlation-id',
        },
      }
      mockFetch.mockResolvedValueOnce(jsonResponse(notification))

      const result = await api.dismissNotification(notification._id!)

      expect(result).toEqual(notification)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/notification/dismiss/665f1c2a9b1e4c0a1b2c3d4e',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
        }
      )
      expect(mockFetch.mock.calls[0][1]).not.toHaveProperty('body')
    })
  })

  describe('401 Unauthorized Handling', () => {
    const mockLogout = vi.fn()

    beforeEach(() => {
      localStorage.setItem('access_token', 'invalid-token')
      localStorage.setItem('token_expires_at', '2026-12-31T23:59:59Z')
      localStorage.setItem('user_roles', JSON.stringify(['admin']))
      vi.mocked(useAuth).mockReturnValue({
        logout: mockLogout,
        isAuthenticated: { value: true },
        roles: { value: ['admin'] },
      })
    })

    it('should clear session and redirect on 401 error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Invalid token' })
      })

      try {
        await api.getConfig()
      } catch {
        // Error is expected to be thrown
      }

      expect(mockLogout).toHaveBeenCalledOnce()
      expect(redirectToIdpLogin).toHaveBeenCalledOnce()
    })
  })
})
