# 🛡️ Secure Ticket API

一个基于 **Node.js + TypeScript + Express + Prisma + PostgreSQL** 的安全支持工单 / ticket 管理 REST API，支持 JWT 验证、权限管理、团队与组织逻辑、多租户结构。

---

## 📌 项目简介

Secure Ticket API 提供了一个完善的后端服务，用于管理：

- 组织（Organization）、团队（Team）
- 用户（User）及其角色
- 支持工单（Ticket）
- 计划（Plan）与订阅（Subscription）
- 权限（Permission）与角色权限绑定（RolePermission）
- Session、刷新 Token 等安全机制
- 审计日志（AuditLog）

数据库被建模为一套完整的 RBAC（Role-Based Access Control）+ 多租户架构，使其适用于 SaaS 或企业级平台。

> 数据模型定义请查看 `prisma/schema.prisma`（数据库模型样例已在仓库中） :contentReference[oaicite:1]{index=1}

---

## 📦 功能亮点

✨ 使用 **Prisma ORM** 直连 PostgreSQL  
🔐 **JWT 鉴权 + Refresh Token Session 管理**  
👥 多租户支持（Organization / Team）  
🔑 完整的角色权限系统（Role / Permission / RolePermission）  
📊 审计日志追踪用户操作  
📈 支持计划（Plan）与订阅（Subscription）  
📄 清晰的 Ticket 生命周期状态管理  
🧪 适合快速开发与扩展

---

## 🏗️ 技术栈

| 技术                 | 作用           |
| -------------------- | -------------- |
| Node.js & TypeScript | 语言与类型安全 |
| Express.js           | Web 框架       |
| PostgreSQL           | 数据存储       |
| Prisma               | ORM & 迁移工具 |
| JWT                  | 认证           |
| Bcrypt               | 密码哈希       |
| Zod / Middleware     | 请求验证       |
| Docker               | 可选容器化部署 |

---

## 📁 项目结构（示例）

```bash
.
├── docker-compose.yml
├── Dockerfile
├── nodemon.json
├── package.json
├── package-lock.json
├── prisma
│   ├── migrations
│   │   └── migration_lock.toml
│   ├── schema.prisma
│   ├── seeders
│   │   ├── BaseSeeder.ts
│   │   ├── OrganizationSeeder.ts
│   │   ├── PermissionSeeder.ts
│   │   ├── RoleSeeder.ts
│   │   ├── TicketSeeder.ts
│   │   ├── types.ts
│   │   └── UserSeeder.ts
│   └── seed.ts
├── prisma.config.ts
├── README.md
├── scripts
│   └── truncate.ts
├── src
│   ├── audit
│   │   └── audit-error.ts
│   ├── docs
│   │   ├── openapi.inject.ts
│   │   ├── openapi.ts
│   │   └── permissions.openapi.ts
│   ├── errors
│   │   ├── auditable-error.ts
│   │   ├── errors.index.ts
│   │   └── http-error.ts
│   ├── generated
│   │   └── prisma
│   │       ├── browser.ts
│   │       ├── client.ts
│   │       ├── commonInputTypes.ts
│   │       ├── enums.ts
│   │       ├── internal
│   │       │   ├── class.ts
│   │       │   ├── prismaNamespaceBrowser.ts
│   │       │   └── prismaNamespace.ts
│   │       ├── models
│   │       │   ├── AuditLog.ts
│   │       │   ├── Organization.ts
│   │       │   ├── Permission.ts
│   │       │   ├── Plan.ts
│   │       │   ├── Quota.ts
│   │       │   ├── RolePermission.ts
│   │       │   ├── Role.ts
│   │       │   ├── Session.ts
│   │       │   ├── Subscription.ts
│   │       │   ├── Team.ts
│   │       │   ├── Ticket.ts
│   │       │   ├── UserRole.ts
│   │       │   └── User.ts
│   │       └── models.ts
│   ├── index.ts
│   ├── lib
│   │   ├── audit.ts
│   │   ├── jwt.ts
│   │   ├── jwt.types.ts
│   │   ├── prisma.ts
│   │   ├── rbac.ts
│   │   ├── redis.ts
│   │   └── token.ts
│   ├── middlewares
│   │   ├── auth.middleware.ts
│   │   ├── org.guard.ts
│   │   ├── permission.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   └── subscription.middleware.ts
│   ├── modules
│   │   ├── auth
│   │   │   ├── auth.errors.ts
│   │   │   ├── auth.field-policy.ts
│   │   │   ├── auth.guard.ts
│   │   │   ├── auth.openapi.ts
│   │   │   ├── auth.permissions.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.state-machine.ts
│   │   │   ├── auth.state.ts
│   │   │   ├── auth.store.ts
│   │   │   ├── auth.tokens.ts
│   │   │   ├── auth.types.ts
│   │   │   └── policy
│   │   │       ├── auth.policy.admin.ts
│   │   │       ├── auth.policy.base.ts
│   │   │       ├── auth.policy.login.ts
│   │   │       ├── auth.policy.profile.ts
│   │   │       ├── auth.policy.session.ts
│   │   │       └── index.ts
│   │   ├── org
│   │   │   └── org.errors.ts
│   │   └── tickets
│   │       ├── ticket.errors.ts
│   │       ├── ticket.field-policy.ts
│   │       ├── ticket.guard.ts
│   │       ├── ticket.openapi.ts
│   │       ├── ticket.permissions.ts
│   │       ├── ticket.policy.ts
│   │       ├── ticket.routes.ts
│   │       ├── ticket.service.ts
│   │       ├── ticket.state-machine.ts
│   │       ├── ticket.state.ts
│   │       └── ticket.store.ts
│   ├── repro.ts
│   └── types
│       └── express.d.ts
└── tsconfig.json
```

