<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCorpusStore } from '@/stores/corpusStore'
import { supportedLanguages } from '@/api/translate'
import { downloadCSV } from '@/utils/export'
import { Search, Plus, Delete, Download, Upload } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const corpusStore = useCorpusStore()
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref<string[]>([])

const showAddForm = ref(false)
const newSource = ref('')
const newTarget = ref('')
const newRemark = ref('')
const newSourceLang = ref('en')
const newTargetLang = ref('zh')

const fileInput = ref<HTMLInputElement | null>(null)

const filteredItems = computed(() => {
  const items = corpusStore.search(searchQuery.value)
  const start = (currentPage.value - 1) * pageSize.value
  return items.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(corpusStore.search(searchQuery.value).length / pageSize.value))

function handleAdd() {
  if (!newSource.value.trim() || !newTarget.value.trim()) {
    ElMessage.warning('请填写原文和译文')
    return
  }
  corpusStore.addItem(newSource.value.trim(), newTarget.value.trim(), newRemark.value.trim(), newSourceLang.value, newTargetLang.value)
  ElMessage.success('添加成功')
  resetForm()
}

function resetForm() {
  newSource.value = ''
  newTarget.value = ''
  newRemark.value = ''
  newSourceLang.value = 'en'
  newTargetLang.value = 'zh'
  showAddForm.value = false
}

function handleDelete(id: string) {
  ElMessageBox.confirm('确定要删除这条语料吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    corpusStore.deleteItem(id)
    selectedIds.value = selectedIds.value.filter(i => i !== id)
    ElMessage.success('删除成功')
    if (filteredItems.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }).catch(() => {})
}

function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的语料')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条语料吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    corpusStore.batchDelete(selectedIds.value)
    selectedIds.value = []
    ElMessage.success('删除成功')
    if (filteredItems.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }).catch(() => {})
}

function handleClearAll() {
  ElMessageBox.confirm('确定要清空所有语料吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    corpusStore.clearAll()
    selectedIds.value = []
    currentPage.value = 1
    ElMessage.success('已清空')
  }).catch(() => {})
}

function handleExport() {
  if (corpusStore.totalCount === 0) {
    ElMessage.warning('没有语料可导出')
    return
  }
  const content = corpusStore.exportCSV()
  downloadCSV(content, `语料库_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}.csv`)
}

function handleImport() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    try {
      const lines = content.split('\n').filter(line => line.trim())
      const items: { source: string; target: string; remark: string; sourceLang: string; targetLang: string }[] = []
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        const parts = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        if (parts.length >= 2) {
          items.push({
            source: parts[0].replace(/^"|"$/g, ''),
            target: parts[1].replace(/^"|"$/g, ''),
            remark: parts[2]?.replace(/^"|"$/g, '') || '',
            sourceLang: parts[3]?.replace(/^"|"$/g, '') || 'en',
            targetLang: parts[4]?.replace(/^"|"$/g, '') || 'zh'
          })
        }
      }
      
      corpusStore.addItems(items)
      ElMessage.success(`成功导入 ${items.length} 条语料`)
      currentPage.value = 1
    } catch {
      ElMessage.error('导入失败，请检查CSV格式')
    }
  }
  reader.readAsText(file, 'utf-8')
  target.value = ''
}

