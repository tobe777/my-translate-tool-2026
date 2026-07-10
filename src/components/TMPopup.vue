<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTMStore } from '@/stores/tmStore'
import { supportedLanguages } from '@/api/translate'
import { Search, Delete, Edit, Check } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const tmStore = useTMStore()
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedIds = ref<string[]>([])
const editingId = ref<string | null>(null)
const editingTarget = ref('')

const filteredItems = computed(() => {
  const items = tmStore.search(searchQuery.value)
  const start = (currentPage.value - 1) * pageSize.value
  return items.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(tmStore.search(searchQuery.value).length / pageSize.value))

function handleDelete(id: string) {
  ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tmStore.deleteItem(id)
    selectedIds.value = selectedIds.value.filter(i => i !== id)
    ElMessage.success('删除成功')
    if (filteredItems.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }).catch(() => {})
}

function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的记录')
    return
  }
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tmStore.batchDelete(selectedIds.value)
    selectedIds.value = []
    ElMessage.success('删除成功')
    if (filteredItems.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }).catch(() => {})
}

function handleClearAll() {
  ElMessageBox.confirm('确定要清空所有翻译记忆吗？此操作不可恢复。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tmStore.clearAll()
    selectedIds.value = []
    currentPage.value = 1
    ElMessage.success('已清空')
  }).catch(() => {})
}

function startEdit(item: any) {
  editingId.value = item.id
  editingTarget.value = item.target
}

function saveEdit(item: any) {
  if (!editingTarget.value.trim()) {
    ElMessage.warning('译文不能为空')
    return
  }
  tmStore.updateItem(item.id, editingTarget.value.trim())
  editingId.value = null
  editingTarget.value = ''
  ElMessage.success('修改成功')
}

function cancelEdit() {
  editingId.value = null
  editingTarget.value = ''
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
  editingId.value = null
}

function togglePriorityOverride() {
  tmStore.setPriorityOverride(!tmStore.priorityOverride)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="modal-mask" @click="handleClose">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>翻译记忆库</h3>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        
        <div class="modal-body">
          <div class="search-bar">
            <div class="search-input">
              <Search class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索原文或译文..."
                @input="currentPage = 1"
              />
            </div>
            <div class="search-right">
              <label class="switch-label">
                <input type="checkbox" :checked="tmStore.priorityOverride" @change="togglePriorityOverride" />
                <span class="switch-text">优先记忆译文覆盖接口结果</span>
              </label>
              <span class="total-count">共 {{ tmStore.search(searchQuery).length }} 条记录</span>
            </div>
          </div>
          
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th class="checkbox-column">
                    <input type="checkbox" :checked="selectedIds.length === filteredItems.length && filteredItems.length > 0" @change="selectAll" />
                  </th>
                  <th>原文</th>
                  <th>译文</th>
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
                  <td class="text-cell">
                    <div v-if="editingId === item.id" class="edit-cell">
                      <input v-model="editingTarget" type="text" class="edit-input" @keyup.enter="saveEdit(item)" />
                      <button class="edit-confirm" @click="saveEdit(item)"><Check /></button>
                      <button class="edit-cancel" @click="cancelEdit"><X /></button>
                    </div>
                    <span v-else>{{ item.target }}</span>
                  </td>
                  <td>{{ getLangName(item.sourceLang) }}</td>
                  <td>{{ getLangName(item.targetLang) }}</td>
                  <td>{{ new Date(item.createdAt).toLocaleString('zh-CN') }}</td>
                  <td>
                    <button class="edit-btn" @click="startEdit(item)">
                      <Edit class="btn-icon" />
                    </button>
                    <button class="delete-btn" @click="handleDelete(item.id)">
                      <Delete class="btn-icon" />
                    </button>
                  </td>
                </tr>
                <tr v-if="filteredItems.length === 0">
                  <td colspan="7" class="empty-row">暂无记录</td>
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
  max-width: 1000px;
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

.search-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  
  .search-input {
    flex: 1;
    max-width: 300px;
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
  
  .search-right {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .switch-label {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      
      input[type="checkbox"] {
        width: 40px;
        height: 20px;
        appearance: none;
        background: #DCDFE6;
        border-radius: 10px;
        position: relative;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &::before {
          content: '';
          position: absolute;
          width: 16px;
          height: 16px;
          background: #fff;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          transition: all 0.3s ease;
        }
        
        &:checked {
          background: #409EFF;
          
          &::before {
            left: 22px;
          }
        }
      }
      
      .switch-text {
        font-size: 13px;
        color: #606266;
      }
    }
    
    .total-count {
      font-size: 13px;
      color: #909399;
    }
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
  
  .edit-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    max-width: 200px;
    
    .edit-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid #409EFF;
      border-radius: 4px;
      font-size: 13px;
      outline: none;
    }
    
    .edit-confirm, .edit-cancel {
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s ease;
    }
    
    .edit-confirm {
      background: #67C23A;
      color: #fff;
      
      &:hover {
        background: #5EB83A;
      }
    }
    
    .edit-cancel {
      background: #F56C6C;
      color: #fff;
      
      &:hover {
        background: #E45656;
      }
    }
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
  
  .btn-icon {
    font-size: 14px;
  }
  
  &.btn-danger {
    background: #F56C6C;
    color: #fff;
    
    &:hover {
      background: #E45656;
    }
  }
}

.edit-btn, .delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  .btn-icon {
    font-size: 14px;
  }
}

.edit-btn {
  background: #ECF5FF;
  color: #409EFF;
  
  &:hover {
    background: #D9ECFF;
  }
}

.delete-btn {
  background: #FEF0F0;
  color: #F56C6C;
  
  &:hover {
    background: #FDE2E2;
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