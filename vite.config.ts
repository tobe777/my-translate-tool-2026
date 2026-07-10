import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'element-plus', 'pinia']
        }
      }
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api/volcengine': {
        target: 'https://translate.volcengineapi.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/volcengine/, ''),
        headers: {
          'Host': 'translate.volcengineapi.com',
          'Origin': 'https://translate.volcengineapi.com',
          'Referer': 'https://translate.volcengineapi.com',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Connection', 'keep-alive')
          })
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Date, Authorization, Host')
          })
        }
      },
      '/api/baidu': {
        target: 'https://fanyi-api.baidu.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/baidu/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/youdao': {
        target: 'https://openapi.youdao.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/youdao/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/iflytek': {
        target: 'https://api.fanyi.volcengine.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/iflytek/, ''),
        headers: {
          'Host': 'api.fanyi.volcengine.com',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/deepl': {
        target: 'https://api.deepl.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/deepl/, '/v2'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/doubao': {
        target: 'https://open-api.bytedance.net',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/doubao/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/google': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/google/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/libre': {
        target: 'https://libretranslate.de',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/libre/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      },
      '/api/translatefree': {
        target: 'https://api.translatefree.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/translatefree/, ''),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    },
    timeout: 30000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-Date', 'Authorization', 'Host']
    }
  }
})