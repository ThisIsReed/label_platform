from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    title: str
    source_content: str
    generated_content: str
    assigned_to: Optional[int] = None  # 分配给的专家用户ID

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    status: str
    word_count_source: int
    word_count_generated: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentList(BaseModel):
    id: int
    title: str
    status: str
    word_count_source: int
    word_count_generated: int
    created_at: str
    assigned_to: Optional[int] = None  # 分配给的专家用户ID

    # 标注状态
    annotation_status: Optional[str] = None  # "已标注", "未标注", "进行中"

    class Config:
        from_attributes = True

# 文档分配相关Schema
class DocumentAssignment(BaseModel):
    document_id: int
    assigned_to: Optional[int] = None  # None表示取消分配

class Config:
    from_attributes = True