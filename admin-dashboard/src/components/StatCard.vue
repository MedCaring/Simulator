<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  value: string | number
  icon: string
  color?: string
  trend?: string
  route?: string
}>()

const router = useRouter()
const clickable = computed(() => !!props.route)

function handleClick() {
  if (props.route) router.push(props.route)
}
</script>

<template>
  <div class="stat-card" :class="{ 'stat-card--clickable': clickable }" @click="handleClick">
    <div class="stat-body">
      <div class="stat-info">
        <p class="stat-title">{{ title }}</p>
        <p class="stat-value">{{ value }}</p>
        <p v-if="trend" class="stat-trend">{{ trend }}</p>
      </div>
      <div class="stat-icon" :style="{ backgroundColor: color || '#409eff' }">
        <el-icon :size="28">
          <component :is="icon" />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);

  .stat-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .stat-title {
    font-size: 14px;
    color: #909399;
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
    margin-bottom: 4px;
  }

  .stat-trend {
    font-size: 12px;
    color: #67c23a;
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }
}

.stat-card--clickable {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
}
</style>
