<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'

const emit = defineEmits<{
  (e: 'open-tm'): void
  (e: 'open-corpus'): void
  (e: 'open-api'): void
}>()

const themeStore = useThemeStore()
</script>

<template>
  <nav class="navbar">
    <div class="navbar-left">
      <span class="navbar-icon">📖</span>
      <span class="navbar-title">翻译工作台</span>
    </div>
    
    <div class="navbar-right">
      <button class="nav-btn" @click="emit('open-tm')">
        📝 记忆库
      </button>
      <button class="nav-btn" @click="emit('open-corpus')">
        📚 语料库
      </button>
      <button class="nav-btn" @click="emit('open-api')">
        ⚙️ 配置
      </button>
      <button 
        class="nav-btn theme-btn"
        @click="themeStore.toggle"
        :title="themeStore.mode === 'light' ? '切换暗色' : '切换亮色'"
      >
        {{ themeStore.mode === 'light' ? '🌙' : '☀️' }}
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.navbar {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #E4E7ED;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-left {
  display: flex;
  align-items: center;
}

.navbar-icon {
  font-size: 20px;
  margin-right: 8px;
}

.navbar-title {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #E8F4FF;
    color: #409EFF;
  }
}

.theme-btn {
  width: 36px;
  height: 36px;
  font-size: 18px;
}

.dark & {
  background: #16213e;
  border-bottom-color: #2a2a4a;
  
  .navbar-title {
    color: #409EFF;
  }
  
  .nav-btn {
    color: #b8b8d0;
    
    &:hover {
      background: #2a2a4a;
      color: #66B1FF;
    }
  }
}
</style>