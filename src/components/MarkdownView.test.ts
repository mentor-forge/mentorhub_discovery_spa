import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MarkdownView from './MarkdownView.vue'

describe('MarkdownView', () => {
  it('renders headings, emphasis, lists, and links as HTML', () => {
    const wrapper = mount(MarkdownView, {
      props: {
        source: '## Welcome\n\n**Discover** a path:\n\n- First\n- Second\n\n[Open](https://example.com)',
      },
    })

    expect(wrapper.find('h2').text()).toBe('Welcome')
    expect(wrapper.find('strong').text()).toBe('Discover')
    expect(wrapper.findAll('li').map((item) => item.text())).toEqual(['First', 'Second'])
    expect(wrapper.find('a').attributes('href')).toBe('https://example.com')
    expect(wrapper.text()).not.toContain('**')
    expect(wrapper.text()).not.toContain('##')
  })

  it('sanitizes dangerous tags, attributes, and link protocols', () => {
    const wrapper = mount(MarkdownView, {
      props: {
        source:
          '<script>alert("xss")</script><img src="x" onerror="alert(1)">\n\n[Unsafe](javascript:alert(1))',
      },
    })

    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.html()).not.toContain('onerror')
    expect(wrapper.find('a').attributes('href')).toBeUndefined()
  })

  it('renders an empty body when source is missing', () => {
    const wrapper = mount(MarkdownView)

    expect(wrapper.text()).toBe('')
    expect(wrapper.html()).not.toContain('undefined')
  })
})
