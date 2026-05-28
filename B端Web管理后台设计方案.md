# 觅野 B 端 Web 管理后台设计方案

## 1. 总体架构

```
浏览器 (Vue 3 SPA)
    │  HTTPS :8443
    ▼
Nginx (8.130.142.206)
    │  /admin/*       → /opt/miye/admin-dist/ (静态文件)
    │  /api/admin/*   → uvicorn (复用现有 FastAPI)
    ▼
FastAPI (/opt/miye/app/)
    ├── /api/health, /api/login, /api/user/*, /api/interaction*  (C 端 现有)
    └── /api/admin/auth/*, /api/admin/users/*, ...  (B 端 新增)
         │
         ▼
    MySQL 8.0 miye_db
         ├── wechat_users, user_profiles, interactions, daily_stats (现有 4 张)
         └── admin_users, admin_audit_logs (新增 2 张)
```

**核心理念**：不新建独立服务，直接在现有 FastAPI 后端扩展 `/api/admin/` 路由。B 端 SPA 编译为静态文件，Nginx 直接 serve。数据库加 2 张新表，`wechat_users` 加 1 列。

---

## 2. 技术选型

| 层 | 选择 | 理由 |
|----|------|------|
| 前端框架 | **Vue 3.4** (Composition API + `<script setup>`) | 中文社区活跃，学习曲线平缓，单文件组件直观 |
| UI 组件库 | **Element Plus 2.x** | 国内最主流的 admin UI 库，内置表格/表单/对话框/分页，中文文档完善 |
| 构建工具 | **Vite 5** | 开发热更新快，构建快 |
| 语言 | **TypeScript** | 与 C 端保持一致 |
| 状态管理 | **Pinia** | Vue 3 官方推荐，轻量 |
| 图表 | **ECharts 5** | 国内最主流，与 Element Plus 集成好 |
| HTTP | **Axios** | 拦截器方便做 JWT 注入和 401 处理 |
| 路由 | **Vue Router 4** | Vue 3 标配 |

**为什么不选 React + Ant Design Pro？**
两者能力相当，但 Ant Design Pro 偏重（定位是中大型后台），觅野当前只需要 6 个页面。Vue 3 + Element Plus 更轻量，且中文文档和社区支持更好。

---

## 3. 功能模块（6 个页面）

### 3.1 登录页 `/login`

- 用户名 + 密码表单
- 独立于微信的认证体系（账号密码 → bcrypt 验证 → Admin JWT）
- JWT 有效期 12 小时（比 C 端 7 天短，安全性更高）
- 无侧栏/无 chrome，纯登录页

### 3.2 仪表盘 `/dashboard`

顶部 4 个统计卡片 + 中间 2 个图表 + 底部最近用户表。

**统计卡片（Phase 1 真实数据）**：

| 卡片 | 数据来源 |
|------|---------|
| 总用户数 | `SELECT COUNT(*) FROM wechat_users` |
| 今日新增 | `WHERE DATE(created_at) = CURDATE()` |
| 总交互数 | `SELECT COUNT(*) FROM interactions` |
| 7 日活跃用户 | 近 7 天有交互记录的去重用户数 |

**图表**：
- 用户增长趋势（30 天折线图，来自 `daily_stats` 表）
- 交互类型分布（饼图：click / double_click / long_contact / internal_hook）

**最近用户表**：最新 10 个注册用户，显示昵称、头像、注册时间、交互次数。

### 3.3 用户管理 `/users`

分页表格 + 筛选 + 详情抽屉。

**表格列**：ID、头像、昵称、手机、性别、硬件设备ID、注册时间、最近活跃、发送交互数、接收交互数、状态（启用/禁用）、操作

**筛选条件**：
- 昵称或手机搜索（防抖 300ms）
- 性别下拉
- 注册日期范围
- 是否有硬件设备
- 状态（启用/禁用）

**用户详情抽屉**（点击行弹出）：
- 基本信息区：昵称、头像、手机、性别、openid
- Profile 区：bio、hobbies、interests、hardware_device_id
- 交互统计区：发送/接收总数、按类型分布、互动对象数
- 最近交互列表：最近 20 条交互记录
- 操作按钮：启用/禁用账号

**批量操作**：勾选多行 → 导出 CSV。

### 3.4 交互监控 `/interactions`

**主视图**：服务端分页的交互日志表格。