function toggleSelect(id: string) {
  const index = selectedIds.value.indexOf(id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function selectAll() {
  if (selectedIds.value.length === filteredItems.value.length) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredItems.value.map(item => item.id)
  }
}

function getLangName(code: string): string {
  return supportedLanguages.find(l => l.code === code)?.name || code
}

function handleClose() {
  emit('update:visible', false)
  searchQuery.value = ''
  currentPage.value = 1
  selectedIds.value = []
  resetForm()
}

function toggleForceReplace() {
  corpusStore.setForceReplace(!corpusStore.forceReplace)
}

function toggleEnableMatch() {
  corpusStore.setEnableMatch(!corpusStore.enableMatch)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="modal-mask" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>自定义语料库</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        
        <div class="modal-body">
          <div class="toolbar">
            <div class="search-input">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索原文、译文或备注..."
                @input="currentPage = 1"
              />
            </div>
            <div class="toolbar-switches">
              <label class="switch-label">
                <input type="checkbox" :checked="corpusStore.enableMatch" @change="toggleEnableMatch" />
                <span>启用术语匹配</span>
              </label>
              <label class="switch-label">
                <input type="checkbox" :checked="corpusStore.forceReplace" @change="toggleForceReplace" />
                <span>全局强制替换</span>
              </label>
            </div>
            <div class="toolbar-actions">
              <button class="action-btn" @click="showAddForm = !showAddForm">
                <Plus class="btn-icon" />
                添加
              </button>
              <button class="action-btn" @click="handleImport">
                <Upload class="btn-icon" />
                导入CSV
              </button>
              <button class="action-btn" @click="handleExport">
                <Download class="btn-icon" />
                导出CSV
              </button>
            </div>
            <span class="total-count">共 {{ corpusStore.search(searchQuery).length }} 条</span>
          </div>
          
          <Transition name="slide-up">
            <div v-if="showAddForm" class="add-form">
              <div class="form-row">
                <div class="form-item">
                  <label>原文</label>
                  <input v-model="newSource" type="text" placeholder="请输入原文" />
                </div>
                <div class="form-item">
                  <label>译文</label>
                  <input v-model="newTarget" type="text" placeholder="请输入译文" />
                </div>
                <div class="form-item">
                  <label>备注</label>
                  <input v-model="newRemark" type="text" placeholder="可选，添加备注说明" />
                </div>
                <div class="form-item">
                  <label>源语言</label>
                  <select v-model="newSourceLang">
                    <option v-for="lang in supportedLanguages" :key="lang.code" :value="lang.code">
                      {{ lang.name }}
                    </option>
                  </select>
                </div>
                <div class="form-item">
                  <label>目标语言</label>
                  <select v-model="newTargetLang">
                    <option v-for="lang in supportedLanguages" :key="lang.code" :value="lang.code">
                      {{ lang.name }}
                    </option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn btn-primary" @click="handleAdd">确认添加</button>
                <button class="btn btn-default" @click="resetForm">取消</button>
              </div>
            </div>
          </Transition>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="checkbox-column">
                    <input type="checkbox" :checked="selectedIds.length === filteredItems.length && filteredItems.length > 0" @change="selectAll" />
                  </th>
                  <th>原文</th>
                  <th>译文</th>
                  <th>备注</th>
                  <th>源语言</th>
                  <th>目标语言</th>
                  <th>时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredItems" :key="item.id">
                  <td class="checkbox-column">
                    <input type="checkbox" :checked="selectedIds.includes(item.id)" @change="toggleSelect(item.id)" />
                  </td>
                  <td class="text-cell">{{ item.source }}</td>
                  <td class="text-cell">{{ item.target }}</td>
                  <td class="text-cell">{{ item.remark || '-' }}</td>
                  <td>{{ getLangName(item.sourceLang) }}</td>
                  <td>{{ getLangName(item.targetLang) }}</td>
                  <td>{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</td>
                  <td>
                    <button class="delete-btn" @click="handleDelete(item.id)">
                      <Delete class="btn-icon" />
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredItems.length === 0">
                  <td colspan="8" class="empty-row">暂无语料，点击上方「添加」按钮添加</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="pagination">
            <button
              class="page-btn"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              上一页
            </button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="page-btn"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
            </button>
            <select v-model="pageSize" class="page-size-select" @change="currentPage = 1">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
            </select>
          </div>
        </div>
        
        <div class="modal-footer">
          <button v-if="selectedIds.length > 0" class="btn btn-danger" @click="handleBatchDelete">
            <Delete class="btn-icon" />
            批量删除 ({{ selectedIds.length }})
          </button>
          <button class="btn btn-danger" @click="handleClearAll">
            <Delete class="btn-icon" />
            清空全部
          </button>
        </div>
        
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          class="hidden-input"
          @change="handleFileChange"
        />
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
  max-width: 1100px;
  max-height: 80vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  
  .search-input {
    flex: 1;
    max-width: 280px;
    display: flex;
    align-items: center;
    border: 1px solid #DCDFE6;
    border-radius: 6px;
    overflow: hidden;
    
    .search-icon {
      margin: 0 10px;
      font-size: 14px;
      color: #909399;
    }
    
    input {
      flex: 1;
      padding: 10px 12px;
      border: none;
      font-size: 14px;
      color: #303133;
      
      &::placeholder {
        color: #C0C4CC;
      }
      
      &:focus {
        outline: none;
      }
    }
    
    &:focus-within {
      border-color: #409EFF;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
  
  .toolbar-switches {
    display: flex;
    gap: 16px;
    
    .switch-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      
      input[type="checkbox"] {
        width: 36px;
        height: 18px;
        appearance: none;
        background: #DCDFE6;
        border-radius: 9px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &::before {
          content: '';
          position: absolute;
          width: 14px;
          height: 14px;
          background: #fff;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
        }
        
        &:checked {
          background: #409EFF;
          
          &::before {
            left: 20px;
          }
        }
      }
      
      span {
        font-size: 13px;
        color: #606266;
      }
    }
  }
  
  .toolbar-actions {
    display: flex;
    gap: 8px;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 14px;
    border: 1px solid #DCDFE6;
    background: #fff;
    border-radius: 6px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
    
    .btn-icon {
      font-size: 14px;
    }
    
    &:hover {
      border-color: #409EFF;
      color: #409EFF;
    }
  }
  
  .total-count {
    font-size: 13px;
    color: #909399;
  }
}

.add-form {
  padding: 16px;
  background: #F5F7FA;
  border-radius: 6px;
  margin-bottom: 16px;
  
  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  
  .form-item {
    flex: 1;
    min-width: 150px;
    
    label {
      display: block;
      font-size: 13px;
      color: #606266;
      margin-bottom: 6px;
    }
    
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #DCDFE6;
      border-radius: 6px;
      font-size: 14px;
      color: #303133;
      background: #fff;
      
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
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.table-container {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid #E4E7ED;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #E4E7ED;
    font-size: 13px;
  }
  
  th {
    background: #F5F7FA;
    font-weight: 600;
    color: #606266;
    white-space: nowrap;
  }
  
  td {
    color: #303133;
  }
  
  .checkbox-column {
    width: 40px;
    text-align: center;
    
    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  }
  
  .text-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .empty-row {
    text-align: center;
    color: #C0C4CC;
    padding: 40px;
  }
  
  tr:hover {
    background: #F5F7FA;
  }
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  .btn-icon {
    font-size: 16px;
    color: #F56C6C;
  }
  
  &:hover {
    background: #FEF0F0;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  
  .page-btn {
    padding: 6px 16px;
    border: 1px solid #DCDFE6;
    background: #fff;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      border-color: #409EFF;
      color: #409EFF;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .page-info {
    font-size: 13px;
    color: #909399;
  }
  
  .page-size-select {
    padding: 6px 12px;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    background: #fff;
    cursor: pointer;
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  background: #F5F7FA;
  border-top: 1px solid #E4E7ED;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
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
  
  &.btn-danger {
    background: #F56C6C;
    color: #fff;
    
    &:hover {
      background: #E45656;
    }
  }
}

.hidden-input {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>