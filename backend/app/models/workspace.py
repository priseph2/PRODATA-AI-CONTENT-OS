# Workspace models
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime


class WorkspaceBase(BaseModel):
    name: str
    niche: Optional[str] = None
    website_url: Optional[str] = None
    social_handles: Optional[Dict[str, str]] = {}
    brand_colors: Optional[List[str]] = []
    brand_voice: Optional[str] = ""
    cta_style: Optional[str] = ""
    target_audience: Optional[str] = ""
    offer_products: Optional[str] = ""
    forbidden_words: Optional[List[str]] = []
    content_pillars: Optional[List[str]] = []


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    niche: Optional[str] = None
    website_url: Optional[str] = None
    social_handles: Optional[Dict[str, str]] = None
    brand_colors: Optional[List[str]] = None
    brand_voice: Optional[str] = None
    cta_style: Optional[str] = None
    target_audience: Optional[str] = None
    offer_products: Optional[str] = None
    forbidden_words: Optional[List[str]] = None
    content_pillars: Optional[List[str]] = None
    is_active: Optional[bool] = None


class Workspace(WorkspaceBase):
    id: str
    is_active: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True