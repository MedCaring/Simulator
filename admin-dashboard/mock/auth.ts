import type { MockMethod } from 'vite-plugin-mock'

const adminUser = {
  id: 1,
  username: 'admin',
  display_name: '管理员',
  role: 'super_admin',
  is_active: true,
  last_login_at: '2026-05-27 10:30:00',
  created_at: '2026-01-01 00:00:00',
}

const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_admin_token'

export default [
  {
    url: '/api/admin/auth/login',
    method: 'post',
    response: ({ body }: { body: { username: string; password: string } }) => {
      if (!body.username || !body.password) {
        return { code: 400, message: '用户名和密码不能为空', data: null }
      }
      if (body.username !== 'admin' || body.password !== 'admin123') {
        return { code: 401, message: '用户名或密码错误', data: null }
      }
      return {
        code: 200,
        message: '登录成功',
        data: { token: adminToken, admin: adminUser },
      }
    },
  },
  {
    url: '/api/admin/auth/me',
    method: 'get',
    response: () => {
      return { code: 200, message: 'success', data: adminUser }
    },
  },
  {
    url: '/api/admin/auth/password',
    method: 'put',
    response: ({ body }: { body: { old_password: string; new_password: string } }) => {
      if (body.old_password !== 'admin123') {
        return { code: 400, message: '旧密码错误', data: null }
      }
      return { code: 200, message: '密码修改成功', data: null }
    },
  },
] as MockMethod[]
