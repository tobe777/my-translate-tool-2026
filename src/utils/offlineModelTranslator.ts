interface TranslateResult {
  success: boolean
  text?: string
  error?: string
}

export async function initModel(): Promise<void> {
  console.log('[离线模型] 离线模型已禁用，使用纯词典方案')
}

export function isModelReady(): boolean {
  return false
}

export function isLoadingModel(): boolean {
  return false
}

export function getLoadError(): string | null {
  return '离线模型已禁用（浏览器资源限制）'
}

export function resetModel(): void {}

export async function translateWithModel(_text: string, _sourceLang: string, _targetLang: string): Promise<TranslateResult> {
  return { 
    success: false, 
    error: '离线模型已禁用，仅支持词典翻译。如需完整离线翻译，请配置云端API密钥。' 
  }
}