| 列 | 说明 |
|----|------|
| ID | 交互记录 ID |
| 时间 | created_at |
| 发起方 | from_user.nickname |
| 接收方 | to_user.nickname |
| 类型 | 彩色标签：点击 / 双击 / 长联系 / 内部触发 |
| 设备ID | device_id |
| 附加数据 | interaction_data JSON（可展开） |

**筛选**：发起方/接收方搜索、交互类型多选、设备ID搜索、日期范围。

**统计面板**（表格上方可折叠）：
- 今日/本周/本月交互总数
- 按类型分布（横向柱状图）
- TOP 10 最活跃用户
- TOP 10 最活跃设备对

**社交网**：选取任意一名用户，可以生成一个以这名用户为中心的社交网（仅仅延伸出一个关系节点）

**自动刷新**：开关按钮，开启后每 10 秒拉取新数据（硬件测试时很有用）。

### 3.5 系统监控 `/system`

- **健康状态卡片**：API 状态、数据库连接状态、服务器运行时间
- **数据库连接池**：pool size、checked out、overflow
- **最近错误日志**（从 audit_logs 或 journalctl 拉取）
- **API 版本号**

Phase 2 可扩展：CPU/内存/磁盘图表、API 响应时间百分位、日活趋势。

### 3.6 管理员设置 `/settings`

**修改密码**：旧密码 + 新密码 + 确认新密码表单。

**管理员账号管理**（仅 super_admin 可见）：
- 管理员列表表格：用户名、角色、创建时间、状态
- 创建新管理员（用户名 + 密码 + 角色）
- 禁用/启用管理员

---

## 4. 后端设计

### 4.1 新增数据库表

```sql
-- 管理员账号
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    role ENUM('super_admin', 'admin') NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员操作审计
CREATE TABLE admin_audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INT,
    details JSON,
    ip_address VARCHAR(45),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_admin_id (admin_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**现有表变更**：
```sql
ALTER TABLE wechat_users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

### 4.2 新增 API 端点

所有 B 端 API 使用 `/api/admin/` 前缀，需要 Admin JWT 鉴权（与微信用户 JWT 完全分离，通过 token payload 中的 `"type": "admin"` 区分）。

**认证**：
| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| POST | `/api/admin/auth/login` | 管理员登录 | 无需鉴权 |
| GET | `/api/admin/auth/me` | 当前管理员信息 | 任意管理员 |
| PUT | `/api/admin/auth/password` | 修改密码 | 任意管理员 |

**仪表盘**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/stats/dashboard` | 仪表盘聚合统计 |

**用户管理**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/users` | 用户列表（分页+筛选） |
| GET | `/api/admin/users/{id}` | 用户详情（含交互统计） |
| PUT | `/api/admin/users/{id}/status` | 启用/禁用 |
| POST | `/api/admin/users/export` | 导出 CSV |

**交互监控**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/interactions` | 交互列表（分页+筛选） |
| GET | `/api/admin/interactions/stats` | 交互统计（管理员视角，看全部） |
| GET | `/api/admin/interactions/socialnet` | （管理员视角，看社交网） |

**系统**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/system/health` | 健康状态+数据库连接池 |

**管理员账号**：
| 方法 | 端点 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/admin/accounts` | 管理员列表 | super_admin |
| POST | `/api/admin/accounts` | 创建管理员 | super_admin |
| PUT | `/api/admin/accounts/{id}/status` | 启用/禁用 | super_admin |

**审计日志**：
| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/admin/audit-logs` | 操作审计日志（分页） |

### 4.3 认证流程

1. 管理员访问 `https://域名/admin`，未登录 → 重定向到 `/login`
2. 输入用户名密码 → `POST /api/admin/auth/login`
3. 后端验证 bcrypt 哈希 → 签发 JWT（payload: `{ sub: admin_id, role: role, type: "admin" }`, 12h 过期）
4. 前端存 `localStorage`，Axios 拦截器自动带 `Authorization: Bearer <token>`
5. 后端 `get_current_admin` 依赖检查 token type == "admin"（与微信用户 token 区分）
6. 401 → 前端拦截器清 token → 重定向登录页

**首个管理员创建**：在服务器上运行脚本：
```bash
python3 /opt/miye/app/create_admin.py --username admin
# 交互式输入密码
```

### 4.4 后端目录结构

