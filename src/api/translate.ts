import axios from 'axios'
import { useAPIStore } from '@/stores/apiStore'

export interface TranslateResult {
  success: boolean
  text?: string
  error?: string
  fromOffline?: boolean
}

function cleanTranslation(text: string): string {
  if (!text) return ''

  let cleaned = text

  cleaned = cleaned.replace(/\r\n/g, '\n')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  cleaned = cleaned.trim()

  cleaned = cleaned.replace(/翻译：/g, '')
  cleaned = cleaned.replace(/译文：/g, '')
  cleaned = cleaned.replace(/原文：/g, '')
  cleaned = cleaned.replace(/解释：/g, '')
  cleaned = cleaned.replace(/说明：/g, '')
  cleaned = cleaned.replace(/备注：/g, '')
  cleaned = cleaned.replace(/例句：/g, '')
  cleaned = cleaned.replace(/参考：/g, '')
  cleaned = cleaned.replace(/Reference:/gi, '')
  cleaned = cleaned.replace(/Translation:/gi, '')
  cleaned = cleaned.replace(/Original:/gi, '')
  cleaned = cleaned.replace(/Explanation:/gi, '')
  cleaned = cleaned.replace(/Example:/gi, '')

  cleaned = cleaned.replace(/\b(https?:\/\/[^\s]+)\b/g, '')
  cleaned = cleaned.replace(/\b(www\.[^\s]+)\b/g, '')

  cleaned = cleaned.trim()

  return cleaned
}

const TRANSLATION_PROMPT = `你是一个专业的翻译助手，必须严格遵守以下翻译规则：
1. 完整理解整段文本的语义，按目标语言的母语语序重组通顺完整的句子，禁止逐词碎片式翻译；
2. 全文所有词汇必须完整翻译，不存在"不会就保留原词"的情况，生僻词根据语境意译；
3. 仅输出纯目标语言译文，禁止任何原文词汇、双语对照、注释、解释、额外符号，所有多余内容全部剔除；
4. 严格区分中译英/英译中，全程单一语种输出，不允许两种文字共存；
5. 保持句子的完整性和语法正确性，不要拆分句子，不要破坏语法结构。`

