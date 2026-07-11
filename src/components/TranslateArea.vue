<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useTMStore } from '@/stores/tmStore'
import { useCorpusStore } from '@/stores/corpusStore'
import { useAPIStore } from '@/stores/apiStore'
import { translate, supportedLanguages } from '@/api/translate'
import { downloadText, downloadExcel, countWords } from '@/utils/export'

const sourceText = ref('')
const targetText = ref('')
const sourceLang = ref('en')
const targetLang = ref('zh')
const isTranslating = ref(false)
const errorMessage = ref('')
const currentMode = ref<'cloud' | 'offline-model'>('cloud')

const tmStore = useTMStore()
const corpusStore = useCorpusStore()
const apiStore = useAPIStore()

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let currentRequestId = 0

const sourceWordCount = computed(() => countWords(sourceText.value))
const targetWordCount = computed(() => countWords(targetText.value))

function debounceTranslate() {
  errorMessage.value = ''
  
  if (!sourceText.value.trim()) {
    targetText.value = ''
    errorMessage.value = ''
    return
  }
  
  const tmMatch = tmStore.getMatch(sourceText.value, sourceLang.value, targetLang.value)
  if (tmMatch && tmStore.priorityOverride) {
    targetText.value = tmMatch
    return
  }
  
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  
  const requestId = ++currentRequestId
  
  debounceTimer = setTimeout(async () => {
    isTranslating.value = true
    const result = await translate(sourceText.value, sourceLang.value, targetLang.value)
    isTranslating.value = false
    
    if (currentRequestId !== requestId) {
      return
    }
    
    if (result.success) {
      let finalText = result.text || ''
      
      finalText = corpusStore.matchText(finalText, sourceLang.value, targetLang.value)
      
      if (tmMatch && tmStore.priorityOverride) {
        finalText = tmMatch
      }
      
      targetText.value = finalText
      
      const isCompleteSentence = /[.!?。！？]$/.test(sourceText.value.trim()) || sourceText.value.trim().length > 15
      if (isCompleteSentence) {
        tmStore.addItem(sourceText.value, targetText.value, sourceLang.value, targetLang.value)
      }
      
      currentMode.value = result.fromOffline ? 'offline-model' : 'cloud'
      errorMessage.value = ''
    } else {
      if (!targetText.value) {
        errorMessage.value = result.error || '翻译失败'
      }
    }
  }, 500)
}

watch(sourceText, () => {
  debounceTranslate()
})

onMounted(() => {
})

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
})

function swapLanguages() {
  const tempLang = sourceLang.value
  sourceLang.value = targetLang.value
  targetLang.value = tempLang
  
  const tempText = sourceText.value
  sourceText.value = targetText.value
  targetText.value = tempText
}

function clearAll() {
  sourceText.value = ''
  targetText.value = ''
  errorMessage.value = ''
}

async function copySource() {
  if (!sourceText.value) return
  try {
    await navigator.clipboard.writeText(sourceText.value)
    alert('已复制原文')
  } catch {
    alert('复制失败')
  }
}

async function copyTarget() {
  if (!targetText.value) return
  try {
    await navigator.clipboard.writeText(targetText.value)
    alert('已复制译文')
  } catch {
    alert('复制失败')
  }
}

function exportTarget() {
  if (!targetText.value) {
    alert('没有译文可导出')
    return
  }
  downloadText(targetText.value, `译文_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.txt`)
}

function exportAll() {
  downloadExcel(tmStore.items, ['原文', '译文', '源语言', '目标语言'], `翻译记录_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.xlsx`)
}

function getModeText() {
  if (currentMode.value === 'offline-model') {
    return '🤖 离线AI模型'
  }
  
  const providerNames: Record<string, string> = {
    'baidu': '百度',
    'volcengine': '火山',
    'doubao': '豆包'
  }
  
  const providerName = providerNames[apiStore.currentProvider] || '云端'
  return `🌐 ${providerName}翻译`
}

function getModeColor() {
  if (currentMode.value === 'offline-model') {
    return '#E6A23C'
  }
  return '#409EFF'
}
</script>

