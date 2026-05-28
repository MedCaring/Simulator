// ===== 通用 =====
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

// ===== 管理员 =====
export interface AdminUser {
  id: number
  username: string
  display_name: string
  role: 'super_admin' | 'admin'
  is_active: boolean
  last_login_at: string | null
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  admin: AdminUser
}

// ===== 微信用户 =====
export interface WechatUser {
  id: number
  openid: string
  nickname: string
  avatar_url: string
  phone: string | null
  gender: number
  is_active: boolean
  created_at: string
  last_active_at: string | null
  profile?: UserProfile
  interaction_stats?: InteractionStats
}

export interface UserProfile {
  bio: string | null
  hobbies: string | null
  interests: string | null
  hardware_device_id: string | null
}

export interface InteractionStats {
  sent_count: number
  received_count: number
  by_type: Record<string, number>
  partner_count: number
}

export interface UserQuery {
  page?: number
  page_size?: number
  nickname?: string
  phone?: string
  gender?: number
  date_from?: string
  date_to?: string
  has_device?: boolean
  is_active?: boolean
}

// ===== 交互 =====
export interface Interaction {
  id: number
  created_at: string
  from_user: { id: number; nickname: string }
  to_user: { id: number; nickname: string }
  interaction_type: 'click' | 'double_click' | 'long_contact' | 'internal_hook'
  device_id: string | null
  interaction_data: Record<string, unknown> | null
}

export interface InteractionQuery {
  page?: number
  page_size?: number
  from_user?: string
  to_user?: string
  interaction_type?: string[]
  device_id?: string
  date_from?: string
  date_to?: string
}

export interface InteractionStatsData {
  today_count: number
  week_count: number
  month_count: number
  by_type: Record<string, number>
  top_users: { user_id: number; nickname: string; count: number }[]
  top_device_pairs: { device_a: string; device_b: string; count: number }[]
}

// ===== 仪表盘 =====
export interface DashboardStats {
  total_users: number
  today_new_users: number
  total_interactions: number
  active_users_7d: number
  user_trend_30d: { date: string; count: number }[]
  interaction_type_distribution: { type: string; count: number }[]
  recent_users: { id: number; nickname: string; avatar_url: string; created_at: string; interaction_count: number }[]
}

// ===== 系统 =====
export interface SystemHealth {
  api_status: string
  database_status: string
  server_uptime: string
  db_pool_size: number
  db_checked_out: number
  db_overflow: number
  recent_errors: { time: string; message: string }[]
  api_version: string
}

// ===== 审计日志 =====
export interface AuditLog {
  id: number
  admin_id: number
  admin_username?: string
  action: string
  target_type: string | null
  target_id: number | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// ===== 管理员管理 =====
export interface CreateAdminRequest {
  username: string
  password: string
  display_name?: string
  role: 'super_admin' | 'admin'
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

// ===== 社交网络 =====
export interface SocialGraphNode {
  id: number
  nickname: string
  avatar_url: string
  level: number
  symbolSize: number
}

export interface SocialGraphEdge {
  source: number
  target: number
}

export interface SocialNetworkData {
  nodes: SocialGraphNode[]
  edges: SocialGraphEdge[]
}
