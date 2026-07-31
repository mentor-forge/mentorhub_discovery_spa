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
      isAuthenticated: computed(() => false),
      logout: vi.fn(),
    }),
  }
})

describe('App editor config boundary', () => {
  beforeEach(() => {
    config.value = null
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
          VApp: true,
          VAppBar: true,
          VAppBarNavIcon: true,
          VAppBarTitle: true,
          VContainer: true,
          VDivider: true,
          VList: true,
          VListItem: true,
          VMain: true,
          VNavigationDrawer: true,
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
})
