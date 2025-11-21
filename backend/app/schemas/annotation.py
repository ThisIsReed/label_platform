from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class CommentItem(BaseModel):
    text: str
    selection: str  # 选中的文本内容

class AnnotationBase(BaseModel):
    evaluation: bool  # True=好, False=不好
    comments: List[CommentItem] = []

class AnnotationCreate(AnnotationBase):
    document_id: int

class AnnotationUpdate(BaseModel):
    evaluation: Optional[bool] = None
    comments: Optional[List[CommentItem]] = None
    time_spent: Optional[int] = None
    is_completed: Optional[bool] = None

class Annotation(AnnotationBase):
    id: int
    document_id: int
    annotator_id: int
    time_spent: int
    is_completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AnnotationStats(BaseModel):
    total_documents: int
    annotated_documents: int
    positive_rate: float  # 好评率
    completion_rate: float  # 完成率