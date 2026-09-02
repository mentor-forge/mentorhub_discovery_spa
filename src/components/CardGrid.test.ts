import { mount, shallowMount } from '@vue/test-utils'
import { createCommentVNode, Fragment, h, Text } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import CardGrid from './CardGrid.vue'

const cardGridSource = readFileSync(
  resolve(__dirname, './CardGrid.vue'),
  'utf-8',
)
const discoveryCardSource = readFileSync(
  resolve(__dirname, './DiscoveryCard.vue'),
  'utf-8',
)
const homePageSource = readFileSync(
  resolve(__dirname, '../pages/DiscoveryHomePage.vue'),
  'utf-8',
)

describe('CardGrid', () => {
  it('flattens nested fragments and skips null, comment, and text nodes', () => {
    const wrapper = shallowMount(CardGrid, {
      slots: {
        default: () => [
          h(Fragment, [
            h('article', { class: 'card', key: 'one' }, 'One'),
            h(Fragment, [
              null,
              createCommentVNode('hidden'),
              h(Text, 'ignored'),
              h('article', { class: 'card', key: 'two' }, 'Two'),
            ]),
          ]),
        ],
      },
    })

    expect(wrapper.findAll('.mh-card-grid__item')).toHaveLength(2)
    expect(wrapper.findAll('.card').map((card) => card.text())).toEqual([
      'One',
      'Two',
    ])
  })

  it('preserves VNode keys and uses the flattened index as a fallback', () => {
    const wrapper = shallowMount(CardGrid, {
      slots: {
        default: () => [
          h(Fragment, [
            h('article', { key: 'stable-key' }, 'Keyed'),
            h('article', 'Unkeyed'),
          ]),
        ],
      },
    })

    const children = (wrapper.vm.$.subTree.children ?? []) as Array<{
      key?: string | number
    }>

    expect(children.map((child) => child.key)).toEqual(['stable-key', 1])
  })

  it('applies automationId to the grid root', () => {
    const wrapper = mount(CardGrid, {
      props: { automationId: 'discovery-events-grid' },
      slots: { default: () => h('article', 'Event') },
    })

    expect(wrapper.get('.mh-card-grid').attributes('data-automation-id')).toBe(
      'discovery-events-grid',
    )
  })

  it('defines fill-width tracks at every responsive breakpoint, capped at eight', () => {
    expect(cardGridSource).toContain('display: grid')
    expect(cardGridSource).toContain('width: 100%')
    expect(cardGridSource).toContain('gap: 16px')
    expect(cardGridSource).toContain(
      'grid-template-columns: minmax(0, 1fr)',
    )

    for (const columns of [2, 3, 4, 5, 6, 7, 8]) {
      expect(cardGridSource).toContain(
        `repeat(${columns}, minmax(0, 1fr))`,
      )
    }

    for (const breakpoint of [600, 960, 1280, 1600, 1920, 2240, 2560]) {
      expect(cardGridSource).toContain(
        `@media (min-width: ${breakpoint}px)`,
      )
    }

    expect(cardGridSource).not.toContain('repeat(9,')
    expect(cardGridSource).not.toContain('max-width:')
    expect(homePageSource).toMatch(/<v-container\s+fluid>/)
  })

  it('stretches grid items and expanded cards while collapsed cards stay intrinsic', () => {
    expect(cardGridSource).toMatch(
      /\.mh-card-grid\s*\{[\s\S]*?align-items:\s*stretch/,
    )
    expect(cardGridSource).toMatch(
      /\.mh-card-grid__item\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/,
    )
    expect(cardGridSource).toMatch(
      /\.mh-card:not\(\.mh-card--collapsed\)[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%[\s\S]*?flex:\s*1 1 auto/,
    )
    expect(cardGridSource).toMatch(
      /\.mh-card--collapsed[\s\S]*?height:\s*auto[\s\S]*?flex:\s*0 0 auto/,
    )
    expect(discoveryCardSource).toMatch(
      /\.discovery-card\s*\{[\s\S]*?display:\s*flex[\s\S]*?flex-direction:\s*column[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%/,
    )
  })
})
