import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'theme_mode'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(getStorage<ThemeMode>(STORAGE_KEY, 'light'))

  function toggle() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode
  }

  watch(mode, (newMode) => {
    setStorage(STORAGE_KEY, newMode)
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, { immediate: true })

  return {
    mode,
    toggle,
    setMode
  }
})
