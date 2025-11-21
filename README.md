# 地方志智能写作助手标注平台

一个专为地方志专家设计的标注评价平台，用于对AI生成的地方志内容进行质量评价和标注。


## 功能特性

### 核心功能
- **简洁评价**：只需选择"好"或"不好"，避免复杂评分困扰
- **对比标注**：左右分栏显示原始素材和AI生成内容
- **文本评论**：点击选择文本段落添加具体意见
- **实时保存**：防止数据丢失的自动保存机制
- **进度跟踪**：显示标注完成状态和好评率
- **统计分析**：提供详细的标注数据统计

### 界面设计
- **直观明了**：减少复杂界面元素
- **响应式设计**：适配不同屏幕尺寸

## 技术架构

### 后端
- **框架**: Python + FastAPI
- **数据库**: SQLite（轻量，便于部署）
- **认证**: JWT Token
- **API文档**: 自动生成Swagger文档

### 前端
- **技术**: 请自行选择合适的技术栈
- **特点**: 无需复杂构建工具，易维护
- **样式**: 响应式设计，简洁易用

## 快速开始

### 环境要求
- Python 3.8+
- 现代浏览器（Chrome/Firefox/Edge）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd label_platform
```

2. **安装后端依赖**
```bash
cd backend
pip install -r requirements.txt
```

3. **启动后端服务**
```bash
cd backend
python main.py
```
后端服务将在 http://localhost:8001 启动

4. **访问前端**
打开浏览器访问 http://localhost:8001/login.html

### 默认配置
- **后端地址**: http://localhost:8001
- **API文档**: http://localhost:8001/docs
- **前端文件**: frontend/ 目录

### 测试账号
| 用户名 | 密码 | 角色 | 姓名 |
|--------|------|------|------|
| admin | admin123 | 管理员 | 管理员 |
| expert1 | expert123 | 专家 | 张教授 |
| expert2 | expert123 | 专家 | 李研究员 |

## 使用指南

### 1. 用户注册和登录
- 访问登录页面，点击"立即注册"创建账号
- 填写用户名、真实姓名、邮箱等信息
- 注册成功后使用用户名密码登录

### 2. 文档标注流程
1. **选择文档**: 从文档列表选择要标注的文档
2. **对比阅读**: 左侧显示原始素材，右侧显示AI生成内容
3. **整体评价**: 点击"内容很好"或"有待改进"按钮
4. **添加评论**: 选择文本片段添加具体意见
5. **保存或完成**: 点击"保存标注"暂存，或"完成标注"提交

### 3. 查看统计
- 在统计页面查看总体标注进度
- 个人统计显示个人完成情况
- 管理员可查看所有用户的统计数据

## 数据结构

### 用户模型
- 用户名、真实姓名、邮箱
- 角色权限（管理员/专家）
- 标注统计信息

### 文档模型
- 标题、原始素材、AI生成内容
- 字数统计、状态管理
- 创建和更新时间

### 标注模型
- 整体评价（好/不好）
- 文本评论列表
- 标注用时统计
- 完成状态标识

## API接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 文档接口
- `GET /api/documents/` - 获取文档列表
- `GET /api/documents/{id}` - 获取文档详情
- `POST /api/documents/` - 创建文档（管理员）

### 标注接口
- `POST /api/annotations/{document_id}` - 保存标注
- `GET /api/annotations/{document_id}` - 获取用户标注
- `GET /api/annotations/{document_id}/all` - 获取所有标注（管理员）

### 统计接口
- `GET /api/stats/overview` - 获取总体统计
- `GET /api/stats/my-stats` - 获取个人统计
- `GET /api/stats/all-users` - 获取用户统计（管理员）

## 部署说明

### 本地部署
1. 确保Python环境安装正确
2. 安装依赖：`pip install -r backend/requirements.txt`
3. 启动服务：`python backend/main.py`
4. 访问：http://localhost:8001/login.html

### 系统测试
运行完整的系统测试：
```bash
python test_platform.py
```

### 生产部署
1. 使用Gunicorn或uWSGI运行FastAPI应用
2. 配置反向代理（Nginx）
3. 设置HTTPS证书
4. 配置环境变量（密钥、数据库等）

### 环境变量
```bash
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./database.db
```

## 文件结构

```
label_platform/
├── backend/                 # FastAPI后端
│   ├── app/
│   │   ├── api/            # API路由
│   │   ├── models/         # 数据库模型
│   │   ├── schemas/        # Pydantic模式
│   │   └── services/       # 业务逻辑
│   ├── database.db         # SQLite数据库
│   ├── requirements.txt    # Python依赖
│   └── main.py            # 应用入口
├── frontend/               # 前端文件
├── docs/                  # 文档目录
└── README.md             # 项目说明
```

## 开发指南

### 添加新功能
1. 后端：在 `backend/app/api/` 添加新的路由文件
2. 前端：在 `frontend/` 添加前端代码

### 数据库迁移
如果需要修改数据库结构：
1. 修改 `backend/app/models/` 中的模型文件
2. 删除现有的 `database.db` 文件
3. 重新启动应用，会自动创建新的数据库结构

### 测试
- 后端API测试：访问 http://localhost:8001/docs
- 前端测试：使用浏览器开发者工具
- 接口测试：运行 `python test_platform.py` 或使用Postman/curl

## 常见问题

### Q: 如何重置数据库？
A: 删除 `backend/database.db` 文件，重新启动应用即可。

### Q: 如何修改端口？
A: 修改 `backend/main.py` 中的端口设置。

### Q: 如何添加管理员用户？
A: 注册用户后，直接在数据库中修改用户的 role 字段为 "admin"。

### Q: 如何备份数据？
A: 备份 `backend/database.db` 文件即可。

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 联系方式

如有问题或建议，请联系项目维护者。