from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..schemas.annotation import Annotation, AnnotationCreate, AnnotationUpdate, CommentItem
from ..services.auth import get_current_user
from ..services.annotation import create_or_update_annotation, get_annotation, get_document_annotations
from ..models.user import User

# 标注保存请求模型
class AnnotationSaveRequest(BaseModel):
    evaluation: bool
    comments: list = []
    time_spent: int = 0
    is_completed: bool = False

router = APIRouter()

@router.post("/{document_id}")
async def save_annotation(
    document_id: int,
    request: AnnotationSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 转换评论格式
    comment_items = []
    if request.comments:
        for comment in request.comments:
            # 兼容不同的字段名
            selection = comment.get("selection") or comment.get("range", "")
            comment_items.append(CommentItem(text=comment["text"], selection=str(selection)))

    annotation = create_or_update_annotation(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        evaluation=request.evaluation,
        comments=comment_items,
        time_spent=request.time_spent,
        is_completed=request.is_completed
    )

    return {"message": "标注保存成功", "annotation_id": annotation.id}

@router.get("/{document_id}")
async def get_user_annotation(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annotation = get_annotation(db, document_id, current_user.id)
    if not annotation:
        return {"evaluation": None, "comments": []}

    # 解析评论JSON
    import json
    comments = json.loads(annotation.comments) if annotation.comments else []

    return {
        "evaluation": annotation.evaluation,
        "comments": comments,
        "time_spent": annotation.time_spent,
        "is_completed": annotation.is_completed
    }

@router.get("/{document_id}/all")
async def get_document_all_annotations(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 只有管理员可以查看所有标注
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以查看所有标注"
        )

    annotations = get_document_annotations(db, document_id)
    result = []
    for annotation in annotations:
        import json
        comments = json.loads(annotation.comments) if annotation.comments else []
        result.append({
            "annotation_id": annotation.id,
            "annotator_id": annotation.annotator_id,
            "evaluation": "好" if annotation.evaluation else "不好",
            "comments": comments,
            "time_spent": annotation.time_spent,
            "is_completed": annotation.is_completed,
            "created_at": annotation.created_at
        })

    return result