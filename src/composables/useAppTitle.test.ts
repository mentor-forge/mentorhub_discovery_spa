import { describe, it, expect, beforeEach } from 'vitest'
import { useAppTitle } from './useAppTitle'

describe('useAppTitle', () => {
  beforeEach(() => {
    const { resetAppBarTitle } = useAppTitle()
    resetAppBarTitle()
  })

  it('defaults to Discovery', () => {
    const { appBarTitle } = useAppTitle()
    expect(appBarTitle.value).toBe('Discovery')
    expect(document.title).toBe('Discovery')
  })

  it('sets full_name:Discovery when profile name is provided', () => {
    const { setAppBarTitle, appBarTitle } = useAppTitle()
    setAppBarTitle('Jane Explorer')
    expect(appBarTitle.value).toBe('Jane Explorer:Discovery')
    expect(document.title).toBe('Jane Explorer:Discovery')
  })

  it('resets to Discovery when profile name is cleared', () => {
    const { setAppBarTitle, resetAppBarTitle, appBarTitle } = useAppTitle()
    setAppBarTitle('Jane Explorer')
    resetAppBarTitle()
    expect(appBarTitle.value).toBe('Discovery')
    expect(document.title).toBe('Discovery')
  })
})
