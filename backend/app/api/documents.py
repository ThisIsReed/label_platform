from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.document import Document, DocumentCreate, DocumentList, DocumentAssignment
from ..services.auth import get_current_user
from ..services.document import (
    create_document, get_documents, get_document, get_document_with_annotation,
    check_document_permission, assign_document, get_user_documents
)
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
    return get_documents(db, skip=skip, limit=limit, user_id=current_user.id, user_role=current_user.role)

@router.get("/{document_id}")
async def read_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 检查权限
    has_permission, document = check_document_permission(db, document_id, current_user.id, current_user.role)
    if not has_permission:
        raise HTTPException(status_code=403, detail="没有权限访问此文档")
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    result = get_document_with_annotation(db, document_id, current_user.id)

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

# 文档分配相关API
@router.post("/assign")
async def assign_document_to_user(
    assignment: DocumentAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """分配文档给用户（仅管理员）"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以分配文档"
        )

    # 检查文档是否存在
    document = get_document(db, assignment.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")

    # 检查用户是否存在（如果分配给特定用户）
    if assignment.assigned_to is not None:
        from ..models.user import User
        target_user = db.query(User).filter(User.id == assignment.assigned_to).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="目标用户不存在")
        if target_user.role != "expert":
            raise HTTPException(status_code=400, detail="只能分配文档给专家")

    # 执行分配
    assigned_document = assign_document(db, assignment.document_id, assignment.assigned_to)
    if not assigned_document:
        raise HTTPException(status_code=400, detail="分配失败")

    # 获取目标用户信息
    target_user_name = "未分配"
    if assignment.assigned_to:
        from ..models.user import User
        target_user = db.query(User).filter(User.id == assignment.assigned_to).first()
        target_user_name = target_user.full_name or target_user.username

    return {
        "message": f"文档 '{assigned_document.title}' 已分配给 {target_user_name}",
        "document_id": assigned_document.id,
        "assigned_to": assignment.assigned_to,
        "assigned_to_name": target_user_name
    }

@router.get("/my/assigned", response_model=List[DocumentList])
async def get_my_assigned_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取分配给当前用户的文档"""
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理员不需要使用此接口，请使用 /documents"
        )

    return get_user_documents(db, current_user.id, skip=skip, limit=limit)

@router.get("/available")
async def get_available_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取未分配的文档（供专家认领）"""
    if current_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="管理员不需要使用此接口"
        )

    # 只获取未分配的文档
    from ..models.document import Document
    documents = db.query(Document).filter(Document.assigned_to.is_(None)).offset(skip).limit(limit).all()

    # 转换为DocumentList格式
    result = []
    for doc in documents:
        from ..models.annotation import Annotation
        annotation_count = db.query(Annotation).filter(Annotation.document_id == doc.id).count()
        completed_count = db.query(Annotation).filter(
            Annotation.document_id == doc.id,
            Annotation.is_completed == True
        ).count()

        if annotation_count == 0:
            annotation_status = "未标注"
        elif completed_count == annotation_count:
            annotation_status = "已标注"
        else:
            annotation_status = "进行中"

        doc_list = DocumentList(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            word_count_source=doc.word_count_source,
            word_count_generated=doc.word_count_generated,
            created_at=doc.created_at.isoformat(),
            assigned_to=doc.assigned_to,
            annotation_status=annotation_status
        )
        result.append(doc_list)

    return result

@router.post("/claim/{document_id}")
async def claim_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """专家认领未分配的文档"""
    if current_user.role != "expert":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有专家可以认领文档"
        )

    # 检查文档是否存在且未分配
    document = get_document(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="文档不存在")
    if document.assigned_to is not None:
        raise HTTPException(status_code=400, detail="该文档已被分配")

    # 认领文档
    assigned_document = assign_document(db, document_id, current_user.id)
    if not assigned_document:
        raise HTTPException(status_code=400, detail="认领失败")

    return {
        "message": f"成功认领文档 '{assigned_document.title}'",
        "document_id": assigned_document.id,
        "assigned_to": current_user.id
    }