from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False)
    source_content = Column(Text, nullable=False)  # 原始素材
    generated_content = Column(Text, nullable=False)  # AI生成内容
    status = Column(String(20), default="pending")  # pending, in_progress, completed
    word_count_source = Column(Integer, default=0)
    word_count_generated = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关联标注
    annotations = relationship("Annotation", back_populates="document")

    def __repr__(self):
        return f"<Document(id={self.id}, title='{self.title[:50]}...')>"