from sqlalchemy import func
from sqlalchemy.orm import Session
from ..models.document import Document
from ..models.annotation import Annotation
from ..models.user import User

def get_annotation_stats(db: Session):
    # 总文档数
    total_documents = db.query(Document).count()

    # 已完成标注的文档数
    annotated_documents = db.query(Document.id).join(Annotation).filter(
        Annotation.is_completed == True
    ).distinct().count()

    # 好评率统计
    positive_annotations = db.query(Annotation).filter(Annotation.evaluation == True).count()
    total_annotations = db.query(Annotation).count()
    positive_rate = (positive_annotations / total_annotations * 100) if total_annotations > 0 else 0

    # 完成率
    completion_rate = (annotated_documents / total_documents * 100) if total_documents > 0 else 0

    return {
        "total_documents": total_documents,
        "annotated_documents": annotated_documents,
        "positive_rate": round(positive_rate, 2),
        "completion_rate": round(completion_rate, 2)
    }

def get_user_stats(db: Session, user_id: int):
    # 用户完成的标注数
    user_annotations = db.query(Annotation).filter(
        Annotation.annotator_id == user_id,
        Annotation.is_completed == True
    ).count()

    # 用户好评率
    user_positive = db.query(Annotation).filter(
        Annotation.annotator_id == user_id,
        Annotation.evaluation == True
    ).count()
    user_total = db.query(Annotation).filter(
        Annotation.annotator_id == user_id
    ).count()
    user_positive_rate = (user_positive / user_total * 100) if user_total > 0 else 0

    # 用户总用时
    total_time = db.query(func.sum(Annotation.time_spent)).filter(
        Annotation.annotator_id == user_id
    ).scalar() or 0

    return {
        "completed_annotations": user_annotations,
        "positive_rate": round(user_positive_rate, 2),
        "total_time_minutes": round(total_time / 60, 2)
    }

def get_all_user_stats(db: Session):
    users = db.query(User).filter(User.role == "expert").all()
    result = []
    for user in users:
        stats = get_user_stats(db, user.id)
        result.append({
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            **stats
        })
    return result