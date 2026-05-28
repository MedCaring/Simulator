import { get, put, post } from './client'
import type { PaginatedData, WechatUser, UserQuery } from '@/types'

export function getUsers(params: UserQuery) {
  return get<PaginatedData<WechatUser>>('/api/admin/users', params as unknown as Record<string, unknown>)
}

export function getUserDetail(id: number) {
  return get<WechatUser>(`/api/admin/users/${id}`)
}

export function toggleUserStatus(id: number) {
  return put(`/api/admin/users/${id}/status`)
}

export function exportUsers(params?: UserQuery) {
  return post('/api/admin/users/export', params as unknown as Record<string, unknown>)
}
