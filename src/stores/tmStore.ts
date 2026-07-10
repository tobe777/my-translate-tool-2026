import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

export interface TMItem {
  id: string
  source: string
  target: string
  sourceLang: string
  targetLang: string
  createdAt: number
}

const STORAGE_KEY = 'translate_memory'

export const useTMStore = defineStore('tm', () => {
  const items = ref<TMItem[]>(getStorage<TMItem[]>(STORAGE_KEY, []))
  const priorityOverride = ref(getStorage<boolean>('tm_priority_override', false))

  const totalCount = computed(() => items.value.length)

  function addItem(source: string, target: string, sourceLang: string, targetLang: string) {
    const exists = items.value.find(
      item => item.source === source && item.sourceLang === sourceLang && item.targetLang === targetLang
    )
    if (!exists) {
      items.value.unshift({
        id: Date.now().toString(),
        source,
        target,
        sourceLang,
        targetLang,
        createdAt: Date.now()
      })
      if (items.value.length > 1000) {
        items.value = items.value.slice(0, 1000)
      }
      setStorage(STORAGE_KEY, items.value)
    }
  }

  function updateItem(id: string, newTarget: string) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      item.target = newTarget
      setStorage(STORAGE_KEY, items.value)
    }
  }

  function search(query: string): TMItem[] {
    if (!query.trim()) return items.value
    return items.value.filter(
      item => item.source.includes(query) || item.target.includes(query)
    )
  }

  function deleteItem(id: string) {
    items.value = items.value.filter(item => item.id !== id)
    setStorage(STORAGE_KEY, items.value)
  }

  function batchDelete(ids: string[]) {
    items.value = items.value.filter(item => !ids.includes(item.id))
    setStorage(STORAGE_KEY, items.value)
  }

  function clearAll() {
    items.value = []
    setStorage(STORAGE_KEY, items.value)
  }

  function getMatch(source: string, sourceLang: string, targetLang: string): string | null {
    const item = items.value.find(
      item => item.source === source && item.sourceLang === sourceLang && item.targetLang === targetLang
    )
    return item?.target || null
  }

  function setPriorityOverride(value: boolean) {
    priorityOverride.value = value
    setStorage('tm_priority_override', value)
  }

  return {
    items,
    totalCount,
    priorityOverride,
    addItem,
    updateItem,
    search,
    deleteItem,
    batchDelete,
    clearAll,
    getMatch,
    setPriorityOverride
  }
})
