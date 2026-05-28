import type { MockMethod } from 'vite-plugin-mock'

const types = ['click', 'double_click', 'long_contact', 'internal_hook'] as const
const interactions = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  created_at: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString().replace('T', ' ').slice(0, 19),
  from_user: { id: Math.floor(Math.random() * 86) + 1, nickname: `用户_${Math.floor(Math.random() * 86) + 1}` },
  to_user: { id: Math.floor(Math.random() * 86) + 1, nickname: `用户_${Math.floor(Math.random() * 86) + 1}` },
  interaction_type: types[Math.floor(Math.random() * 4)],
  device_id: Math.random() > 0.3 ? `DEV_${String(Math.floor(Math.random() * 100)).padStart(4, '0')}` : null,
  interaction_data: Math.random() > 0.5 ? { lat: 39.9 + Math.random(), lng: 116.4 + Math.random(), dist: Math.floor(Math.random() * 100) } : null,
}))

export default [
  {
    url: '/api/admin/interactions',
    method: 'get',
    response: ({ query }: { query: Record<string, string | string[]> }) => {
      // Normalize axios array params: interaction_type[] → interaction_type
      const q: Record<string, string | string[]> = {}
      for (const [key, val] of Object.entries(query)) {
        const clean = key.replace(/\[\]$/, '')
        if (q[clean] === undefined) {
          q[clean] = val
        } else if (Array.isArray(q[clean])) {
          if (Array.isArray(val)) (q[clean] as string[]).push(...val)
          else (q[clean] as string[]).push(val as string)
        } else {
          if (Array.isArray(val)) q[clean] = [q[clean] as string, ...val]
          else q[clean] = [q[clean] as string, val as string]
        }
      }

      let filtered = [...interactions]
      if (q.from_user) {
        filtered = filtered.filter((i) => i.from_user?.nickname?.includes(q.from_user as string))
      }
      if (q.to_user) {
        filtered = filtered.filter((i) => i.to_user?.nickname?.includes(q.to_user as string))
      }
      if (q.interaction_type) {
        const types = Array.isArray(q.interaction_type) ? q.interaction_type : [q.interaction_type]
        filtered = filtered.filter((i) => types.includes(i.interaction_type))
      }
      if (q.device_id) {
        filtered = filtered.filter((i) => i.device_id?.includes(q.device_id as string))
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
    url: '/api/admin/interactions/stats',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: {
          today_count: 156,
          week_count: 1203,
          month_count: 4520,
          by_type: { click: 1800, double_click: 1200, long_contact: 900, internal_hook: 620 },
          top_users: Array.from({ length: 10 }, (_, i) => ({
            user_id: i + 1,
            nickname: `活跃用户_${i + 1}`,
            count: Math.floor(Math.random() * 50) + 20,
          })),
          top_device_pairs: Array.from({ length: 10 }, (_, i) => ({
            device_a: `DEV_${String(i * 2).padStart(4, '0')}`,
            device_b: `DEV_${String(i * 2 + 1).padStart(4, '0')}`,
            count: Math.floor(Math.random() * 30) + 5,
          })),
        },
      }
    },
  },
] as MockMethod[]
