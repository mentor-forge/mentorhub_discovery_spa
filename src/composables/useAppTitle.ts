import { ref } from 'vue'

const DEFAULT_APP_TITLE = 'Discovery'
const appBarTitle = ref(DEFAULT_APP_TITLE)

export function useAppTitle() {
  function setAppBarTitle(fullName?: string) {
    appBarTitle.value = fullName ? `${fullName}:${DEFAULT_APP_TITLE}` : DEFAULT_APP_TITLE
    document.title = appBarTitle.value
  }

  function resetAppBarTitle() {
    setAppBarTitle()
  }

  return {
    appBarTitle,
    setAppBarTitle,
    resetAppBarTitle,
  }
}
