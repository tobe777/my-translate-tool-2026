import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getStorage, setStorage } from '@/utils/storage'

export type ProviderType = 'volcengine' | 'baidu' | 'youdao' | 'iflytek' | 'deepl' | 'doubao'

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
  youdao: {
    appId: string
    appKey: string
  }
  iflytek: {
    accessKey: string
    secretKey: string
  }
  deepl: {
    authKey: string
    isPro: boolean
  }
  doubao: {
    apiKey: string
  }
}

const STORAGE_KEY = 'api_config'

const defaultConfig: APIConfig = {
  provider: 'volcengine',
  volcengine: {
    accessKey: '',
    secretKey: ''
  },
  baidu: {
    appId: '',
    appKey: ''
  },
  youdao: {
    appId: '',
    appKey: ''
  },
  iflytek: {
    accessKey: '',
    secretKey: ''
  },
  deepl: {
    authKey: '',
    isPro: false
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

  function updateYoudao(appId: string, appKey: string) {
    config.value.youdao = { appId, appKey }
    setStorage(STORAGE_KEY, config.value)
  }

  function updateIflytek(accessKey: string, secretKey: string) {
    config.value.iflytek = { accessKey, secretKey }
    setStorage(STORAGE_KEY, config.value)
  }

  function updateDeepl(authKey: string, isPro: boolean) {
    config.value.deepl = { authKey, isPro }
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
      case 'youdao':
        return !!(config.value.youdao.appId && config.value.youdao.appKey)
      case 'iflytek':
        return !!(config.value.iflytek.accessKey && config.value.iflytek.secretKey)
      case 'deepl':
        return !!(config.value.deepl.authKey)
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
    updateYoudao,
    updateIflytek,
    updateDeepl,
    updateDoubao,
    setProvider,
    isValid
  }
})