import { get, post, put } from './client'
import type { LoginRequest, LoginResponse, AdminUser, ChangePasswordRequest } from '@/types'

export function login(data: LoginRequest) {
  return post<LoginResponse>('/api/admin/auth/login', data as unknown as Record<string, unknown>)
}

export function getMe() {
  return get<AdminUser>('/api/admin/auth/me')
}

export function changePassword(data: ChangePasswordRequest) {
  return put('/api/admin/auth/password', data as unknown as Record<string, unknown>)
}
