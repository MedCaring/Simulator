<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getDashboardStats } from '@/api/dashboard'
import { getUserDetail } from '@/api/users'
import type { DashboardStats, WechatUser } from '@/types'
import StatCard from '@/components/StatCard.vue'

const router = useRouter()
const stats = ref<DashboardStats | null>(null)
const loading = ref(false)
const trendChartRef = ref<HTMLDivElement>()
const pieChartRef = ref<HTMLDivElement>()

const today = new Date().toISOString().slice(0, 10)

// User detail drawer
const detailVisible = ref(false)
const detailUser = ref<WechatUser | null>(null)

async function openDetail(id: number) {
  detailVisible.value = true
  try {
    const res = await getUserDetail(id)
    detailUser.value = res.data
  } catch { detailUser.value = null }
}

onMounted(async () => {
  loading.value = true
  try {
    const res = await getDashboardStats()
    stats.value = res.data
    await Promise.resolve()
    renderTrendChart()
    renderPieChart()
  } catch { /* API 未就绪时静默处理 */ }
  finally { loading.value = false }
})

function renderTrendChart() {
  if (!trendChartRef.value || !stats.value) return
  const chart = echarts.init(trendChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: stats.value.user_trend_30d.map((i) => i.date),
    },
    yAxis: { type: 'value' },
    series: [{
      name: '新增用户',
      type: 'line',
      smooth: true,
      data: stats.value.user_trend_30d.map((i) => i.count),
      areaStyle: { color: 'rgba(64,158,255,0.15)' },
      lineStyle: { color: '#409eff' },
      itemStyle: { color: '#409eff' },
    }],
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
  })
}

function renderPieChart() {
  if (!pieChartRef.value || !stats.value) return
  const chart = echarts.init(pieChartRef.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '55%'],
      data: stats.value.interaction_type_distribution.map((i) => ({
        name: typeLabel(i.type),
        value: i.count,
      })),
      label: { show: true, formatter: '{b}\n{d}%' },
    }],
  })
}

function typeLabel(t: string): string {
  const map: Record<string, string> = {
    click: '点击', double_click: '双击', long_contact: '长联系', internal_hook: '内部触发',
  }
  return map[t] || t
}

function genderLabel(g: number): string {
  if (g === 1) return '男'
  if (g === 2) return '女'
  return '未知'
}
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header"><h2>仪表盘</h2></div>

    <template v-if="stats">
      <!-- 统计卡片 -->
      <div class="stat-row">
        <StatCard title="总用户数" :value="stats.total_users" icon="User" color="#409eff" route="/users" />
        <StatCard title="今日新增" :value="stats.today_new_users" icon="UserFilled" color="#67c23a" :route="`/users?date_from=${today}&date_to=${today}`" />
        <StatCard title="总交互数" :value="stats.total_interactions" icon="Connection" color="#e6a23c" route="/interactions" />
        <StatCard title="7日活跃用户" :value="stats.active_users_7d" icon="TrendCharts" color="#f56c6c" route="/interactions?tab=active" />
      </div>

      <!-- 图表 -->
      <div class="chart-row">
        <div class="chart-card">
          <h3 style="margin-bottom: 12px; font-size: 16px;">用户增长趋势（30天）</h3>
          <div ref="trendChartRef" style="height: 300px;"></div>
        </div>
        <div class="chart-card">
          <h3 style="margin-bottom: 12px; font-size: 16px;">交互类型分布</h3>
          <div ref="pieChartRef" style="height: 300px;"></div>
        </div>
      </div>

      <!-- 最近用户表 -->
      <div class="table-card">
        <h3 style="margin-bottom: 12px; font-size: 16px;">最近注册用户</h3>
        <el-table :data="stats.recent_users" stripe size="default" @row-click="(row: any) => openDetail(row.id)" style="cursor: pointer;">
          <el-table-column label="头像" width="60">
            <template #default="{ row }">
              <el-avatar :src="row.avatar_url" :size="32" />
            </template>
          </el-table-column>
          <el-table-column prop="nickname" label="昵称">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" @click.stop="openDetail(row.id)">{{ row.nickname }}</el-link>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" width="180" />
          <el-table-column prop="interaction_count" label="交互次数" width="100" />
        </el-table>
      </div>
    </template>

    <el-empty v-else description="暂无数据，请确认后端 API 已启动" />

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
