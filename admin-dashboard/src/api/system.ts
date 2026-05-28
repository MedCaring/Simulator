import { get } from './client'
import type { SystemHealth, PaginatedData, AuditLog } from '@/types'

export function getHealth() {
  return get<SystemHealth>('/api/admin/system/health')
}

export function getAuditLogs(params?: { page?: number; page_size?: number }) {
  return get<PaginatedData<AuditLog>>(
    '/api/admin/audit-logs',
    params as unknown as Record<string, unknown>,
  )
}

export { get, post, put } from './client'
