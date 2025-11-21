# 地方志智能写作助手标注平台

> **⚠️ 开发状态：本项目仍在开发中**

专为地方志专家设计的AI生成内容质量评价平台，支持对比标注和统计分析。

## 核心功能

- **二元评价**：简洁的"好/不好"评分系统
- **对比标注**：左右分栏显示原始素材与AI生成内容
- **文本评论**：选中文本段落添加具体意见
- **实时保存**：防止数据丢失的自动保存机制
- **进度统计**：标注完成状态与好评率分析

## 技术栈

### 后端
- **框架**：FastAPI + SQLAlchemy
- **数据库**：SQLite
- **认证**：JWT Token
- **API文档**：Swagger (http://localhost:8001/docs)

### 前端
- **框架**：React 18 + TypeScript + Vite
- **UI库**：Ant Design (中文本地化)
- **路由**：React Router
- **HTTP客户端**：Axios

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 16+
- 现代浏览器

### 安装与运行

1. **后端设置**
```bash
cd backend
pip install -r requirements.txt
python init_data.py  # 初始化数据库和测试数据
python main.py       # 启动后端服务 (http://localhost:8001)
```

2. **前端设置**
```bash
cd frontend
npm install
npm run dev          # 启动开发服务器 (http://localhost:5173)
```

### 测试账号
| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| expert1 | expert123 | 专家 |
| expert2 | expert123 | 专家 |

## 项目结构

```
label_platform/
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── api/            # API路由 (auth, documents, annotations, stats)
│   │   ├── models/         # SQLAlchemy数据模型
│   │   ├── schemas/        # Pydantic验证模式
│   │   └── services/       # 业务逻辑层
│   ├── database.db         # SQLite数据库
│   ├── init_data.py        # 测试数据初始化
│   └── main.py            # 应用入口
├── frontend/               # React + TypeScript前端
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/         # 页面组件
│   │   └── App.tsx        # 路由配置
│   └── vite.config.ts     # Vite配置 (API代理)
└── README.md
```

## 主要页面路由

- `/` → 重定向到 `/documents`
- `/login` - 登录页面
- `/register` - 注册页面
- `/documents` - 文档列表
- `/documents/:id` - 标注页面
- `/stats` - 统计页面

## 开发说明

### 数据库操作
```bash
# 重置数据库
rm backend/database.db
python backend/init_data.py
```

### 常见问题

**Q: 如何修改端口？**
A: 修改 `backend/main.py` 中的端口设置和 `frontend/vite.config.ts` 中的代理配置

**Q: 如何添加测试数据？**
A: 运行 `python backend/init_data.py` 会创建示例用户和文档

**Q: 前端如何访问后端API？**
A: 开发环境通过Vite代理自动转发 `/api/*` 请求到后端

## 许可证

MIT License