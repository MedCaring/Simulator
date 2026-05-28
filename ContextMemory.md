### [存档时间: 2026-05-27 初始骨架]
- PHASE_COMPLETED:
  - Task: 完成 B 端管理后台前端骨架搭建 (Vue 3 + Element Plus + Vite + Pinia + ECharts)
  - Modified_Files: admin-dashboard/ 下全部文件（vite.config.ts, src/, mock/）
- KEY_DECISIONS:
  - SCSS 变量不通过 additionalData 共享（别名解析问题），改为硬编码值
  - TypeScript 6.0 移除 baseUrl，仅用 paths: { "@/*": ["./src/*"] }
  - Mock 模式通过 vite-plugin-mock 拦截，dev 环境自动启用，无需后端
  - 所有 devbox 命令需从项目根目录执行：devbox run -- bash -c "cd admin-dashboard && ..."

### [存档时间: 2026-05-27 第一次改动]
- PHASE_COMPLETED:
  - Task: 第一次改动 — 社交网络页面、仪表盘路由增强、交互监控Tab、全局修复
  - Modified_Files: src/types/index.ts, src/router/index.ts, src/components/AppLayout.vue, src/components/StatCard.vue, src/views/DashboardView.vue, src/views/UsersView.vue, src/views/InteractionsView.vue, src/styles/global.scss, mock/users.ts
  - New_Files: src/views/SocialNetworkView.vue, src/api/social.ts, mock/social.ts
- KEY_DECISIONS:
  - 社交网络使用 ECharts force-directed graph，BFS 3层遍历交互数据
  - 用户详情通过 URL query (?id=123) 复用 UsersView 抽屉，不新建路由
  - 活跃用户排行作为 InteractionsView 的 Tab 内嵌，不新建路由
  - StatCard 新增 route prop 实现点击跳转
  - 响应式断点：stat-row 4→3→2→1 列，chart-row 2→1 列，宽度不足时隐藏而非折行
- CURRENT_STATE:
  - Next_Step: 用户在浏览器完整测试所有改动，确认后对接后端 API
  - Known_Issues: 无
  - Dead_Ends: 无
