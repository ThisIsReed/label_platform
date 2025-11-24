import json
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.annotation import Annotation
from ..models.document import Document
from ..schemas.annotation import AnnotationCreate, AnnotationUpdate, CommentItem

def create_or_update_annotation(
    db: Session,
    document_id: int,
    user_id: int,
    evaluation: bool,
    comments: List[CommentItem] = None,
    time_spent: int = 0,
    is_completed: bool = False
):
    # 检查是否已有标注
    annotation = db.query(Annotation).filter(
        Annotation.document_id == document_id,
        Annotation.annotator_id == user_id
    ).first()

    comments_json = json.dumps([comment.dict() for comment in comments]) if comments else "[]"

    if annotation:
        # 更新现有标注
        annotation.evaluation = evaluation
        annotation.comments = comments_json
        annotation.time_spent += time_spent
        annotation.is_completed = is_completed
        db.commit()
        db.refresh(annotation)
    else:
        # 创建新标注
        annotation = Annotation(
            document_id=document_id,
            annotator_id=user_id,
            evaluation=evaluation,
            comments=comments_json,
            time_spent=time_spent,
            is_completed=is_completed
        )
        db.add(annotation)
        db.commit()
        db.refresh(annotation)

    # 保存标注后，总是更新文档状态
    update_document_status(db, document_id)

    return annotation

def get_annotation(db: Session, document_id: int, user_id: int):
    return db.query(Annotation).filter(
        Annotation.document_id == document_id,
        Annotation.annotator_id == user_id
    ).first()

def get_document_annotations(db: Session, document_id: int):
    return db.query(Annotation).filter(Annotation.document_id == document_id).all()

def get_user_annotations(db: Session, user_id: int):
    return db.query(Annotation).filter(Annotation.annotator_id == user_id).all()

def update_annotation_time(db: Session, annotation_id: int, additional_time: int):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if annotation:
        annotation.time_spent += additional_time
        db.commit()
        db.refresh(annotation)
    return annotation

def update_document_status(db: Session, document_id: int):
    """根据标注情况更新文档状态"""
    # 获取文档的所有标注
    total_annotations = db.query(Annotation).filter(Annotation.document_id == document_id).count()
    completed_annotations = db.query(Annotation).filter(
        Annotation.document_id == document_id,
        Annotation.is_completed == True
    ).count()

    # 更新文档状态
    document = db.query(Document).filter(Document.id == document_id).first()
    if document:
        if total_annotations == 0:
            document.status = "pending"
        elif completed_annotations == total_annotations and total_annotations > 0:
            document.status = "completed"
        else:
            document.status = "in_progress"

        db.commit()
        db.refresh(document)

    return document