<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInteractions, getInteractionStats } from '@/api/interactions'
import { getUserDetail } from '@/api/users'
import type { Interaction, InteractionQuery, InteractionStatsData, WechatUser } from '@/types'
import StatCard from '@/components/StatCard.vue'

const route = useRoute()
const router = useRouter()

const interactions = ref<Interaction[]>([])
const total = ref(0)
const loading = ref(false)
const stats = ref<InteractionStatsData | null>(null)
const statsVisible = ref(true)
const autoRefresh = ref(false)
const activeTab = ref<string>(route.query.tab === 'active' ? 'active' : 'logs')
let refreshTimer: ReturnType<typeof setInterval> | null = null

// User detail drawer
const detailVisible = ref(false)
const detailUser = ref<WechatUser | null>(null)

const query = reactive<InteractionQuery>({
  page: 1,
  page_size: 20,
  from_user: '',
  to_user: '',
  interaction_type: [],
  device_id: '',
  date_from: '',
  date_to: '',
})

const activeCollapseNames = computed(() => statsVisible.value ? ['stats'] : [])

watch(activeTab, (val) => {
  const tabQuery = val === 'active' ? 'active' : undefined
  if (route.query.tab !== (tabQuery || '')) {
    router.replace({ query: { ...route.query, tab: tabQuery || undefined } })
  }
})

async function openDetail(id: number) {
  detailVisible.value = true
  try {
    const res = await getUserDetail(id)
    detailUser.value = res.data
  } catch { detailUser.value = null }
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    click: '点击', double_click: '双击', long_contact: '长联系', internal_hook: '内部触发',
  }
  return map[t] || t
}

function typeTag(t: string): 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
    click: 'success', double_click: 'warning', long_contact: 'danger', internal_hook: 'info',
  }
  return map[t] || 'info'
}

async function fetchInteractions() {
  loading.value = true
  try {
    const res = await getInteractions(query)
    interactions.value = res.data.items
    total.value = res.data.total
  } catch { /* API 未就绪 */ }
  finally { loading.value = false }
}

async function fetchStats() {
  try {
    const res = await getInteractionStats()
    stats.value = res.data
  } catch { /* */ }
}

function handleSearch() {
  query.page = 1
  fetchInteractions()
}

function handlePageChange(page: number) {
  query.page = page
  fetchInteractions()
}

function toggleAutoRefresh() {
  if (autoRefresh.value) {
    refreshTimer = setInterval(fetchInteractions, 10000)
  } else {
    if (refreshTimer) clearInterval(refreshTimer)
  }
}

function genderLabel(g: number): string {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '未知'
}

onMounted(() => {
  fetchInteractions()
  fetchStats()
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2>交互监控</h2>
      <el-switch v-model="autoRefresh" active-text="自动刷新(10s)" @change="toggleAutoRefresh" />
    </div>

    <el-tabs v-model="activeTab" style="margin-bottom: 16px;">
      <!-- Tab 1: 交互日志 -->
      <el-tab-pane label="交互日志" name="logs">
        <!-- 统计面板 -->
        <el-collapse v-model="activeCollapseNames" style="margin-bottom: 16px;">
          <el-collapse-item name="stats" title="交互统计">
            <template v-if="stats">
              <div class="stat-row">
                <StatCard title="今日交互" :value="stats.today_count" icon="Connection" color="#409eff" />
                <StatCard title="本周交互" :value="stats.week_count" icon="TrendCharts" color="#67c23a" />
                <StatCard title="本月交互" :value="stats.month_count" icon="DataAnalysis" color="#e6a23c" />
              </div>
            </template>
          </el-collapse-item>
        </el-collapse>

        <!-- 筛选 -->
        <div class="table-card">
          <div class="filter-bar">
            <el-input v-model="query.from_user" placeholder="发起方" clearable style="width: 140px" @clear="handleSearch" @keyup.enter="handleSearch" />
            <el-input v-model="query.to_user" placeholder="接收方" clearable style="width: 140px" @clear="handleSearch" @keyup.enter="handleSearch" />
            <el-select v-model="query.interaction_type" placeholder="交互类型" multiple clearable style="width: 220px" @change="handleSearch">
              <el-option label="点击" value="click" />
              <el-option label="双击" value="double_click" />
              <el-option label="长联系" value="long_contact" />
              <el-option label="内部触发" value="internal_hook" />
            </el-select>
            <el-input v-model="query.device_id" placeholder="设备ID" clearable style="width: 140px" @clear="handleSearch" @keyup.enter="handleSearch" />
            <el-date-picker
              v-model="query.date_from" type="datetime" placeholder="开始时间"
              style="width: 180px" value-format="YYYY-MM-DD HH:mm:ss" @change="handleSearch"
            />
            <el-date-picker
              v-model="query.date_to" type="datetime" placeholder="结束时间"
              style="width: 180px" value-format="YYYY-MM-DD HH:mm:ss" @change="handleSearch"
            />
            <el-button type="primary" @click="handleSearch">搜索</el-button>
          </div>

          <!-- 表格 -->
          <el-table :data="interactions" stripe v-loading="loading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="created_at" label="时间" width="170" />
            <el-table-column label="发起方" width="130">
              <template #default="{ row }">
                <el-link v-if="row.from_user" type="primary" :underline="false" @click="openDetail(row.from_user.id)">
                  {{ row.from_user.nickname }}
                </el-link>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="接收方" width="130">
              <template #default="{ row }">
                <el-link v-if="row.to_user" type="primary" :underline="false" @click="openDetail(row.to_user.id)">
                  {{ row.to_user.nickname }}
                </el-link>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="typeTag(row.interaction_type)" size="small">
                  {{ typeLabel(row.interaction_type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设备ID" width="140">
              <template #default="{ row }">{{ row.device_id || '-' }}</template>
            </el-table-column>
            <el-table-column label="附加数据" min-width="200">
              <template #default="{ row }">
                <span v-if="row.interaction_data" style="font-size: 12px; color: #909399;">
                  {{ JSON.stringify(row.interaction_data) }}
                </span>
                <span v-else>-</span>
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
      </el-tab-pane>

      <!-- Tab 2: 活跃用户排行 -->
      <el-tab-pane label="活跃用户排行" name="active">
        <div class="table-card">
          <el-table v-if="stats" :data="stats.top_users" stripe>
            <el-table-column label="排名" width="60">
              <template #default="{ $index }">{{ $index + 1 }}</template>
            </el-table-column>
            <el-table-column label="头像" width="60">
              <template #default>
                <el-avatar :size="32">U</el-avatar>
              </template>
            </el-table-column>
            <el-table-column label="昵称" width="200">
              <template #default="{ row }">
                <el-link type="primary" :underline="false" @click="openDetail(row.user_id)">
                  {{ row.nickname }}
                </el-link>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="交互次数" width="120" />
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button size="small" @click="router.push(`/social-network/${row.user_id}`)">查看社交网络</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无活跃用户数据" />
        </div>
      </el-tab-pane>
    </el-tabs>

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
