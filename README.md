# Co-Draw - 实时协作绘图与文档平台

Co-Draw 是一个功能强大的实时协作平台，旨在提供无缝的在线白板绘图和富文本编辑体验。无论您是需要与团队进行头脑风暴、共同起草文档，还是与朋友分享创意，Co-Draw 都能满足您的需求。

## ✨ 主要功能

### 🎨 实时协作白板
- 多人同时在无限画布上绘图
- 支持画笔、橡皮擦、插入文本、形状等多种工具
- 实时同步所有参与者的光标和绘图操作
- 支持平移和缩放，轻松导航大型画板

### ✍️ 实时协作文档
- 基于 TipTap 构建的富文本编辑器
- 多人同时编辑同一文档，修改实时可见
- 支持标题、粗体、斜体、列表等多种文本格式
- 协作者光标实时显示，了解团队成员的编辑位置

### 👤 用户认证与授权
- 安全的 JWT (JSON Web Token) 用户认证系统
- 支持用户注册和登录
- 基于角色的权限控制，保护您的文档和白板安全

### 🤝 协作者管理
- 轻松邀请他人加入您的文档或白板
- 管理协作者的权限（例如，只读或可编辑）

### 🚀 高性能实时通信
- 使用 WebSocket (Socket.IO) 和 CRDT (Y.js) 算法，确保低延迟和数据一致性
- 即使在网络不稳定的情况下也能保证流畅的协作体验

## 🛠️ 技术栈
本项目采用前后端分离的 Monorepo 架构。

### 客户端 (Client)
- 框架: Next.js (React)
- 状态管理: Zustand
- UI 组件库: Shadcn/ui & Tailwind CSS
- 富文本编辑器: TipTap
- 实时协作: Y.js & Socket.IO Client
- 类型检查: TypeScript

### 服务端 (Server)
- 框架: NestJS
- 数据库 ORM: Prisma
- 数据库: PostgreSQL (可轻松替换为其他 Prisma 支持的数据库)
- 实时通信: Socket.IO & Y.js
- 认证: Passport.js with JWT
- 类型检查: TypeScript

## 🚀 本地运行指南
请确保您的电脑上已安装 Node.js (v18+), pnpm 和 Docker。

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/co-draw.git
cd co-draw
```

### 2. 启动数据库
项目使用 Docker Compose 来启动一个 PostgreSQL 数据库实例。
```bash
docker-compose up -d
```

### 3. 安装依赖
本项目使用 pnpm 作为包管理器。
```bash
pnpm install
```

### 4. 配置环境变量
在 apps/server 和 apps/client 目录下，分别创建 .env 文件。

**apps/server/.env:**
```env
# 数据库连接字符串
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"

# JWT 密钥
JWT_SECRET="your-secret-key"
```

**apps/client/.env:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```
