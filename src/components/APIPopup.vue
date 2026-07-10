<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAPIStore } from '@/stores/apiStore'
import { translate } from '@/api/translate'
import { Loading, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const apiStore = useAPIStore()

const provider = ref<typeof apiStore.currentProvider>(apiStore.currentProvider)
const volcAccessKey = ref(apiStore.config.volcengine.accessKey)
const volcSecretKey = ref(apiStore.config.volcengine.secretKey)
const baiduAppId = ref(apiStore.config.baidu.appId)
const baiduAppKey = ref(apiStore.config.baidu.appKey)
const youdaoAppId = ref(apiStore.config.youdao.appId)
const youdaoAppKey = ref(apiStore.config.youdao.appKey)
const iflytekAccessKey = ref(apiStore.config.iflytek.accessKey)
const iflytekSecretKey = ref(apiStore.config.iflytek.secretKey)
const deeplAuthKey = ref(apiStore.config.deepl.authKey)
const deeplIsPro = ref(apiStore.config.deepl.isPro)
const doubaoApiKey = ref(apiStore.config.doubao.apiKey)

const isTesting = ref(false)
const testResult = ref<'success' | 'error' | null>(null)
const testErrorMessage = ref('')
const debugInfo = ref('')

watch(provider, (newProvider) => {
  apiStore.setProvider(newProvider)
})

function saveConfig() {
  switch (provider.value) {
    case 'volcengine': {
      const ak = volcAccessKey.value.trim()
      const sk = volcSecretKey.value.trim()
      
      if (!ak) {
        ElMessage.warning('请输入Access Key')
        return
      }
      if (!sk) {
        ElMessage.warning('请输入Secret Key')
        return
      }
      
      apiStore.updateVolcengine(ak, sk)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
    case 'baidu': {
      const appId = baiduAppId.value.trim()
      const appKey = baiduAppKey.value.trim()
      
      if (!appId) {
        ElMessage.warning('请输入APP ID')
        return
      }
      if (!appKey) {
        ElMessage.warning('请输入密钥')
        return
      }
      
      apiStore.updateBaidu(appId, appKey)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
    case 'youdao': {
      const appId = youdaoAppId.value.trim()
      const appKey = youdaoAppKey.value.trim()
      
      if (!appId) {
        ElMessage.warning('请输入APP ID')
        return
      }
      if (!appKey) {
        ElMessage.warning('请输入密钥')
        return
      }
      
      apiStore.updateYoudao(appId, appKey)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
    case 'iflytek': {
      const ak = iflytekAccessKey.value.trim()
      const sk = iflytekSecretKey.value.trim()
      
      if (!ak) {
        ElMessage.warning('请输入Access Key')
        return
      }
      if (!sk) {
        ElMessage.warning('请输入Secret Key')
        return
      }
      
      apiStore.updateIflytek(ak, sk)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
    case 'deepl': {
      const authKey = deeplAuthKey.value.trim()
      
      if (!authKey) {
        ElMessage.warning('请输入Auth Key')
        return
      }
      
      apiStore.updateDeepl(authKey, deeplIsPro.value)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
    case 'doubao': {
      const apiKey = doubaoApiKey.value.trim()
      
      if (!apiKey) {
        ElMessage.warning('请输入API Key')
        return
      }
      
      apiStore.updateDoubao(apiKey)
      ElMessage.success('配置已保存')
      emit('update:visible', false)
      break
    }
  }
}

async function testAPI() {
  testErrorMessage.value = ''
  debugInfo.value = ''
  
  switch (provider.value) {
    case 'volcengine': {
      const ak = volcAccessKey.value.trim()
      const sk = volcSecretKey.value.trim()
      
      if (!ak) {
        ElMessage.warning('请输入Access Key')
        return
      }
      if (!sk) {
        ElMessage.warning('请输入Secret Key')
        return
      }
      
      apiStore.updateVolcengine(ak, sk)
      break
    }
    case 'baidu': {
      const appId = baiduAppId.value.trim()
      const appKey = baiduAppKey.value.trim()
      
      if (!appId) {
        ElMessage.warning('请输入APP ID')
        return
      }
      if (!appKey) {
        ElMessage.warning('请输入密钥')
        return
      }
      
      apiStore.updateBaidu(appId, appKey)
      break
    }
    case 'youdao': {
      const appId = youdaoAppId.value.trim()
      const appKey = youdaoAppKey.value.trim()
      
      if (!appId) {
        ElMessage.warning('请输入APP ID')
        return
      }
      if (!appKey) {
        ElMessage.warning('请输入密钥')
        return
      }
      
      apiStore.updateYoudao(appId, appKey)
      break
    }
    case 'iflytek': {
      const ak = iflytekAccessKey.value.trim()
      const sk = iflytekSecretKey.value.trim()
      
      if (!ak) {
        ElMessage.warning('请输入Access Key')
        return
      }
      if (!sk) {
        ElMessage.warning('请输入Secret Key')
        return
      }
      
      apiStore.updateIflytek(ak, sk)
      break
    }
    case 'deepl': {
      const authKey = deeplAuthKey.value.trim()
      
      if (!authKey) {
        ElMessage.warning('请输入Auth Key')
        return
      }
      
      apiStore.updateDeepl(authKey, deeplIsPro.value)
      break
    }
    case 'doubao': {
      const apiKey = doubaoApiKey.value.trim()
      
      if (!apiKey) {
        ElMessage.warning('请输入API Key')
        return
      }
      
      apiStore.updateDoubao(apiKey)
      break
    }
  }
  
  isTesting.value = true
  testResult.value = null
  
  try {
    const result = await translate('Hello', 'en', 'zh')
    
    isTesting.value = false
    if (result.success) {
      testResult.value = 'success'
      testErrorMessage.value = ''
      debugInfo.value = ''
      ElMessage.success('API测试成功')
    } else {
      testResult.value = 'error'
      testErrorMessage.value = result.error || 'API测试失败'
      debugInfo.value = `错误码: ${result.debugInfo?.errorCode || '未知'}`
      ElMessage.error(result.error || 'API测试失败')
    }
  } catch (error: any) {
    isTesting.value = false
    testResult.value = 'error'
    
    console.error('=== 测试连接异常 ===')
    console.error('Error:', error)
    console.error('Error Code:', error.code)
    console.error('Error Message:', error.message)
    if (error.response) {
      console.error('Response Status:', error.response.status)
      console.error('Response Data:', error.response.data)
      console.error('Response Headers:', error.response.headers)
    }
    console.error('======================')
    
    if (error.code === 'ERR_NETWORK') {
      testErrorMessage.value = '❌ 网络错误：无法连接到翻译服务，请检查网络连接'
    } else if (error.message?.includes('timeout')) {
      testErrorMessage.value = '❌ 网络超时：连接翻译服务超时，请检查网络或稍后重试'
    } else if (error.message?.includes('CORS')) {
      testErrorMessage.value = '❌ 跨域错误：代理配置异常，请检查vite.config.ts配置'
    } else if (error.response?.status === 401) {
      testErrorMessage.value = '❌ 认证失败：密钥不正确，请检查配置'
    } else if (error.response?.status === 403) {
      testErrorMessage.value = '❌ 无权限：密钥无效或权限不足，请检查配置'
    } else if (error.response?.status === 429) {
      testErrorMessage.value = '❌ 请求过于频繁：请稍后再试或检查调用额度'
    } else {
      testErrorMessage.value = `❌ 连接失败：${error.message || '未知错误'}`
      if (error.response?.data?.ResponseMetadata?.Error) {
        const err = error.response.data.ResponseMetadata.Error
        testErrorMessage.value += ` (${err.Code}: ${err.Message})`
      }
    }
    
    ElMessage.error(testErrorMessage.value)
  }
}

function handleClose() {
  emit('update:visible', false)
  testResult.value = null
  testErrorMessage.value = ''
  debugInfo.value = ''
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="modal-mask" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>API配置</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        
        <div class="modal-body">
          <div class="provider-switch">
            <span class="switch-label">翻译服务</span>
            <div class="switch-tabs">
              <button
                :class="['switch-tab', { active: provider === 'volcengine' }]"
                @click="provider = 'volcengine'"
              >
                火山翻译
              </button>
              <button
                :class="['switch-tab', { active: provider === 'baidu' }]"
                @click="provider = 'baidu'"
              >
                百度翻译
              </button>
              <button
                :class="['switch-tab', { active: provider === 'youdao' }]"
                @click="provider = 'youdao'"
              >
                有道翻译
              </button>
              <button
                :class="['switch-tab', { active: provider === 'iflytek' }]"
                @click="provider = 'iflytek'"
              >
                讯飞翻译
              </button>
              <button
                :class="['switch-tab', { active: provider === 'deepl' }]"
                @click="provider = 'deepl'"
              >
                DeepL
              </button>
              <button
                :class="['switch-tab', { active: provider === 'doubao' }]"
                @click="provider = 'doubao'"
              >
                豆包大模型
              </button>
            </div>
          </div>
          
          <div v-if="provider === 'volcengine'" class="form-section">
            <div class="form-item">
              <label>Access Key</label>
              <input
                v-model="volcAccessKey"
                type="text"
                placeholder="请输入火山翻译Access Key"
              />
            </div>
            <div class="form-item">
              <label>Secret Key</label>
              <input
                v-model="volcSecretKey"
                type="password"
                placeholder="请输入火山翻译Secret Key"
              />
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://console.volcengine.com/iam/keymanage/" target="_blank">火山引擎控制台</a> 获取密钥，子账号需授予 TranslateFullAccess 权限</span>
            </div>
          </div>
          
          <div v-else-if="provider === 'baidu'" class="form-section">
            <div class="form-item">
              <label>APP ID</label>
              <input
                v-model="baiduAppId"
                type="text"
                placeholder="请输入百度翻译APP ID"
              />
            </div>
            <div class="form-item">
              <label>密钥</label>
              <input
                v-model="baiduAppKey"
                type="password"
                placeholder="请输入百度翻译密钥"
              />
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://fanyi-api.baidu.com/" target="_blank">百度翻译开放平台</a> 获取密钥</span>
            </div>
          </div>
          
          <div v-else-if="provider === 'youdao'" class="form-section">
            <div class="form-item">
              <label>APP ID</label>
              <input
                v-model="youdaoAppId"
                type="text"
                placeholder="请输入有道翻译APP ID"
              />
            </div>
            <div class="form-item">
              <label>密钥</label>
              <input
                v-model="youdaoAppKey"
                type="password"
                placeholder="请输入有道翻译密钥"
              />
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://ai.youdao.com/" target="_blank">有道智云平台</a> 获取密钥</span>
            </div>
          </div>
          
          <div v-else-if="provider === 'iflytek'" class="form-section">
            <div class="form-item">
              <label>Access Key</label>
              <input
                v-model="iflytekAccessKey"
                type="text"
                placeholder="请输入科大讯飞Access Key"
              />
            </div>
            <div class="form-item">
              <label>Secret Key</label>
              <input
                v-model="iflytekSecretKey"
                type="password"
                placeholder="请输入科大讯飞Secret Key"
              />
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://console.xfyun.cn/" target="_blank">科大讯飞开放平台</a> 获取密钥</span>
            </div>
          </div>
          
          <div v-else-if="provider === 'deepl'" class="form-section">
            <div class="form-item">
              <label>Auth Key</label>
              <input
                v-model="deeplAuthKey"
                type="password"
                placeholder="请输入DeepL Auth Key"
              />
            </div>
            <div class="form-item">
              <label style="display: flex; align-items: center; gap: 8px;">
                <input
                  v-model="deeplIsPro"
                  type="checkbox"
                />
                专业版 (Pro)
              </label>
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://www.deepl.com/pro-api" target="_blank">DeepL API官网</a> 获取Auth Key，免费版无需勾选专业版</span>
            </div>
          </div>
          
          <div v-else-if="provider === 'doubao'" class="form-section">
            <div class="form-item">
              <label>API Key</label>
              <input
                v-model="doubaoApiKey"
                type="password"
                placeholder="请输入豆包API Key"
              />
            </div>
            <div class="tip">
              <span>提示：</span>
              <span>请前往 <a href="https://www.doubao.com/" target="_blank">豆包开放平台</a> 获取API Key，适合长文、文学、专业文稿翻译</span>
            </div>
          </div>
          
          <div class="test-section">
            <button class="test-btn" @click="testAPI" :disabled="isTesting">
              <Loading v-if="isTesting" class="btn-icon spin" />
              <Check v-else class="btn-icon" />
              {{ isTesting ? '测试中...' : '测试连接' }}
            </button>
            <div v-if="testResult" :class="['test-status', testResult]">
              {{ testResult === 'success' ? '✓ 连接成功' : '✗ 连接失败' }}
            </div>
          </div>
          
          <div v-if="testErrorMessage" class="error-detail">
            <div class="error-title">错误详情</div>
            <div class="error-content">{{ testErrorMessage }}</div>
          </div>
          
          <div v-if="debugInfo" class="debug-detail">
            <div class="debug-title">调试信息</div>
            <div class="debug-content">{{ debugInfo }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-default" @click="handleClose">取消</button>
          <button class="btn btn-primary" @click="saveConfig">保存配置</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 90%;
  max-width: 550px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #F5F7FA;
  border-bottom: 1px solid #E4E7ED;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .close-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    font-size: 24px;
    color: #909399;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
    
    &:hover {
      background: #E4E7ED;
      color: #606266;
    }
  }
}

.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.provider-switch {
  margin-bottom: 24px;
  
  .switch-label {
    display: block;
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
  }
  
  .switch-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    background: #F5F7FA;
    padding: 4px;
    border-radius: 6px;
  }
  
  .switch-tab {
    padding: 8px 12px;
    border: none;
    background: transparent;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &.active {
      background: #409EFF;
      color: #fff;
    }
    
    &:hover:not(.active) {
      background: #E8F4FF;
      color: #409EFF;
    }
  }
}

.form-section {
  .form-item {
    margin-bottom: 16px;
    
    label {
      display: block;
      font-size: 14px;
      color: #606266;
      margin-bottom: 6px;
      
      input[type="checkbox"] {
        margin-right: 8px;
      }
    }
    
    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #DCDFE6;
      border-radius: 6px;
      font-size: 14px;
      color: #303133;
      
      &::placeholder {
        color: #C0C4CC;
      }
      
      &:focus {
        outline: none;
        border-color: #409EFF;
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
      }
    }
  }
  
  .tip {
    font-size: 12px;
    color: #909399;
    
    a {
      color: #409EFF;
      text-decoration: none;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.test-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
  
  .test-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: 1px solid #DCDFE6;
    background: #fff;
    border-radius: 6px;
    font-size: 14px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .btn-icon {
      font-size: 16px;
    }
    
    &:hover:not(:disabled) {
      border-color: #409EFF;
      color: #409EFF;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .spin {
      animation: spin 1s linear infinite;
    }
  }
  
  .test-status {
    font-size: 14px;
    font-weight: 500;
    padding-top: 10px;
    
    &.success {
      color: #67C23A;
    }
    
    &.error {
      color: #F56C6C;
    }
  }
}

.error-detail {
  margin-top: 12px;
  padding: 12px;
  background: #FEF0F0;
  border-radius: 6px;
  border: 1px solid #FDE2E2;
  
  .error-title {
    font-size: 12px;
    color: #F56C6C;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .error-content {
    font-size: 12px;
    color: #F56C6C;
    line-height: 1.5;
    word-break: break-all;
  }
}

.debug-detail {
  margin-top: 8px;
  padding: 12px;
  background: #F5F7FA;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
  
  .debug-title {
    font-size: 12px;
    color: #909399;
    font-weight: 600;
    margin-bottom: 4px;
  }
  
  .debug-content {
    font-size: 12px;
    color: #606266;
    font-family: monospace;
    word-break: break-all;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  background: #F5F7FA;
  border-top: 1px solid #E4E7ED;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.btn-primary {
    background: #409EFF;
    color: #fff;
    
    &:hover {
      background: #66B1FF;
    }
  }
  
  &.btn-default {
    background: #fff;
    color: #606266;
    border: 1px solid #DCDFE6;
    
    &:hover {
      border-color: #409EFF;
      color: #409EFF;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>