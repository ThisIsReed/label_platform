from typing import List, Optional
from sqlalchemy.orm import Session
from ..models.document import Document
from ..models.annotation import Annotation
from ..schemas.document import DocumentCreate, DocumentList

def create_document(db: Session, document: DocumentCreate):
    # 计算字数
    word_count_source = len(document.source_content)
    word_count_generated = len(document.generated_content)

    db_document = Document(
        title=document.title,
        source_content=document.source_content,
        generated_content=document.generated_content,
        word_count_source=word_count_source,
        word_count_generated=word_count_generated
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

def get_documents(db: Session, skip: int = 0, limit: int = 100):
    documents = db.query(Document).offset(skip).limit(limit).all()

    # 为每个文档添加标注状态信息
    result = []
    for doc in documents:
        # 检查该文档的标注情况
        annotation_count = db.query(Annotation).filter(Annotation.document_id == doc.id).count()
        completed_count = db.query(Annotation).filter(
            Annotation.document_id == doc.id,
            Annotation.is_completed == True
        ).count()

        # 确定标注状态
        if annotation_count == 0:
            annotation_status = "未标注"
        elif completed_count == annotation_count:
            annotation_status = "已标注"
        else:
            annotation_status = "进行中"

        # 创建DocumentList对象
        doc_list = DocumentList(
            id=doc.id,
            title=doc.title,
            status=doc.status,
            word_count_source=doc.word_count_source,
            word_count_generated=doc.word_count_generated,
            created_at=doc.created_at.isoformat(),
            annotation_status=annotation_status
        )
        result.append(doc_list)

    return result

def get_document(db: Session, document_id: int):
    return db.query(Document).filter(Document.id == document_id).first()

def get_document_with_annotation(db: Session, document_id: int, user_id: int):
    document = get_document(db, document_id)
    if not document:
        return None

    # 获取用户的标注
    annotation = db.query(Annotation).filter(
        Annotation.document_id == document_id,
        Annotation.annotator_id == user_id
    ).first()

    return {
        "document": document,
        "annotation": annotation
    }