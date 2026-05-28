import { get } from './client'
import type { DashboardStats } from '@/types'

export function getDashboardStats() {
  return get<DashboardStats>('/api/admin/stats/dashboard')
}
