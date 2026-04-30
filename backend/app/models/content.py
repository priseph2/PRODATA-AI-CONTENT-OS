# Content and generation models
from pydantic import BaseModel
from typing import Optional, List, Dict, Literal
from datetime import datetime


class ContentInputBase(BaseModel):
    input_type: Literal["text", "blog_url", "youtube_url", "product_url", "pdf", "transcript", "offer"]
    raw_content: str


class ContentInputCreate(ContentInputBase):
    workspace_id: str


class ContentInput(ContentInputBase):
    id: str
    workspace_id: str
    extracted_metadata: Optional[Dict] = {}
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ContentGenerateRequest(BaseModel):
    workspace_id: str
    input_text: str
    platforms: Optional[List[str]] = ["instagram", "facebook", "linkedin", "twitter"]
    content_types: Optional[List[str]] = None


class GeneratedContentItem(BaseModel):
    platform: str
    content_type: str
    content_text: str


class ContentGenerateResponse(BaseModel):
    success: bool
    input_id: str
    generated_content: List[GeneratedContentItem]
    metadata: Optional[Dict] = {}


class GeneratedContent(BaseModel):
    id: str
    workspace_id: str
    input_id: Optional[str] = None
    content_type: str
    platform: str
    content_text: str
    status: str = "draft"
    scheduled_at: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True