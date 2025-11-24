from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.auth import get_current_user
from ..services.stats import (
    get_annotation_stats, get_user_stats, get_all_user_stats,
    get_temporal_stats, get_user_activity_distribution,
    get_document_completion_stats, get_approval_rate_analysis
)
from ..models.user import User

router = APIRouter()

@router.get("/overview")
async def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_annotation_stats(db)

@router.get("/my-stats")
async def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_user_stats(db, current_user.id)

@router.get("/all-users")
async def get_all_users_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 只有管理员可以查看所有用户统计
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="只有管理员可以查看所有用户统计"
        )
    return get_all_user_stats(db)

@router.get("/temporal")
async def get_temporal_analysis(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取时间维度的统计数据（过去N天）"""
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=400,
            detail="天数必须在1-365之间"
        )
    return get_temporal_stats(db, days)

@router.get("/user-activity")
async def get_user_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取用户活跃度分布（仅管理员可访问）"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="只有管理员可以查看用户活跃度分布"
        )
    return get_user_activity_distribution(db)

@router.get("/document-completion")
async def get_document_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取文档完成状态统计"""
    return get_document_completion_stats(db)

@router.get("/approval-analysis")
async def get_approval_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取好评率详细分析"""
    return get_approval_rate_analysis(db)