from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.document import Document, DocumentCreate, DocumentList
from ..services.auth import get_current_user
from ..services.document import create_document, get_documents, get_document, get_document_with_annotation
from ..models.user import User

router = APIRouter()

@router.post("/", response_model=Document)
async def create_new_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 只有管理员可以创建文档
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以创建文档"
        )

    return create_document(db, document)

@router.get("/", response_model=List[DocumentList])
async def read_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_documents(db, skip=skip, limit=limit)

@router.get("/{document_id}")
async def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = get_document_with_annotation(db, document_id, current_user.id)
    if not result:
        raise HTTPException(status_code=404, detail="文档不存在")

    # 返回扁平化的文档数据，包含标注信息
    document = result["document"]
    annotation = result["annotation"]

    response_data = {
        "id": document.id,
        "title": document.title,
        "status": document.status,
        "word_count_source": document.word_count_source,
        "word_count_generated": document.word_count_generated,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "source_content": document.source_content,
        "generated_content": document.generated_content
    }

    # 如果有标注，添加标注数据
    if annotation:
        # 解析JSON字符串形式的评论
        import json
        try:
            comments_data = json.loads(annotation.comments) if annotation.comments else []
        except (json.JSONDecodeError, TypeError):
            comments_data = []

        response_data.update({
            "annotation_status": "已标注" if annotation.is_completed else "进行中",
            "evaluation": annotation.evaluation,
            "comments": comments_data,
            "time_spent": annotation.time_spent,
            "annotated_at": annotation.created_at
        })
    else:
        response_data["annotation_status"] = "未标注"

    return response_data