---

## 🚀 快速启动

### 1. 克隆仓库

```bash
git clone https://github.com/JayChew/secure-ticket-api.git
cd secure-ticket-api
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

在项目根目录复制 .env.example 并重命名为 .env：

```bash
cp .env.example .env
```

编辑其中的变量，例如：

```bash
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/secure_ticket?schema=public"
JWT_SECRET=yourStrongSecretHere
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

> 使用安全的随机字符串作为 JWT_SECRET。

### 4. 运行数据库迁移

```bash
npx prisma migrate dev --name init
```

这将根据 schema.prisma 在数据库中创建表结构。

### 5. 生成 Prisma 客户端

```bash
npx prisma generate
```

这将根据 schema.prisma 在数据库中创建表结构。

### 6. 启动开发服务器

```bash
npm run dev
```

---

## 🔐 核心 API 概览

### 🧑‍💻 认证相关

| 方法 | 路径             | 说明                                   |
| ---- | ---------------- | -------------------------------------- |
| POST | `/auth/register` | 注册新用户                             |
| POST | `/auth/login`    | 登录并返回 JWT                         |
| POST | `/auth/refresh`  | 使用 refresh token 获取新 access token |
| POST | `/auth/logout`   | 注销并废弃 Refresh Session             |

### 👥 用户与组织

| 方法 | 路径                 | 说明         |
| ---- | -------------------- | ------------ |
| GET  | `/users/me`          | 获取当前用户 |
| GET  | `/organizations/:id` | 获取组织信息 |
| GET  | `/teams/:id`         | 获取团队信息 |
| GET  | `/roles`             | 列出角色     |
| GET  | `/permissions`       | 列出权限     |

### 🎫 Tickets 管理

| 方法  | 路径                  | 说明         |
| ----- | --------------------- | ------------ |
| POST  | `/tickets`            | 创建工单     |
| GET   | `/tickets`            | 列出工单     |
| GET   | `/tickets/:id`        | 查看单个工单 |
| PATCH | `/tickets/:id`        | 更新工单信息 |
| PATCH | `/tickets/:id/status` | 修改工单状态 |

### 🛠️ 安全设计说明

✔ 密码使用 bcrypt 哈希存储 \
✔ JWT Token 具备过期机制 \
✔ Refresh Token 保存在 Session 表并可撤销 \
✔ 细粒度权限控制，结合 Role & Permission \
✔ 审计日志（AuditLog）记录操作事件

### 🧪 代码质量与开发规范

建议启用以下实践：

- ESLint + Prettier 规范代码风格
- 使用 Zod 处理请求验证
- 使用自定义错误处理中间件
- 编写单元 & 集成测试

---

## 📦 Docker（可选）

定义好 Dockerfile 和 docker-compose.yml 后，可以用：

```bash
docker compose up --build
```

构建服务与数据库容器。

---

## ❤️ 致谢与扩展方向

可以考虑：

✔ 集成 OpenAPI / Swagger 文档 \
✔ 引入 RBAC 可视化权限管理界面 \
✔ 支持 webhook / 通知系统 \
✔ 增加工单附件上传功能

---

## 📄 License

项目当前无 LICENSE 文件，请在发布时补充合适的开源协议（如 MIT）。
