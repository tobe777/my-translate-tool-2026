import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

export interface CorpusItem {
  id: string
  source: string
  target: string
  remark: string
  sourceLang: string
  targetLang: string
  createdAt: number
}

const STORAGE_KEY = 'custom_corpus'

export const useCorpusStore = defineStore('corpus', () => {
  const items = ref<CorpusItem[]>(getStorage<CorpusItem[]>(STORAGE_KEY, []))
  const forceReplace = ref(getStorage<boolean>('corpus_force_replace', true))
  const enableMatch = ref(getStorage<boolean>('corpus_enable_match', true))

  const totalCount = computed(() => items.value.length)

  function addItem(source: string, target: string, remark: string, sourceLang: string, targetLang: string) {
    const exists = items.value.find(
      item => item.source === source && item.sourceLang === sourceLang && item.targetLang === targetLang
    )
    if (!exists) {
      items.value.unshift({
        id: Date.now().toString(),
        source,
        target,
        remark,
        sourceLang,
        targetLang,
        createdAt: Date.now()
      })
      setStorage(STORAGE_KEY, items.value)
    }
  }

  function addItems(newItems: Omit<CorpusItem, 'id' | 'createdAt'>[]) {
    newItems.forEach(item => {
      addItem(item.source, item.target, item.remark || '', item.sourceLang, item.targetLang)
    })
  }

  function updateItem(id: string, updates: Partial<CorpusItem>) {
    const item = items.value.find(item => item.id === id)
    if (item) {
      Object.assign(item, updates)
      setStorage(STORAGE_KEY, items.value)
    }
  }

  function search(query: string): CorpusItem[] {
    if (!query.trim()) return items.value
    return items.value.filter(
      item => item.source.includes(query) || item.target.includes(query) || item.remark.includes(query)
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

  function matchText(text: string, sourceLang: string, targetLang: string): string {
    if (!enableMatch.value) return text
    
    for (const item of items.value) {
      if (item.sourceLang === sourceLang && item.targetLang === targetLang) {
        if (text.includes(item.source)) {
          if (forceReplace.value) {
            text = text.replace(new RegExp(item.source, 'g'), item.target)
          } else {
            text = text.replace(item.source, item.target)
          }
        }
      }
    }
    return text
  }

  function setForceReplace(value: boolean) {
    forceReplace.value = value
    setStorage('corpus_force_replace', value)
  }

  function setEnableMatch(value: boolean) {
    enableMatch.value = value
    setStorage('corpus_enable_match', value)
  }

  function exportCSV(): string {
    const headers = ['原文', '译文', '备注', '源语言', '目标语言']
    const rows = items.value.map(item => [
      `"${item.source.replace(/"/g, '""')}"`,
      `"${item.target.replace(/"/g, '""')}"`,
      `"${(item.remark || '').replace(/"/g, '""')}"`,
      item.sourceLang,
      item.targetLang
    ])
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  return {
    items,
    totalCount,
    forceReplace,
    enableMatch,
    addItem,
    addItems,
    updateItem,
    search,
    deleteItem,
    batchDelete,
    clearAll,
    matchText,
    setForceReplace,
    setEnableMatch,
    exportCSV
  }
})
