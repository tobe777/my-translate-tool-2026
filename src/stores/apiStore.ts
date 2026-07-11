import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

export type ProviderType = 'volcengine' | 'baidu' | 'doubao'

export interface APIConfig {
  provider: ProviderType
  volcengine: {
    accessKey: string
    secretKey: string
  }
  baidu: {
    appId: string
    appKey: string
  }
  doubao: {
    apiKey: string
  }
}

const STORAGE_KEY = 'api_config'

const defaultConfig: APIConfig = {
  provider: 'baidu',
  volcengine: {
    accessKey: '',
    secretKey: ''
  },
  baidu: {
    appId: '',
    appKey: ''
  },
  doubao: {
    apiKey: ''
  }
}

export const useAPIStore = defineStore('api', () => {
  const config = ref<APIConfig>(getStorage<APIConfig>(STORAGE_KEY, defaultConfig))

  const currentProvider = computed(() => config.value.provider)

  function saveConfig(newConfig: Partial<APIConfig>) {
    config.value = { ...config.value, ...newConfig }
    setStorage(STORAGE_KEY, config.value)
  }

  function updateVolcengine(accessKey: string, secretKey: string) {
    config.value.volcengine = { accessKey, secretKey }
    setStorage(STORAGE_KEY, config.value)
  }

  function updateBaidu(appId: string, appKey: string) {
    config.value.baidu = { appId, appKey }
    setStorage(STORAGE_KEY, config.value)
  }

  function updateDoubao(apiKey: string) {
    config.value.doubao = { apiKey }
    setStorage(STORAGE_KEY, config.value)
  }

  function setProvider(provider: ProviderType) {
    config.value.provider = provider
    setStorage(STORAGE_KEY, config.value)
  }

  function isValid(): boolean {
    switch (config.value.provider) {
      case 'volcengine':
        return !!(config.value.volcengine.accessKey && config.value.volcengine.secretKey)
      case 'baidu':
        return !!(config.value.baidu.appId && config.value.baidu.appKey)
      case 'doubao':
        return !!(config.value.doubao.apiKey)
      default:
        return false
    }
  }

  return {
    config,
    currentProvider,
    saveConfig,
    updateVolcengine,
    updateBaidu,
    updateDoubao,
    setProvider,
    isValid
  }
})