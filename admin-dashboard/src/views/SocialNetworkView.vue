<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { getUserNetwork } from '@/api/social'
import { getUsers } from '@/api/users'
import type { SocialNetworkData, SocialGraphNode } from '@/types'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const data = ref<SocialNetworkData | null>(null)
const chartRef = ref<HTMLDivElement>()
const selectedUserId = ref<number | null>(null)

// User search
const searchOptions = ref<{ id: number; nickname: string }[]>([])
const searchLoading = ref(false)

async function remoteSearch(query: string) {
  if (!query) { searchOptions.value = []; return }
  searchLoading.value = true
  try {
    const res = await getUsers({ nickname: query, page_size: 20 })
    searchOptions.value = (res.data.items || []).map((u) => ({ id: u.id, nickname: u.nickname }))
  } catch { searchOptions.value = [] }
  finally { searchLoading.value = false }
}

function onUserSelect(id: number) {
  if (id) {
    router.push(`/social-network/${id}`)
  }
}

// Deterministic pseudo-random jitter based on node id (stable across re-renders)
function jitter(seed: number, amplitude: number): number {
  const hash = ((seed * 2654435761) >>> 0) % 10000
  return ((hash / 10000) - 0.5) * 2 * amplitude
}

async function loadNetwork(userId: number) {
  loading.value = true
  selectedUserId.value = userId
  try {
    const res = await getUserNetwork(userId)
    data.value = res.data
    await nextTick()
    renderChart()
  } catch { ElMessage.error('加载社交网络失败') }
  finally { loading.value = false }
}

interface PositionedNode extends SocialGraphNode {
  x?: number
  y?: number
}

function computeSpiderPositions(nodes: SocialGraphNode[], edges: { source: number; target: number }[]): PositionedNode[] {
  const positioned: PositionedNode[] = nodes.map((n) => ({ ...n }))

  const center = positioned.find((n) => n.level === 0)
  const level1 = positioned.filter((n) => n.level === 1)
  const level2 = positioned.filter((n) => n.level === 2)

  const r1 = 170
  const r2 = 320
  const jitterAmp = 14

  // Center at origin
  if (center) { center.x = 0; center.y = 0 }

  // Level 1: evenly spaced on inner circle with jitter
  level1.forEach((n) => {
    const i = level1.indexOf(n)
    const angle = (2 * Math.PI * i) / level1.length - Math.PI / 2
    n.x = r1 * Math.cos(angle) + jitter(n.id, jitterAmp)
    n.y = r1 * Math.sin(angle) + jitter(n.id + 1000, jitterAmp)
  })

  // Level 2: grouped behind their parent level-1 node
  const l2ByParent = new Map<number, PositionedNode[]>()
  for (const n of level2) {
    const edge = edges.find((e) => e.target === n.id)
    const parentId = edge ? edge.source : null
    if (parentId) {
      if (!l2ByParent.has(parentId)) l2ByParent.set(parentId, [])
      l2ByParent.get(parentId)!.push(n)
    }
  }

  for (const [parentId, children] of l2ByParent) {
    const parent = positioned.find((n) => n.id === parentId)
    const baseAngle = parent?.x != null ? Math.atan2(parent.y ?? 0, parent.x ?? 0) : 0
    children.forEach((child) => {
      const i = children.indexOf(child)
      const spread = children.length > 1
        ? (i - (children.length - 1) / 2) * (Math.PI / 12)
        : 0
      const angle = baseAngle + spread
      child.x = r2 * Math.cos(angle) + jitter(child.id, jitterAmp * 0.7)
      child.y = r2 * Math.sin(angle) + jitter(child.id + 1000, jitterAmp * 0.7)
    })
  }

  // Fallback: ungrouped level-2 nodes placed evenly on outer circle
  const ungrouped = level2.filter((n) => n.x == null)
  ungrouped.forEach((n) => {
    const i = ungrouped.indexOf(n)
    const angle = (2 * Math.PI * i) / ungrouped.length - Math.PI / 2
    n.x = r2 * Math.cos(angle) + jitter(n.id, jitterAmp)
    n.y = r2 * Math.sin(angle) + jitter(n.id + 1000, jitterAmp)
  })

  return positioned
}

function renderChart() {
  if (!chartRef.value || !data.value) return
  const chart = echarts.init(chartRef.value)
  chart.off('click')
  chart.on('click', (params: { data?: { id?: number } }) => {
    if (params.data?.id && params.data.id !== selectedUserId.value) {
      router.push(`/social-network/${params.data.id}`)
    }
  })

  const positioned = computeSpiderPositions(data.value.nodes, data.value.edges)

  chart.setOption({
    tooltip: {
      formatter: (p: { data?: { nickname?: string; level?: number } }) => {
        if (!p.data) return ''
        const levelLabel = ['中心用户', '一层关联', '二层关联'][p.data.level || 0]
        return `${p.data.nickname}<br/>${levelLabel}`
      },
    },
    series: [{
      type: 'graph',
      layout: 'none',
      roam: true,
      draggable: true,
      data: positioned.map((n) => ({
        id: n.id,
        name: n.nickname,
        x: n.x,
        y: n.y,
        symbolSize: n.symbolSize,
        level: n.level,
        itemStyle: {
          color: ['#409eff', '#67c23a', '#e6a23c'][n.level] || '#909399',
        },
        label: {
          show: true,
          position: 'right',
          fontSize: n.level === 0 ? 15 : n.level === 1 ? 12 : 10,
          fontWeight: n.level === 0 ? 'bold' : 'normal',
          color: n.level === 2 ? '#666' : '#303133',
        },
      })),
      edges: data.value.edges.map((e) => ({
        source: e.source,
        target: e.target,
        lineStyle: { color: '#c0c4cc', width: 0.6, curveness: 0 },
      })),
      emphasis: {
        focus: 'adjacency',
        label: { show: true, fontSize: 14 },
        edgeLabel: { show: false },
      },
    }],
  })
}

// Watch URL param
watch(() => route.params.id, (newId) => {
  if (newId) loadNetwork(Number(newId))
})

onMounted(() => {
  if (route.params.id) loadNetwork(Number(route.params.id))
})
</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header">
      <h2>社交网络</h2>
    </div>

    <!-- 搜索栏 -->
    <div class="table-card" style="margin-bottom: 20px;">
      <div style="max-width: 400px;">
        <el-select
          :model-value="selectedUserId"
          filterable
          remote
          reserve-keyword
          placeholder="搜索用户昵称，选择后查看其社交网络"
          :remote-method="remoteSearch"
          :loading="searchLoading"
          style="width: 100%"
          clearable
          @change="onUserSelect"
        >
          <el-option
            v-for="u in searchOptions"
            :key="u.id"
            :label="u.nickname"
            :value="u.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 图表区域 -->
    <div v-if="data" class="chart-card">
      <div ref="chartRef" style="height: 600px;"></div>
    </div>

    <el-empty v-else description="请搜索并选择一名用户以查看其社交网络" />
  </div>
</template>
