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

vi.mock('@/composables/useConfig', () => ({
  useConfig: () => ({
    config: computed(() => config.value),
    loadConfig,
  }),
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
    }),
  }
})

function mountApp() {
  return mount(App, {
    shallow: true,
    global: {
      stubs: {
        RouterView: {
          template: '<div data-testid="router-view" />',
        },
        VApp: {
          template: '<div><slot /></div>',
        },
        PageFrame: {
          props: ['pageTitle'],
          template: '<main :data-page-title="pageTitle"><slot /></main>',
        },
      },
    },
  })
}

describe('App editor config boundary', () => {
  beforeEach(() => {
    config.value = null
    authenticated.value = false
    loadConfig.mockReset()
    vi.mocked(provideEditorConfig).mockReset()
  })

  it('provides the reactive runtime config and leaves missing or unknown enumerators empty', async () => {
    mountApp()

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

  it('wraps routed content in the shared Discovery page frame', () => {
    const wrapper = mountApp()

    expect(wrapper.get('main').attributes('data-page-title')).toBe('Discovery')
    expect(wrapper.get('[data-testid="router-view"]').exists()).toBe(true)
  })
})
