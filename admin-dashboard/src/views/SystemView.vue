<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getHealth, getAuditLogs } from '@/api/system'
import type { SystemHealth, AuditLog } from '@/types'
import StatCard from '@/components/StatCard.vue'

const health = ref<SystemHealth | null>(null)
const auditLogs = ref<AuditLog[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const [hRes, aRes] = await Promise.all([
      getHealth(),
      getAuditLogs({ page: 1, page_size: 20 }),
    ])
    health.value = hRes.data
    auditLogs.value = aRes.data.items
  } catch { /* API 未就绪 */ }
  finally { loading.value = false }
})

</script>

<template>
  <div class="page-container" v-loading="loading">
    <div class="page-header"><h2>系统监控</h2></div>

    <template v-if="health">
      <!-- 健康状态 -->
      <div class="stat-row">
        <StatCard title="API 状态" :value="health.api_status" icon="Monitor" :color="health.api_status === 'healthy' ? '#67c23a' : '#f56c6c'" />
        <StatCard title="数据库状态" :value="health.database_status" icon="Coin" :color="health.database_status === 'healthy' ? '#67c23a' : '#f56c6c'" />
        <StatCard title="服务器运行时间" :value="health.server_uptime" icon="Clock" color="#409eff" />
        <StatCard title="API 版本" :value="health.api_version" icon="InfoFilled" color="#e6a23c" />
      </div>

      <!-- 数据库连接池 -->
      <div class="chart-row">
        <div class="chart-card">
          <h3 style="margin-bottom: 12px; font-size: 16px;">数据库连接池</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="Pool Size">{{ health.db_pool_size }}</el-descriptions-item>
            <el-descriptions-item label="Checked Out">{{ health.db_checked_out }}</el-descriptions-item>
            <el-descriptions-item label="Overflow">{{ health.db_overflow }}</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="chart-card">
          <h3 style="margin-bottom: 12px; font-size: 16px;">最近错误日志</h3>
          <el-table :data="health.recent_errors" size="small" max-height="200" stripe>
            <el-table-column prop="time" label="时间" width="170" />
            <el-table-column prop="message" label="消息" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </template>

    <el-empty v-else description="暂无系统数据" />
  </div>
</template>