async function md5Hex(data: string): Promise<string> {
  return new Promise(resolve => {
    const md5 = (str: string): string => {
      const rotateLeft = (lValue: number, iShiftBits: number): number => {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
      }
      const addUnsigned = (lX: number, lY: number): number => {
        const lX4 = (lX & 0x40000000)
        const lY4 = (lY & 0x40000000)
        const lX8 = (lX & 0x80000000)
        const lY8 = (lY & 0x80000000)
        let lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF)
        if (lX4 & lY4) {
          lResult += 0x80000000
        }
        if (lX8 & lY8) {
          lResult += 0x40000000
        }
        return lResult | lX8 | lY8
      }
      const f = (x: number, y: number, z: number): number => {
        return (x & y) | (~x & z)
      }
      const g = (x: number, y: number, z: number): number => {
        return (x & z) | (y & ~z)
      }
      const h = (x: number, y: number, z: number): number => {
        return x ^ y ^ z
      }
      const i = (x: number, y: number, z: number): number => {
        return y ^ (x | ~z)
      }
      const ff = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number => {
        a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac))
        return addUnsigned(rotateLeft(a, s), b)
      }
      const gg = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number => {
        a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac))
        return addUnsigned(rotateLeft(a, s), b)
      }
      const hh = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number => {
        a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac))
        return addUnsigned(rotateLeft(a, s), b)
      }
      const ii = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number => {
        a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac))
        return addUnsigned(rotateLeft(a, s), b)
      }
      const convertToWordArray = (str: string): number[] => {
        const lWordCount = ((str.length + 8) >> 6) + 1
        const lWordArray = new Array(lWordCount)
        let lBytePosition = 0
        let lByteCount = 0
        while (lByteCount < str.length) {
          lWordArray[lBytePosition >> 2] |= str.charCodeAt(lByteCount) << (24 - (lBytePosition & 3) * 8)
          lBytePosition++
          lByteCount++
        }
        const lBitsTotal = lBytePosition * 8
        lWordArray[lBytePosition >> 2] |= 0x80 << (24 - (lBytePosition & 3) * 8)
        lWordArray[lWordCount - 1] = lBitsTotal
        return lWordArray
      }
      const wordToHex = (lValue: number): string => {
        let wordHex = ''
        for (let i = 0; i <= 3; i++) {
          wordHex += String.fromCharCode(((lValue >> (8 * (3 - i))) & 0xFF))
        }
        return wordHex
      }
      const x = convertToWordArray(str)
      let a = 0x67452301
      let b = 0xEFCDAB89
      let c = 0x98BADCFE
      let d = 0x10325476
      for (let k = 0; k < x.length; k += 16) {
        const aa = a
        const bb = b
        const cc = c
        const dd = d
        a = ff(a, b, c, d, x[k + 0], 7, 0xD76AA478)
        d = ff(d, a, b, c, x[k + 1], 12, 0xE8C7B756)
        c = ff(c, d, a, b, x[k + 2], 17, 0x242070DB)
        b = ff(b, c, d, a, x[k + 3], 22, 0xC1BDCEEE)
        a = ff(a, b, c, d, x[k + 4], 7, 0xF57C0FAF)
        d = ff(d, a, b, c, x[k + 5], 12, 0x4787C62A)
        c = ff(c, d, a, b, x[k + 6], 17, 0xA8304613)
        b = ff(b, c, d, a, x[k + 7], 22, 0xFD469501)
        a = ff(a, b, c, d, x[k + 8], 7, 0x698098D8)
        d = ff(d, a, b, c, x[k + 9], 12, 0x8B44F7AF)
        c = ff(c, d, a, b, x[k + 10], 17, 0xFFFF5BB1)
        b = ff(b, c, d, a, x[k + 11], 22, 0x895CD7BE)
        a = ff(a, b, c, d, x[k + 12], 7, 0x6B901122)
        d = ff(d, a, b, c, x[k + 13], 12, 0xFD987193)
        c = ff(c, d, a, b, x[k + 14], 17, 0xA679438E)
        b = ff(b, c, d, a, x[k + 15], 22, 0x49B40821)
        a = gg(a, b, c, d, x[k + 1], 5, 0xF61E2562)
        d = gg(d, a, b, c, x[k + 6], 9, 0xC040B340)
        c = gg(c, d, a, b, x[k + 11], 14, 0x265E5A51)
        b = gg(b, c, d, a, x[k + 0], 20, 0xE9B6C7AA)
        a = gg(a, b, c, d, x[k + 5], 5, 0xD62F105D)
        d = gg(d, a, b, c, x[k + 10], 9, 0x02441453)
        c = gg(c, d, a, b, x[k + 15], 14, 0xD8A1E681)
        b = gg(b, c, d, a, x[k + 4], 20, 0xE7D3FBC8)
        a = gg(a, b, c, d, x[k + 9], 5, 0x21E1CDE6)
        d = gg(d, a, b, c, x[k + 14], 9, 0xC33707D6)
        c = gg(c, d, a, b, x[k + 3], 14, 0xF4D50D87)
        b = gg(b, c, d, a, x[k + 8], 20, 0x455A14ED)
        a = gg(a, b, c, d, x[k + 13], 5, 0xA9E3E905)
        d = gg(d, a, b, c, x[k + 2], 9, 0xFCEFA3F8)
        c = gg(c, d, a, b, x[k + 7], 14, 0x676F02D9)
        b = gg(b, c, d, a, x[k + 12], 20, 0x8D2A4C8A)
        a = hh(a, b, c, d, x[k + 5], 4, 0xFFFA3942)
        d = hh(d, a, b, c, x[k + 8], 11, 0x8771F681)
        c = hh(c, d, a, b, x[k + 11], 16, 0x6D9D6122)
        b = hh(b, c, d, a, x[k + 14], 23, 0xFDE5380C)
        a = hh(a, b, c, d, x[k + 1], 4, 0xA4BEEA44)
        d = hh(d, a, b, c, x[k + 4], 11, 0x4BDECFA9)
        c = hh(c, d, a, b, x[k + 7], 16, 0xF6BB4B60)
        b = hh(b, c, d, a, x[k + 10], 23, 0xBEBFBC70)
        a = hh(a, b, c, d, x[k + 13], 4, 0x289B7EC6)
        d = hh(d, a, b, c, x[k + 0], 11, 0xEAA127FA)
        c = hh(c, d, a, b, x[k + 3], 16, 0xD4EF3085)
        b = hh(b, c, d, a, x[k + 6], 23, 0x04881D05)
        a = hh(a, b, c, d, x[k + 9], 4, 0xD9D4D039)
        d = hh(d, a, b, c, x[k + 12], 11, 0xE6DB99E5)
        c = hh(c, d, a, b, x[k + 15], 16, 0x1FA27CF8)
        b = hh(b, c, d, a, x[k + 2], 23, 0xC4AC5665)
        a = ii(a, b, c, d, x[k + 0], 6, 0xF4292244)
        d = ii(d, a, b, c, x[k + 7], 10, 0x432AFF97)
        c = ii(c, d, a, b, x[k + 14], 15, 0xAB9423A7)
        b = ii(b, c, d, a, x[k + 5], 21, 0xFC93A039)
        a = ii(a, b, c, d, x[k + 12], 6, 0x655B59C3)
        d = ii(d, a, b, c, x[k + 3], 10, 0x8F0CCC92)
        c = ii(c, d, a, b, x[k + 10], 15, 0xFFEFF47D)
        b = ii(b, c, d, a, x[k + 1], 21, 0x85845DD1)
        a = ii(a, b, c, d, x[k + 8], 6, 0x6FA87E4F)
        d = ii(d, a, b, c, x[k + 15], 10, 0xFE2CE6E0)
        c = ii(c, d, a, b, x[k + 6], 15, 0xA3014314)
        b = ii(b, c, d, a, x[k + 13], 21, 0x4E0811A1)
        a = ii(a, b, c, d, x[k + 4], 6, 0xF7537E82)
        d = ii(d, a, b, c, x[k + 11], 10, 0xBD3AF235)
        c = ii(c, d, a, b, x[k + 2], 15, 0x2AD7D2BB)
        b = ii(b, c, d, a, x[k + 9], 21, 0xEB86D391)
        a = addUnsigned(a, aa)
        b = addUnsigned(b, bb)
        c = addUnsigned(c, cc)
        d = addUnsigned(d, dd)
      }
      return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
    }
    const hexChars = '0123456789abcdef'
    let hexStr = ''
    const str = md5(data)
    for (let i = 0; i < str.length; i++) {
      hexStr += hexChars[(str.charCodeAt(i) >> 4) & 0xF]
      hexStr += hexChars[str.charCodeAt(i) & 0xF]
    }
    resolve(hexStr)
  })
}

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const buffer = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
  return new Uint8Array(buffer)
}

