from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.auth import get_current_user
from ..services.stats import get_annotation_stats, get_user_stats, get_all_user_stats
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