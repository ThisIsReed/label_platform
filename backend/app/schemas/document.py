from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DocumentBase(BaseModel):
    title: str
    source_content: str
    generated_content: str

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

    # 标注状态
    annotation_status: Optional[str] = None  # "已标注", "未标注", "进行中"

    class Config:
        from_attributes = True