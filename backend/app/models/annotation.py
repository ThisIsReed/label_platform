from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    annotator_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # 整体评价：好/不好
    evaluation = Column(Boolean, nullable=False)  # True=好, False=不好

    # 具体评论（JSON格式存储段落标注）
    comments = Column(Text, default="[]")  # JSON格式: [{"text": "评论内容", "selection": "选中的文本"}]

    # 标注用时（秒）
    time_spent = Column(Integer, default=0)

    # 是否已完成
    is_completed = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关联关系
    document = relationship("Document", back_populates="annotations")
    annotator = relationship("User", back_populates="annotations")

    def __repr__(self):
        return f"<Annotation(id={self.id}, document_id={self.document_id}, evaluation={'好' if self.evaluation else '不好'})>"