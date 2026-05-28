import type { MockMethod } from 'vite-plugin-mock'

const trend30d = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().slice(0, 10),
    count: Math.floor(Math.random() * 20) + 5,
  }
})

const userList = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nickname: `用户_${['小明', '小红', '阿杰', '老张', '美美', '大刘', '小周', '莉莉', '老王', '小陈'][i]}`,
  avatar_url: '',
  created_at: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().replace('T', ' ').slice(0, 19),
  interaction_count: Math.floor(Math.random() * 50),
}))

export default [
  {
    url: '/api/admin/stats/dashboard',
    method: 'get',
    response: () => {
      return {
        code: 200,
        message: 'success',
        data: {
          total_users: 1256,
          today_new_users: 23,
          total_interactions: 45678,
          active_users_7d: 340,
          user_trend_30d: trend30d,
          interaction_type_distribution: [
            { type: 'click', count: 18000 },
            { type: 'double_click', count: 12000 },
            { type: 'long_contact', count: 9000 },
            { type: 'internal_hook', count: 6678 },
          ],
          recent_users: userList,
        },
      }
    },
  },
] as MockMethod[]
