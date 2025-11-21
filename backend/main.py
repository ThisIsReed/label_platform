from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import Base, engine
from app.api import auth, documents, annotations, stats

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(title="地方志标注平台", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件 - 新的前端结构
# 前端现在是React SPA，主要开发使用
# 保留旧的前端页面路由用于测试和对比

# 主页重定向 - 现在由React前端处理

# 注册路由
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(documents.router, prefix="/api/documents", tags=["文档"])
app.include_router(annotations.router, prefix="/api/annotations", tags=["标注"])
app.include_router(stats.router, prefix="/api/stats", tags=["统计"])

@app.get("/api")
async def root():
    return {"message": "地方志标注平台 API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)