```
/opt/miye/app/
├── main.py              # 现有，新增 admin router 注册
├── models.py            # 现有，新增 AdminUser, AdminAuditLog 模型
├── auth.py              # 现有，微信 JWT 依赖
├── database.py          # 现有
├── config.py            # 现有，新增 ADMIN_JWT_SECRET
├── admin/               # 新增
│   ├── __init__.py
│   ├── admin_auth.py    # Admin JWT + get_current_admin 依赖
│   ├── admin_routes.py  # 所有 /api/admin/* 端点
│   └── admin_schemas.py # Pydantic 模型
├── services/            # 新增
│   └── stats_service.py # 聚合统计查询
└── create_admin.py      # 新增，CLI 创建管理员
```

---

## 5. 前端项目结构

```
miniprogram-1/
├── miniprogram/          # C 端（现有，不动）
└── admin-dashboard/      # B 端（新增）
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.ts              # 入口：注册 Element Plus + Router + Pinia
        ├── App.vue              # 根组件：侧栏布局 + router-view
        ├── router/
        │   └── index.ts         # 路由：/, /login, /dashboard, /users, ...
        ├── stores/
        │   └── auth.ts          # Pinia：token, admin info, login/logout
        ├── api/
        │   ├── client.ts        # Axios 实例 + 拦截器
        │   ├── auth.ts          # login, me, changePassword
        │   ├── dashboard.ts     # getDashboardStats
        │   ├── users.ts         # getUsers, getUserDetail, toggleUserStatus
        │   ├── interactions.ts  # getInteractions, getInteractionStats
        │   └── system.ts        # getHealth, getAuditLogs, admin accounts CRUD
        ├── views/
        │   ├── LoginView.vue        # 登录页
        │   ├── DashboardView.vue    # 仪表盘
        │   ├── UsersView.vue        # 用户管理
        │   ├── InteractionsView.vue # 交互监控
        │   ├── SystemView.vue       # 系统监控
        │   └── SettingsView.vue     # 管理员设置
        ├── components/
        │   ├── AppLayout.vue    # 侧栏 + 顶栏布局壳
        │   └── StatCard.vue     # 统计卡片组件
        └── types/
            └── index.ts         # TS 接口定义
```

---

## 6. 部署

### 6.1 构建
```bash
cd admin-dashboard
npm run build          # 产出 dist/
```

### 6.2 上传服务器
```bash
scp -r dist/* root@8.130.142.206:/opt/miye/admin-dist/
```

### 6.3 Nginx 配置（新增）
```nginx
location /admin {
    alias /opt/miye/admin-dist/;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
}
# /api/admin/* 已被现有 proxy_pass 规则覆盖，无需额外配置
```

### 6.4 初始化管理员
```bash
cd /opt/miye
python3 app/create_admin.py --username admin
# 输入密码
```

### 6.5 重启服务
```bash
systemctl restart miye-api
systemctl reload nginx
```

### 6.6 访问
`https://你的域名:8443/admin`

---

## 7. 本地开发

Vite 配置 proxy 到服务器，避免跨域：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api/admin': {
        target: 'https://8.130.142.206:8443',
        changeOrigin: true,
        secure: false  // 自签证书
      }
    }
  }
})
```

`npm run dev` → 浏览器 `localhost:5173` → API 请求自动转发到服务器。

---

## 8. 分阶段实施

### Phase 1（当前可做，约 2-3 周）

基于现有 4 张表（wechat_users, user_profiles, interactions, daily_stats）构建全部 6 个页面。

- 用户管理、交互监控、仪表盘都使用真实 MySQL 数据
- 内容审核页搭空壳（等 C 端 meetup/chat 变为真实 API 后才有数据）

### Phase 2（C 端 mock 转真实 API 后）

meetup/chat/group 变为真实 → 增加：
- 内容审核（举报处理、内容下架）
- 组局管理（查看/编辑/下架所有组局）
- 消息管理（查看聊天记录）
- 设备管理（注册设备、绑定用户）

### Phase 3（生产加固）

- 替换自签 SSL 为 CA 签发证书
- 独立的 B 端域名（如 admin.miyeapp.com）
- 管理员 IP 白名单
- 登录失败次数限制
- 接入队友的硬件模拟器数据到正式交互管道

---

## 9. 安全设计

- **独立认证**：Admin JWT 与微信 JWT 使用不同的 secret key，token payload 中 `type` 字段区分
- **密码**：bcrypt cost factor 12
- **角色**：`super_admin` 可管理其他管理员，`admin` 只能查看和操作业务数据
- **审计**：所有管理员写操作记录到 `admin_audit_logs`
- **超时**：Admin JWT 12 小时过期（C 端 7 天，B 端更短更安全）
- **自动登出**：前端检测到 401 时清 token 并跳转登录页
