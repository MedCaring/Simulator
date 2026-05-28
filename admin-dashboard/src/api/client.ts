import axios from 'axios'
import type { ApiResponse } from '@/types'

const client = axios.create({
  baseURL: '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器 — JWT 注入
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 — 统一错误处理 + 401 处理
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      // 不在登录页则跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

// 通用请求方法
export async function get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await client.get<ApiResponse<T>>(url, { params })
  return res.data
}

export async function post<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await client.post<ApiResponse<T>>(url, data)
  return res.data
}

export async function put<T>(url: string, data?: Record<string, unknown>): Promise<ApiResponse<T>> {
  const res = await client.put<ApiResponse<T>>(url, data)
  return res.data
}

export async function del<T>(url: string): Promise<ApiResponse<T>> {
  const res = await client.delete<ApiResponse<T>>(url)
  return res.data
}

export default client