<template>
  <div class="translate-container">
    <div class="mode-indicator">
      <span class="mode-text" :style="{ color: getModeColor() }">{{ getModeText() }}</span>
    </div>
    
    <div class="translate-main">
      <div class="translate-box input-box">
        <div class="box-header">
          <select v-model="sourceLang" class="lang-select">
            <option v-for="lang in supportedLanguages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
          </select>
          <span class="word-count">{{ sourceWordCount }} 字</span>
          <div class="box-actions">
            <button class="action-btn" @click="copySource">📋</button>
            <button class="action-btn" @click="clearAll">🗑️</button>
          </div>
        </div>
        <textarea v-model="sourceText" placeholder="请输入要翻译的文本..." class="translate-textarea" />
      </div>
      
      <div class="swap-container">
        <button @click="swapLanguages" :disabled="isTranslating" class="swap-btn">⇆</button>
      </div>
      
      <div class="translate-box output-box">
        <div class="box-header">
          <select v-model="targetLang" class="lang-select">
            <option v-for="lang in supportedLanguages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
          </select>
          <span class="word-count">{{ targetWordCount }} 字</span>
          <div class="box-actions">
            <button class="action-btn" @click="copyTarget">📋</button>
            <button class="action-btn" @click="exportTarget">📥</button>
            <button class="action-btn" @click="exportAll">📊</button>
          </div>
        </div>
        <div class="output-content">
          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
          <div v-if="isTranslating && !errorMessage" class="translating">
            <span>⏳</span>
            <span>正在翻译...</span>
          </div>
          <div v-else-if="!targetText && !errorMessage" class="empty-hint">译文将显示在这里...</div>
          <textarea v-else v-model="targetText" readonly class="translate-textarea" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.translate-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-sizing: border-box;
  gap: 12px;
}

.mode-indicator {
  display: flex;
  justify-content: center;
  padding: 8px;
}

.mode-text {
  font-size: 13px;
  font-weight: 500;
  background: rgba(64, 158, 255, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.translate-main {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.translate-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.box-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #F5F7FA;
  border-bottom: 1px solid #E4E7ED;
}

.lang-select {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #DCDFE6;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  background: #fff;
  cursor: pointer;
}

.word-count {
  font-size: 12px;
  color: #909399;
  margin: 0 12px;
}

.box-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #E8F4FF;
    color: #409EFF;
  }
}

.translate-textarea {
  flex: 1;
  padding: 16px;
  border: none;
  resize: none;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  box-sizing: border-box;
  overflow-y: auto;
  
  &::placeholder {
    color: #C0C4CC;
  }
}

.swap-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.swap-btn {
  width: 48px;
  height: 48px;
  border: 1px solid #DCDFE6;
  background: #fff;
  border-radius: 50%;
  font-size: 20px;
  color: #409EFF;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: #E8F4FF;
    border-color: #409EFF;
  }
}

.output-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.error-message {
  padding: 12px 16px;
  background: #FEF0F0;
  color: #F56C6C;
  font-size: 13px;
  border-bottom: 1px solid #FDE2E2;
}

.translating {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
  font-size: 14px;
  gap: 8px;
  
  span:first-child {
    font-size: 18px;
  }
}

.empty-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C0C4CC;
  font-size: 14px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

textarea:focus {
  outline: none;
}

select:hover {
  border-color: #409EFF;
}

select:focus {
  outline: none;
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.dark & {
  .translate-box {
    background: #16213e;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  .box-header {
    background: #0f3460;
    border-bottom-color: #2a2a4a;
  }
  
  .lang-select {
    background: #0f3460;
    border-color: #2a2a4a;
    color: #b8b8d0;
  }
  
  .word-count {
    color: #8888a0;
  }
  
  .action-btn {
    color: #b8b8d0;
    
    &:hover {
      background: #2a2a4a;
    }
  }
  
  .translate-textarea {
    background: #16213e;
    color: #ffffff;
    
    &::placeholder {
      color: #555570;
    }
  }
  
  .swap-btn {
    background: #16213e;
    border-color: #2a2a4a;
    
    &:hover:not(:disabled) {
      background: #2a2a4a;
    }
  }
  
  .error-message {
    background: #2d1f1f;
    color: #F56C6C;
    border-bottom-color: #4a2a2a;
  }
  
  .translating {
    color: #66B1FF;
  }
  
  .empty-hint {
    color: #555570;
  }
  
  .mode-text {
    background: rgba(64, 158, 255, 0.15);
  }
}
</style>