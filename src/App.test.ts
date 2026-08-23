import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.vue'
import {
  provideEditorConfig,
  resolveEnumeratorOptions,
  type RuntimeEditorConfig,
} from '@mentor-forge/mentorhub_spa_utils'

const config = ref<RuntimeEditorConfig | null>(null)
const authenticated = ref(false)
const loadConfig = vi.fn()
const afterEach = vi.fn()

vi.mock('@/composables/useConfig', () => ({
  useConfig: () => ({
    config: computed(() => config.value),
    loadConfig,
  }),
}))

vi.mock('@/composables/useRoles', () => ({
  useRoles: () => ({
    hasRole: () => computed(() => false),
  }),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ afterEach }),
}))

vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({ data: ref(undefined) }),
}))

vi.mock('@mentor-forge/mentorhub_spa_utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mentor-forge/mentorhub_spa_utils')>()
  return {
    ...actual,
    provideEditorConfig: vi.fn(),
    useAuth: () => ({
      isAuthenticated: computed(() => authenticated.value),
      logout: vi.fn(),
    }),
  }
})

describe('App editor config boundary', () => {
  beforeEach(() => {
    config.value = null
    authenticated.value = false
    loadConfig.mockReset()
    afterEach.mockReset()
    vi.mocked(provideEditorConfig).mockReset()
  })

  it('provides the reactive runtime config and leaves missing or unknown enumerators empty', async () => {
    mount(App, {
      shallow: true,
      global: {
        stubs: {
          RouterView: true,
          VApp: { template: '<div><slot /></div>' },
          VAppBar: true,
          VAppBarNavIcon: true,
          VAppBarTitle: true,
          VContainer: true,
          VDivider: true,
          VList: { template: '<div><slot /></div>' },
          VListItem: true,
          VMain: true,
          VNavigationDrawer: {
            template: '<aside><slot /><slot name="append" /></aside>',
          },
        },
      },
    })

    expect(provideEditorConfig).toHaveBeenCalledOnce()
    const providedConfig = vi.mocked(provideEditorConfig).mock.calls[0][0]

    expect(resolveEnumeratorOptions(providedConfig.value, 'default_status')).toEqual([])

    config.value = {
      enumerators: [
        {
          version: 1,
          enumerators: [
            {
              name: 'another_status',
              values: [{ value: 'active', description: 'Active' }],
            },
          ],
        },
      ],
    }
    await Promise.resolve()

    expect(resolveEnumeratorOptions(providedConfig.value, 'default_status')).toEqual([])
    expect(resolveEnumeratorOptions(providedConfig.value, 'another_status')).toEqual([
      { value: 'active', title: 'Active' },
    ])
  })

  it('renders the four card-list navigation links for authenticated users', () => {
    authenticated.value = true
    const wrapper = mount(App, {
      shallow: true,
      global: {
        stubs: {
          RouterView: true,
          VApp: { template: '<div><slot /></div>' },
          VAppBar: true,
          VAppBarNavIcon: true,
          VAppBarTitle: true,
          VContainer: true,
          VDivider: true,
          VList: { template: '<div><slot /></div>' },
          VListItem: true,
          VMain: true,
          VNavigationDrawer: {
            template: '<aside><slot /><slot name="append" /></aside>',
          },
        },
      },
    })

    expect(wrapper.get('[data-automation-id="nav-home-link"]').attributes('to')).toBe('/')
    expect(wrapper.get('[data-automation-id="nav-resources-link"]').attributes('to'))
      .toBe('/resources')
    expect(wrapper.get('[data-automation-id="nav-paths-link"]').attributes('to')).toBe('/paths')
    expect(wrapper.get('[data-automation-id="nav-plans-link"]').attributes('to')).toBe('/plans')
    expect(wrapper.find('[data-automation-id="nav-discovery-link"]').exists()).toBe(false)
  })
})
