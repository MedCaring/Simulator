<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUsers, getUserDetail, toggleUserStatus, exportUsers } from '@/api/users'
import type { WechatUser, UserQuery } from '@/types'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const users = ref<WechatUser[]>([])
const total = ref(0)
const loading = ref(false)
const detailVisible = ref(false)
const detailUser = ref<WechatUser | null>(null)
const selectedRows = ref<WechatUser[]>([])

const query = reactive<UserQuery>({
  page: 1,
  page_size: 20,
  nickname: '',
  phone: '',
  gender: undefined,
  date_from: route.query.date_from as string || '',
  date_to: route.query.date_to as string || '',
  has_device: undefined,
  is_active: undefined,
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers(query)
    users.value = res.data.items
    total.value = res.data.total
  } catch { /* API 未就绪 */ }
  finally { loading.value = false }
}

async function openDetail(row: WechatUser) {
  detailVisible.value = true
  try {
    const res = await getUserDetail(row.id)
    detailUser.value = res.data
  } catch { detailUser.value = row }
}

async function handleToggleStatus(row: WechatUser) {
  try {
    await toggleUserStatus(row.id)
    ElMessage.success(row.is_active ? '已禁用' : '已启用')
    fetchUsers()
  } catch { ElMessage.error('操作失败') }
}

async function handleExport() {
  try {
    await exportUsers(query)
    ElMessage.success('导出成功')
  } catch { ElMessage.error('导出失败') }
}

function handlePageChange(page: number) {
  query.page = page
  fetchUsers()
}

function handleSearch() {
  query.page = 1
  fetchUsers()
}

function genderLabel(g: number): string {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '未知'
}

// Open detail from URL query param (e.g. /users?id=123)
function checkUrlDetail() {
  const id = route.query.id
  if (id) {
    const uid = Number(id)
    if (!isNaN(uid)) {
      openDetail({ id: uid } as WechatUser)
    }
  }
}

watch(() => route.query.id, (newId) => {
  if (newId) {
    const uid = Number(newId)
    if (!isNaN(uid)) openDetail({ id: uid } as WechatUser)
  }
})

onMounted(() => {
  fetchUsers()
  checkUrlDetail()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header"><h2>用户管理</h2></div>

    <!-- 筛选 -->
    <div class="table-card">
      <div class="filter-bar">
        <el-input v-model="query.nickname" placeholder="昵称搜索" clearable style="width: 180px" @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-input v-model="query.phone" placeholder="手机搜索" clearable style="width: 160px" @clear="handleSearch" @keyup.enter="handleSearch" />
        <el-select v-model="query.gender" placeholder="性别" clearable style="width: 100px" @change="handleSearch">
          <el-option label="男" :value="1" />
          <el-option label="女" :value="2" />
        </el-select>
        <el-date-picker
          v-model="query.date_from"
          type="date"
          placeholder="注册开始"
          style="width: 150px"
          value-format="YYYY-MM-DD"
          @change="handleSearch"
        />
        <el-date-picker
          v-model="query.date_to"
          type="date"
          placeholder="注册结束"
          style="width: 150px"
          value-format="YYYY-MM-DD"
          @change="handleSearch"
        />
        <el-select v-model="query.is_active" placeholder="状态" clearable style="width: 100px" @change="handleSearch">
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleExport" :disabled="selectedRows.length === 0">导出 CSV</el-button>
      </div>

      <!-- 表格 -->
      <el-table
        :data="users"
        stripe
        v-loading="loading"
        @row-click="openDetail"
        style="cursor: pointer;"
        @selection-change="(rows: WechatUser[]) => selectedRows = rows"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column label="头像" width="60">
          <template #default="{ row }">
            <el-avatar :src="row.avatar_url" :size="32" />
          </template>
        </el-table-column>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机" width="130" />
        <el-table-column label="性别" width="60">
          <template #default="{ row }">{{ genderLabel(row.gender) }}</template>
        </el-table-column>
        <el-table-column label="设备ID" width="150">
          <template #default="{ row }">{{ row.profile?.hardware_device_id || '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="170" />
        <el-table-column prop="last_active_at" label="最近活跃" width="170" />
        <el-table-column label="发送交互" width="90">
          <template #default="{ row }">{{ row.interaction_stats?.sent_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="接收交互" width="90">
          <template #default="{ row }">{{ row.interaction_stats?.received_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.is_active ? 'danger' : 'success'"
              @click.stop="handleToggleStatus(row)"
            >
              {{ row.is_active ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top: 16px; justify-content: flex-end;"
        layout="total, prev, pager, next"
        :total="total"
        :page-size="query.page_size"
        :current-page="query.page"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 用户详情抽屉 -->
    <el-drawer v-model="detailVisible" title="用户详情" size="480px">
      <template v-if="detailUser">
        <el-descriptions title="基本信息" :column="2" border>
          <el-descriptions-item label="昵称">{{ detailUser.nickname }}</el-descriptions-item>
          <el-descriptions-item label="OpenID">{{ detailUser.openid }}</el-descriptions-item>
          <el-descriptions-item label="手机">{{ detailUser.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ genderLabel(detailUser.gender) }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="Profile" :column="2" border style="margin-top: 16px;">
          <el-descriptions-item label="Bio">{{ detailUser.profile?.bio || '-' }}</el-descriptions-item>
          <el-descriptions-item label="爱好">{{ detailUser.profile?.hobbies || '-' }}</el-descriptions-item>
          <el-descriptions-item label="兴趣">{{ detailUser.profile?.interests || '-' }}</el-descriptions-item>
          <el-descriptions-item label="设备ID">{{ detailUser.profile?.hardware_device_id || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions title="交互统计" :column="2" border style="margin-top: 16px;">
          <el-descriptions-item label="发送总数">{{ detailUser.interaction_stats?.sent_count ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="接收总数">{{ detailUser.interaction_stats?.received_count ?? 0 }}</el-descriptions-item>
          <el-descriptions-item label="互动对象数">{{ detailUser.interaction_stats?.partner_count ?? 0 }}</el-descriptions-item>
        </el-descriptions>

        <div style="margin-top: 16px;">
          <el-button type="primary" @click="detailVisible = false; router.push(`/social-network/${detailUser.id}`)">查看社交网络</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>
