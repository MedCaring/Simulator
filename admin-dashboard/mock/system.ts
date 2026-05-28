import type { MockMethod } from 'vite-plugin-mock'

const admins = [
  { id: 1, username: 'admin', display_name: '管理员', role: 'super_admin', is_active: true, last_login_at: '2026-05-27 10:30:00', created_at: '2026-01-01 00:00:00' },
  { id: 2, username: 'operator', display_name: '运营人员', role: 'admin', is_active: true, last_login_at: '2026-05-26 15:00:00', created_at: '2026-03-01 00:00:00' },
  { id: 3, username: 'viewer', display_name: '查看者', role: 'admin', is_active: false, last_login_at: null, created_at: '2026-04-01 00:00:00' },
]

const auditLogs = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  admin_id: [1, 2][i % 2],
  admin_username: ['admin', 'operator'][i % 2],
  action: ['用户禁用', '用户启用', '导出CSV', '修改密码', '创建管理员'][i % 5],
  target_type: 'user',
  target_id: i + 10,
  details: null,
  ip_address: `192.168.1.${i + 1}`,
  created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().replace('T', ' ').slice(0, 19),
}))

export default [
  {
    url: '/api/admin/system/health',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: {
          api_status: 'healthy',
          database_status: 'healthy',
          server_uptime: '12d 5h 32m',
          db_pool_size: 20,
          db_checked_out: 3,
          db_overflow: 0,
          recent_errors: [
            { time: '2026-05-27 08:15:00', message: 'Connection timeout to third-party service' },
            { time: '2026-05-27 07:22:00', message: 'Rate limit exceeded for API key xxx' },
          ],
          api_version: '1.0.0',
        },
      }
    },
  },
  {
    url: '/api/admin/audit-logs',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const page = Number(query.page) || 1
      const pageSize = Number(query.page_size) || 20
      const start = (page - 1) * pageSize
      return {
        code: 200,
        message: 'success',
        data: {
          items: auditLogs.slice(start, start + pageSize),
          total: auditLogs.length,
          page,
          page_size: pageSize,
        },
      }
    },
  },
  {
    url: '/api/admin/accounts',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      const page = Number(query.page) || 1
      const pageSize = Number(query.page_size) || 20
      const start = (page - 1) * pageSize
      return {
        code: 200,
        message: 'success',
        data: {
          items: admins.slice(start, start + pageSize),
          total: admins.length,
          page,
          page_size: pageSize,
        },
      }
    },
  },
  {
    url: '/api/admin/accounts',
    method: 'post',
    response: ({ body }: { body: { username: string; password: string; display_name?: string; role: string } }) => {
      admins.push({
        id: admins.length + 1,
        username: body.username,
        display_name: body.display_name || body.username,
        role: body.role as 'super_admin' | 'admin',
        is_active: true,
        last_login_at: null,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      })
      return { code: 200, message: '创建成功', data: null }
    },
  },
  {
    url: /\/api\/admin\/accounts\/(\d+)\/status$/,
    method: 'put',
    response: ({ url }: { url: string }) => {
      const id = Number(url.match(/\/api\/admin\/accounts\/(\d+)\/status$/)?.[1])
      const admin = admins.find((a) => a.id === id)
      if (admin) admin.is_active = !admin.is_active
      return { code: 200, message: admin?.is_active ? '已启用' : '已禁用', data: null }
    },
  },
] as MockMethod[]
