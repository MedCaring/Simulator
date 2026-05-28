import type { MockMethod } from 'vite-plugin-mock'

const genders = ['未知', '男', '女']
const users = Array.from({ length: 86 }, (_, i) => ({
  id: i + 1,
  openid: `oMock${String(i).padStart(6, '0')}`,
  nickname: `用户_${i + 1}`,
  avatar_url: '',
  phone: i % 3 === 0 ? `138${String(10000000 + i).slice(0, 8)}` : null,
  gender: [0, 1, 1, 2][i % 4],
  is_active: i % 10 !== 0,
  created_at: new Date(Date.now() - Math.random() * 180 * 86400000).toISOString().replace('T', ' ').slice(0, 19),
  last_active_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString().replace('T', ' ').slice(0, 19),
  profile: {
    bio: i % 2 === 0 ? '这个人很懒，什么都没写' : null,
    hobbies: i % 3 === 0 ? '骑行,摄影' : null,
    interests: i % 4 === 0 ? '户外,露营' : null,
    hardware_device_id: i % 2 === 0 ? `DEV_${String(i).padStart(4, '0')}` : null,
  },
  interaction_stats: {
    sent_count: Math.floor(Math.random() * 100),
    received_count: Math.floor(Math.random() * 80),
    by_type: { click: 30, double_click: 20, long_contact: 10, internal_hook: 5 },
    partner_count: Math.floor(Math.random() * 15) + 1,
  },
}))

export default [
  {
    url: '/api/admin/users',
    method: 'get',
    response: ({ query }: { query: Record<string, string> }) => {
      let filtered = [...users]
      if (query.nickname) {
        filtered = filtered.filter((u) => u.nickname.includes(query.nickname))
      }
      if (query.phone) {
        filtered = filtered.filter((u) => u.phone?.includes(query.phone))
      }
      if (query.gender) {
        filtered = filtered.filter((u) => u.gender === Number(query.gender))
      }
      if (query.is_active !== undefined) {
        const active = query.is_active === 'true'
        filtered = filtered.filter((u) => u.is_active === active)
      }
      if (query.date_from) {
        filtered = filtered.filter((u) => u.created_at >= query.date_from)
      }
      if (query.date_to) {
        filtered = filtered.filter((u) => u.created_at <= query.date_to + ' 23:59:59')
      }
      const page = Number(query.page) || 1
      const pageSize = Number(query.page_size) || 20
      const start = (page - 1) * pageSize
      return {
        code: 200,
        message: 'success',
        data: {
          items: filtered.slice(start, start + pageSize),
          total: filtered.length,
          page,
          page_size: pageSize,
        },
      }
    },
  },
  {
    url: /\/api\/admin\/users\/(\d+)$/,
    method: 'get',
    response: ({ url }: { url: string }) => {
      const id = Number(url.match(/\/api\/admin\/users\/(\d+)$/)?.[1])
      const user = users.find((u) => u.id === id) || users[0]
      return { code: 200, message: 'success', data: user }
    },
  },
  {
    url: /\/api\/admin\/users\/(\d+)\/status$/,
    method: 'put',
    response: ({ url }: { url: string }) => {
      const id = Number(url.match(/\/api\/admin\/users\/(\d+)\/status$/)?.[1])
      const user = users.find((u) => u.id === id)
      if (user) user.is_active = !user.is_active
      return { code: 200, message: user?.is_active ? '已启用' : '已禁用', data: null }
    },
  },
  {
    url: '/api/admin/users/export',
    method: 'post',
    response: () => {
      return { code: 200, message: '导出成功', data: { csv: '...' } }
    },
  },
] as MockMethod[]
