import axios from 'axios'
import { useAPIStore } from '@/stores/apiStore'
import { translateFromDict } from '@/utils/offlineTranslator'

export interface TranslateResult {
  success: boolean
  text?: string
  error?: string
  debugInfo?: any
  fromOffline?: boolean
  fromModel?: boolean
  fromFree?: boolean
}

async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacSha256(key: Uint8Array, data: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', key.buffer as ArrayBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const buffer = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
  return new Uint8Array(buffer)
}

function md5Hex(data: string): Promise<string> {
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
      return { success: true, text: result.dst }
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
      return { success: true, text: response.data.Result.Translation }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateYoudao(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { appId, appKey } = store.config.youdao
  if (!appId || !appKey) {
    return { success: false, error: '有道翻译API未配置' }
  }

  const salt = Date.now().toString()
  const curtime = Math.floor(Date.now() / 1000).toString()
  const signStr = `${appId}${text}${salt}${curtime}${appKey}`
  const sign = await sha256Hex(signStr)

  try {
    const response = await axios.post(
      'https://openapi.youdao.com/api',
      null,
      {
        params: {
          q: text,
          from: sourceLang,
          to: targetLang,
          appKey: appId,
          salt,
          sign,
          signType: 'v3',
          curtime
        },
        timeout: 10000
      }
    )

    if (response.data && response.data.translation && response.data.translation.length > 0) {
      return { success: true, text: response.data.translation[0] }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateIflytek(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { accessKey, secretKey } = store.config.iflytek
  if (!accessKey || !secretKey) {
    return { success: false, error: '讯飞翻译API未配置' }
  }

  const curTime = Date.now().toString()
  const signStr = `${accessKey}${curTime}${secretKey}`
  const sign = await md5Hex(signStr)

  try {
    const response = await axios.post(
      'http://api.fanyi.baidu.com/api/trans/vip/translate',
      null,
      {
        params: {
          q: text,
          from: sourceLang,
          to: targetLang,
          appid: accessKey,
          salt: Date.now().toString(),
          sign
        },
        timeout: 10000
      }
    )

    if (response.data && response.data.trans_result && response.data.trans_result.length > 0) {
      return { success: true, text: response.data.trans_result[0].dst }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateDeepl(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const store = useAPIStore()
  const { authKey } = store.config.deepl
  if (!authKey) {
    return { success: false, error: 'DeepL翻译API未配置' }
  }

  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      {
        text: [text],
        source_lang: sourceLang.toUpperCase(),
        target_lang: targetLang.toUpperCase()
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${authKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    if (response.data && response.data.translations && response.data.translations.length > 0) {
      return { success: true, text: response.data.translations[0].text }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

async function translateDoubao(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
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
            content: `你是一个翻译助手，请将以下${sourceLang === 'zh' ? '中文' : '英文'}翻译成${targetLang === 'zh' ? '中文' : '英文'}，只输出翻译结果，不要包含任何解释或其他内容。`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500
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
      return { success: true, text: response.data.choices[0].message.content.trim() }
    }
    return { success: false, error: '翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || '翻译失败' }
  }
}

function isValidTranslation(text: string, targetLang: string): boolean {
  if (!text || !text.trim()) return false
  
  if (targetLang === 'zh' || targetLang === 'zh-CN' || targetLang === 'zh-TW') {
    return /[\u4e00-\u9fa5]/.test(text)
  }
  
  if (targetLang === 'ja') {
    return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(text) || /[a-zA-Z]/.test(text)
  }
  
  if (targetLang === 'ko') {
    return /[\uac00-\ud7af]/.test(text) || /[a-zA-Z]/.test(text)
  }
  
  if (targetLang === 'ar') {
    return /[\u0600-\u06ff]/.test(text)
  }
  
  if (targetLang === 'th') {
    return /[\u0e00-\u0e7f]/.test(text)
  }
  
  return true
}

async function translateMyMemory(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const srcLang = sourceLang === 'auto' ? 'en' : sourceLang
    const tgtLang = targetLang === 'zh' ? 'zh-CN' : targetLang
    const langpair = `${srcLang}|${tgtLang}`
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: langpair
      },
      timeout: 5000
    })

    if (response.data && response.data.responseData && response.data.responseData.translatedText) {
      const translatedText = response.data.responseData.translatedText
      if (isValidTranslation(translatedText, targetLang)) {
        return { success: true, text: translatedText }
      }
      return { success: false, error: 'MyMemory翻译结果无效' }
    }
    return { success: false, error: 'MyMemory翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || 'MyMemory翻译服务不可用' }
  }
}

async function translateLibre(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const response = await axios.post('https://libretranslate.de/translate', {
      q: text,
      source: sourceLang === 'auto' ? 'en' : sourceLang,
      target: targetLang,
      format: 'text'
    }, {
      timeout: 5000
    })

    if (response.data && response.data.translatedText) {
      const translatedText = response.data.translatedText
      if (isValidTranslation(translatedText, targetLang)) {
        return { success: true, text: translatedText }
      }
      return { success: false, error: 'Libre翻译结果无效' }
    }
    return { success: false, error: 'Libre翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Libre翻译服务不可用' }
  }
}

async function translateLingva(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const response = await axios.get('https://lingva.ml/api/v1/' + sourceLang + '/' + targetLang + '/' + encodeURIComponent(text), {
      timeout: 5000
    })

    if (response.data && response.data.translation) {
      const translatedText = response.data.translation
      if (isValidTranslation(translatedText, targetLang)) {
        return { success: true, text: translatedText }
      }
      return { success: false, error: 'Lingva翻译结果无效' }
    }
    return { success: false, error: 'Lingva翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Lingva翻译服务不可用' }
  }
}

async function translateTranslateCom(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  try {
    const response = await axios.get('https://api.translate.com/translate', {
      params: {
        from: sourceLang === 'auto' ? 'en' : sourceLang,
        to: targetLang,
        text: text
      },
      timeout: 5000
    })

    if (response.data && response.data.translatedText) {
      const translatedText = response.data.translatedText
      if (isValidTranslation(translatedText, targetLang)) {
        return { success: true, text: translatedText }
      }
      return { success: false, error: 'Translate.com翻译结果无效' }
    }
    return { success: false, error: 'Translate.com翻译结果为空' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Translate.com翻译服务不可用' }
  }
}

async function translateFree(text: string, sourceLang: string, targetLang: string): Promise<TranslateResult> {
  const translators = [
    { fn: translateLingva, name: 'Lingva' },
    { fn: translateLibre, name: 'Libre' },
    { fn: translateMyMemory, name: 'MyMemory' },
    { fn: translateTranslateCom, name: 'TranslateCom' }
  ]

  const promises = translators.map(({ fn, name }) => 
    fn(text, sourceLang, targetLang).then(result => {
      if (result.success && result.text && isValidTranslation(result.text, targetLang)) {
        return { success: true, text: result.text, source: name }
      }
      throw new Error(`${name} failed`)
    }).catch(() => {
      throw new Error(`${name} failed`)
    })
  )

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new Error('All translators timed out')), 8000)
  )

  try {
    const result = await Promise.race([Promise.any(promises), timeoutPromise])
    return { success: true, text: result.text }
  } catch (errors) {
    console.log('所有免费翻译服务均不可用或超时:', errors)
    return { success: false, error: '所有免费翻译服务均不可用' }
  }
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
        case 'youdao':
          result = await translateYoudao(text, sourceLang, targetLang)
          break
        case 'iflytek':
          result = await translateIflytek(text, sourceLang, targetLang)
          break
        case 'deepl':
          result = await translateDeepl(text, sourceLang, targetLang)
          break
        case 'doubao':
          result = await translateDoubao(text, sourceLang, targetLang)
          break
        default:
          result = await translateBaidu(text, sourceLang, targetLang)
      }

      if (result.success) {
        return { success: true, text: result.text, fromOffline: false, fromModel: false }
      }

      console.log('云端翻译失败，尝试免费翻译服务')
      const freeResult = await translateFree(text, sourceLang, targetLang)
      if (freeResult.success) {
        return { success: true, text: freeResult.text, fromOffline: false, fromModel: false, fromFree: true }
      }

      return result
    } catch (error: any) {
      console.error('翻译异常:', error)
      
      console.log('网络异常，尝试免费翻译服务')
      const freeResult = await translateFree(text, sourceLang, targetLang)
      if (freeResult.success) {
        return { success: true, text: freeResult.text, fromOffline: false, fromModel: false, fromFree: true }
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
        const dictResult = translateFromDict(text, sourceLang, targetLang)
        if (dictResult.success && dictResult.text) {
          return { success: true, text: dictResult.text, fromOffline: true, fromModel: false }
        }
        return { success: false, text: '', error: '⚠️ 网络连接失败，离线词典已启用' }
      }

      return { success: false, text: '', error: error.message || '翻译失败' }
    }
  }

  try {
    console.log('未配置API密钥，使用免费翻译服务')
    const freeResult = await translateFree(text, sourceLang, targetLang)
    if (freeResult.success) {
      return { success: true, text: freeResult.text, fromOffline: false, fromModel: false, fromFree: true }
    }

    console.log('免费翻译服务失败，尝试离线词典')
    const dictResult = translateFromDict(text, sourceLang, targetLang)
    if (dictResult.success && dictResult.text) {
      return { success: true, text: dictResult.text, fromOffline: true, fromModel: false }
    }

    return { success: false, text: '', error: '⚠️ 翻译服务不可用，请检查网络连接或配置API密钥' }
  } catch (error: any) {
    console.error('翻译异常:', error)
    
    const dictResult = translateFromDict(text, sourceLang, targetLang)
    if (dictResult.success && dictResult.text) {
      return { success: true, text: dictResult.text, fromOffline: true, fromModel: false }
    }

    return { success: false, text: '', error: '⚠️ 网络异常，请检查网络连接' }
  }
}