async function translateBaidu(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { appId, appKey } = store.config.baidu
  if (!appId || !appKey) {
    return { success: false, error: '百度翻译API未配置' }
  }

  const salt = Date.now().toString()
  const signStr = `${appId}${text}${salt}${appKey}`
  const sign = await md5Hex(signStr)

  try {
    const response = await axios.post(
      'https://fanyi-api.baidu.com/api/trans/vip/translate',
      null,
      {
        params: {
          q: text,
          from: sourceLang,
          to: targetLang,
          appid: appId,
          salt,
          sign
        },
        timeout: 10000
      }
    )

    if (response.data && response.data.trans_result && response.data.trans_result.length > 0) {
      const result = response.data.trans_result[0]
      const cleanedText = cleanTranslation(result.dst)
      return { success: true, text: cleanedText }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateVolcengine(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { accessKey, secretKey } = store.config.volcengine
  if (!accessKey || !secretKey) {
    return { success: false, error: '火山翻译API未配置' }
  }

  const service = 'translate'
  const host = 'open.volcengineapi.com'
  const region = 'cn-north-1'
  const action = 'TranslateText'
  const version = '2020-06-01'
  const timestamp = Math.floor(Date.now() / 1000)
  const nonce = Math.floor(Math.random() * 10000)

  const query: Record<string, string | number> = {
    Action: action,
    Version: version,
    Service: service,
    Region: region,
    Timestamp: timestamp,
    AccessKey: accessKey,
    Nonce: nonce,
    'Text.1': text,
    SourceLanguage: sourceLang,
    TargetLanguage: targetLang
  }

  const queryStr = Object.keys(query).sort().map(key => `${key}=${encodeURIComponent(String(query[key]))}`).join('&')
  const signStr = `GET\n${host}\n/\n${queryStr}`

  const keyBytes = new Uint8Array(secretKey.length)
  for (let i = 0; i < secretKey.length; i++) {
    keyBytes[i] = secretKey.charCodeAt(i)
  }

  const signatureBytes = await hmacSha256(keyBytes, signStr)
  const signature = Array.from(signatureBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  try {
    const response = await axios.get(`https://${host}/`, {
      params: {
        ...query,
        Signature: signature
      },
      timeout: 10000
    })

    if (response.data && response.data.Result && response.data.Result.Translation) {
      const cleanedText = cleanTranslation(response.data.Result.Translation)
      return { success: true, text: cleanedText }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateDoubao(text: string, _sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { apiKey } = store.config.doubao
  if (!apiKey) {
    return { success: false, error: '豆包翻译API未配置' }
  }

  try {
    const response = await axios.post(
      'https://api.doubao.com/v1/chat/completions',
      {
        model: 'doubao-pro',
        messages: [
          {
            role: 'system',
            content: `${TRANSLATION_PROMPT}\n目标语言：${targetLang === 'zh' || targetLang === 'zh-CN' || targetLang === 'zh-TW' ? '中文' : targetLang === 'en' ? 'English' : targetLang}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const translatedText = response.data.choices[0].message.content.trim()
      const cleanedText = cleanTranslation(translatedText)
      return { success: true, text: cleanedText }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateLibre(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const servers = [
    'https://libretranslate.de',
    'https://translate.argosopentech.com',
    'https://translate.fortytwo-it.com'
  ]
  
  for (const server of servers) {
    try {
      const response = await axios.post(
        `${server}/translate`,
        {
          q: text,
          source: sourceLang,
          target: targetLang
        },
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      if (response.data && response.data.translatedText) {
        const cleanedText = cleanTranslation(response.data.translatedText)
        return { success: true, text: cleanedText }
      }
    } catch (e) {
      console.warn(`LibreTranslate server ${server} failed:`, e)
      continue
    }
  }
  
  return { success: false, error: 'LibreTranslate不可用' }
}

async function translateLingva(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const servers = [
    'https://lingva.ml/api/v1',
    'https://lingva.lunar.icu/api/v1',
    'https://lingva.pussthecat.org/api/v1'
  ]
  
  for (const server of servers) {
    try {
      const response = await axios.get(
        `${server}/${sourceLang}/${targetLang}/${encodeURIComponent(text)}`,
        {
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }
      )

      if (response.data && response.data.translation) {
        const cleanedText = cleanTranslation(response.data.translation)
        return { success: true, text: cleanedText }
      }
    } catch (e) {
      console.warn(`Lingva server ${server} failed:`, e)
      continue
    }
  }
  
  return { success: false, error: 'Lingva翻译不可用' }
}

async function translateMyMemory(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const response = await axios.get(
      'https://api.mymemory.translated.net/get',
      {
        params: {
          q: text,
          langpair: `${sourceLang}|${targetLang}`
        },
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    )

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const cleanedText = cleanTranslation(response.data.responseData.translatedText)
      return { success: true, text: cleanedText }
    }
    return { success: false, error: 'MyMemory翻译失败' }
  } catch (error: any) {
    return { success: false, error: error.message || 'MyMemory翻译失败' }
  }
}

async function translateGoogle(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const proxies = [
      'https://api.allorigins.win/get?url=',
      'https://corsproxy.io/?url='
    ]
    
    for (const proxy of proxies) {
      try {
        const encodedUrl = encodeURIComponent(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`)
        const response = await axios.get(proxy + encodedUrl, {
          timeout: 5000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        let data = response.data
        if (typeof data === 'string') {
          data = JSON.parse(data)
        }
        
        let content = data.contents || data
        if (typeof content === 'string') {
          content = JSON.parse(content)
        }
        
        if (Array.isArray(content) && content.length > 0) {
          const resultArray = content[0]
          if (Array.isArray(resultArray)) {
            let translatedText = ''
            for (const item of resultArray) {
              if (Array.isArray(item) && item[0]) {
                translatedText += item[0]
              }
            }
            if (translatedText) {
              const cleanedText = cleanTranslation(translatedText)
              return { success: true, text: cleanedText }
            }
          }
        }
      } catch (e) {
        console.warn('Google proxy failed:', e)
        continue
      }
    }
    
    return { success: false, error: 'Google翻译不可用' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Google翻译失败' }
  }
}

function timeoutPromise<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout'))
    }, ms)
    promise.then(
      (res) => {
        clearTimeout(timer)
        resolve(res)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

async function translateFree(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const services = [
    { name: 'LibreTranslate', fn: translateLibre },
    { name: 'Lingva', fn: translateLingva },
    { name: 'MyMemory', fn: translateMyMemory },
    { name: 'Google', fn: translateGoogle }
  ]

  const promises = services.map(async (service) => {
    try {
      const result = await timeoutPromise(5000, service.fn(text, sourceLang, targetLang))
      if (result.success && result.text && result.text.trim()) {
        return { success: true, text: result.text, fromOffline: true }
      }
    } catch (error) {
      console.warn(`${service.name}翻译失败:`, error)
    }
    return null
  })

  const results = await Promise.allSettled(promises)
  
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value
    }
  }

  return { success: false, error: '所有免费翻译服务均不可用，请配置云端API密钥' }
}

export const supportedLanguages = [
  { code: 'auto', name: '自动检测' },
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'ru', name: 'Русский' },
  { code: 'pt', name: 'Português' },
  { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'vi', name: 'Tiếng Việt' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'th', name: 'ไทย' }
]

export async function translate(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  if (!text || !text.trim()) {
    return { success: true, text: '' }
  }

  const store = useAPIStore()

  if (store.isValid()) {
    try {
      let result: TranslateResult
      
      switch (store.currentProvider) {
        case 'volcengine':
          result = await translateVolcengine(text, sourceLang, targetLang)
          break
        case 'baidu':
          result = await translateBaidu(text, sourceLang, targetLang)
          break
        case 'doubao':
          result = await translateDoubao(text, sourceLang, targetLang)
          break
        default:
          result = await translateBaidu(text, sourceLang, targetLang)
      }

      if (result.success) {
        return { success: true, text: result.text }
      }

      console.log('云端翻译失败，自动切换免费翻译服务')
      const freeResult = await translateFree(text, sourceLang, targetLang)
      if (freeResult.success) {
        return { success: true, text: freeResult.text, fromOffline: true }
      }

      return result
    } catch (error: any) {
      console.log('云端翻译异常，自动切换免费翻译服务:', error.message)
      const freeResult = await translateFree(text, sourceLang, targetLang)
      if (freeResult.success) {
        return { success: true, text: freeResult.text, fromOffline: true }
      }
      return { success: false, text: '', error: error.message || '翻译失败，请检查网络或API密钥配置' }
    }
  }

  console.log('未配置API密钥，使用免费翻译服务')
  const freeResult = await translateFree(text, sourceLang, targetLang)
  if (freeResult.success) {
    return { success: true, text: freeResult.text, fromOffline: true }
  }
  return { success: false, text: '', error: freeResult.error || '所有翻译服务均不可用，请检查网络连接' }
}