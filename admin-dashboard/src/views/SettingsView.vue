<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { changePassword } from '@/api/auth'
import { get, post, put } from '@/api/system'
import type { AdminUser, CreateAdminRequest, PaginatedData, ChangePasswordRequest } from '@/types'

const authStore = useAuthStore()

// ---- 修改密码 ----
const pwdFormRef = ref()
const pwdForm = reactive<ChangePasswordRequest>({ old_password: '', new_password: '' })
const pwdLoading = ref(false)

const pwdRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
}

async function handleChangePwd() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  pwdLoading.value = true
  try {
    await changePassword({ old_password: pwdForm.old_password, new_password: pwdForm.new_password })
    ElMessage.success('密码修改成功')
    pwdForm.old_password = ''
    pwdForm.new_password = ''
  } catch { ElMessage.error('密码修改失败') }
  finally { pwdLoading.value = false }
}

// ---- 管理员管理 ----
const admins = ref<AdminUser[]>([])
const adminTotal = ref(0)
const createDialogVisible = ref(false)
const createFormRef = ref()
const createForm = reactive<CreateAdminRequest>({ username: '', password: '', display_name: '', role: 'admin' })
const createLoading = ref(false)

async function fetchAdmins(page = 1) {
  try {
    const res = await get<PaginatedData<AdminUser>>('/api/admin/accounts', { page, page_size: 20 })
    admins.value = res.data.items
    adminTotal.value = res.data.total
  } catch { /* */ }
}

async function handleCreateAdmin() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  createLoading.value = true
  try {
    await post('/api/admin/accounts', createForm as unknown as Record<string, unknown>)
    ElMessage.success('管理员创建成功')
    createDialogVisible.value = false
    createForm.username = ''
    createForm.password = ''
    createForm.display_name = ''
    createForm.role = 'admin'
    fetchAdmins()
  } catch { ElMessage.error('创建失败') }
  finally { createLoading.value = false }
}

async function handleToggleAdmin(row: AdminUser) {
  try {
    await put(`/api/admin/accounts/${row.id}/status`)
    ElMessage.success(row.is_active ? '已禁用' : '已启用')
    fetchAdmins()
  } catch { ElMessage.error('操作失败') }
}

onMounted(() => {
  if (authStore.isSuperAdmin) fetchAdmins()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header"><h2>管理员设置</h2></div>

    <!-- 修改密码 -->
    <div class="table-card" style="margin-bottom: 20px;">
      <h3 style="margin-bottom: 16px; font-size: 16px;">修改密码</h3>
      <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px" style="max-width: 400px;">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="pwdForm.old_password" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="pwdForm.new_password" type="password" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="pwdLoading" @click="handleChangePwd">确认修改</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 管理员管理（仅 super_admin） -->
    <div v-if="authStore.isSuperAdmin" class="table-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="font-size: 16px;">管理员账号管理</h3>
        <el-button type="primary" @click="createDialogVisible = true">创建管理员</el-button>
      </div>

      <el-table :data="admins" stripe>
        <el-table-column prop="username" label="用户名" width="140" />
        <el-table-column prop="display_name" label="显示名称" width="140" />
        <el-table-column label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super_admin' ? 'danger' : 'info'" size="small">
              {{ row.role === 'super_admin' ? '超级管理员' : '管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="170" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.is_active ? 'danger' : 'success'"
              @click="handleToggleAdmin(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建管理员对话框 -->
    <el-dialog v-model="createDialogVisible" title="创建管理员" width="460px">
      <el-form ref="createFormRef" :model="createForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="createForm.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="createForm.password" type="password" placeholder="初始密码" show-password />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="createForm.display_name" placeholder="可选" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="createForm.role" style="width: 100%;">
            <el-option label="管理员" value="admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreateAdmin">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>
