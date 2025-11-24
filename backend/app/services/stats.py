from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
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

def get_temporal_stats(db: Session, days: int = 30):
    """获取时间维度的统计数据"""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    try:
        # 每日标注量统计 - 修复兼容性问题
        daily_annotations = db.query(
            func.date(Annotation.created_at).label('date'),
            func.count(Annotation.id).label('count'),
            func.sum(func.cast(Annotation.evaluation, int)).label('positive_count')
        ).filter(
            Annotation.created_at >= start_date,
            Annotation.created_at <= end_date
        ).group_by(
            func.date(Annotation.created_at)
        ).order_by('date').all()

        return [
            {
                "date": str(item.date),
                "annotations": item.count,
                "approval_rate": round((item.positive_count / item.count * 100), 2) if item.count > 0 else 0
            }
            for item in daily_annotations
        ]
    except Exception as e:
        # 如果查询失败，返回空数据
        return []

def get_user_activity_distribution(db: Session):
    """获取用户活跃度分布"""
    try:
        user_activity = db.query(
            User.id,
            User.username,
            func.count(Annotation.id).label('annotation_count'),
            func.sum(func.cast(Annotation.evaluation, int)).label('positive_count'),
            func.sum(Annotation.time_spent).label('total_time'),
            func.avg(Annotation.time_spent).label('avg_time')
        ).join(
            Annotation, User.id == Annotation.annotator_id
        ).filter(
            User.role == "expert"
        ).group_by(
            User.id, User.username
        ).all()

        return [
            {
                "user_id": item.id,
                "username": item.username,
                "annotation_count": item.annotation_count,
                "approval_rate": round((item.positive_count / item.annotation_count * 100), 2) if item.annotation_count > 0 else 0,
                "total_time_minutes": round(item.total_time / 60, 2) if item.total_time else 0,
                "avg_time_minutes": round(item.avg_time / 60, 2) if item.avg_time else 0
            }
            for item in user_activity
        ]
    except Exception as e:
        # 如果查询失败，返回空数据
        return []

def get_document_completion_stats(db: Session):
    """获取文档完成状态分布"""
    # 文档状态统计
    total_docs = db.query(Document).count()
    completed_docs = db.query(Document.id).join(Annotation).filter(
        Annotation.is_completed == True
    ).distinct().count()

    # 每个文档的标注人数
    doc_annotation_counts = db.query(
        Document.id,
        func.count(Annotation.id).label('annotation_count'),
        func.count(func.distinct(Annotation.annotator_id)).label('annotator_count')
    ).outerjoin(
        Annotation
    ).group_by(Document.id).all()

    return {
        "total_documents": total_docs,
        "completed_documents": completed_docs,
        "completion_rate": round((completed_docs / total_docs * 100), 2) if total_docs > 0 else 0,
        "documents_per_annotator": [
            {
                "document_id": item.id,
                "annotations_count": item.annotation_count,
                "annotators_count": item.annotator_count
            }
            for item in doc_annotation_counts
        ]
    }

def get_approval_rate_analysis(db: Session):
    """获取好评率详细分析"""
    # 总体好评率
    total_evaluations = db.query(Annotation).filter(Annotation.evaluation.isnot(None)).count()
    positive_evaluations = db.query(Annotation).filter(Annotation.evaluation == True).count()
    overall_rate = round((positive_evaluations / total_evaluations * 100), 2) if total_evaluations > 0 else 0

    # 按用户分析好评率 - 修复兼容性问题
    try:
        user_approval_rates = db.query(
            User.id,
            User.username,
            func.sum(func.cast(Annotation.evaluation, int)).label('positive_count'),
            func.count(Annotation.id).label('count')
        ).join(
            Annotation, User.id == Annotation.annotator_id
        ).filter(
            User.role == "expert"
        ).group_by(
            User.id, User.username
        ).all()

        return {
            "overall_approval_rate": overall_rate,
            "total_evaluations": total_evaluations,
            "positive_evaluations": positive_evaluations,
            "user_approval_rates": [
                {
                    "user_id": item.id,
                    "username": item.username,
                    "approval_rate": round((item.positive_count / item.count * 100), 2) if item.count > 0 else 0,
                    "evaluation_count": item.count
                }
                for item in user_approval_rates
            ]
        }
    except Exception as e:
        # 如果查询失败，返回基本统计信息
        return {
            "overall_approval_rate": overall_rate,
            "total_evaluations": total_evaluations,
            "positive_evaluations": positive_evaluations,
            "user_approval_rates": []
        }