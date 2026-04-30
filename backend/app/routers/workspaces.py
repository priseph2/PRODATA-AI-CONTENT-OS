# Workspaces router
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from typing import List, Optional

from ..database import get_db_connection
from ..models.workspace import Workspace, WorkspaceCreate, WorkspaceUpdate

import json

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


def row_to_workspace(row) -> Workspace:
    """Convert database row to Workspace model"""
    return Workspace(
        id=row["id"],
        name=row["name"],
        niche=row["niche"],
        website_url=row["website_url"],
        social_handles=json.loads(row["social_handles"]) if row["social_handles"] else {},
        brand_colors=json.loads(row["brand_colors"]) if row["brand_colors"] else [],
        brand_voice=row["brand_voice"] or "",
        cta_style=row["cta_style"] or "",
        target_audience=row["target_audience"] or "",
        offer_products=row["offer_products"] or "",
        forbidden_words=json.loads(row["forbidden_words"]) if row["forbidden_words"] else [],
        content_pillars=json.loads(row["content_pillars"]) if row["content_pillars"] else [],
        is_active=bool(row["is_active"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.get("", response_model=List[Workspace])
def list_workspaces(active_only: bool = True):
    """List all workspaces"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM workspaces"
    if active_only:
        query += " WHERE is_active = 1"
    query += " ORDER BY name ASC"

    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()

    return [row_to_workspace(row) for row in rows]


@router.post("", response_model=Workspace, status_code=status.HTTP_201_CREATED)
def create_workspace(data: WorkspaceCreate):
    """Create a new workspace"""
    conn = get_db_connection()
    cursor = conn.cursor()

    workspace_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO workspaces (
            id, name, niche, website_url, social_handles, brand_colors,
            brand_voice, cta_style, target_audience, offer_products,
            forbidden_words, content_pillars, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    """, (
        workspace_id,
        data.name,
        data.niche or None,
        data.website_url or None,
        json.dumps(data.social_handles or {}),
        json.dumps(data.brand_colors or []),
        data.brand_voice or "",
        data.cta_style or "",
        data.target_audience or "",
        data.offer_products or "",
        json.dumps(data.forbidden_words or []),
        json.dumps(data.content_pillars or []),
        now,
        now
    ))

    conn.commit()
    conn.close()

    return Workspace(
        id=workspace_id,
        name=data.name,
        niche=data.niche,
        website_url=data.website_url,
        social_handles=data.social_handles or {},
        brand_colors=data.brand_colors or [],
        brand_voice=data.brand_voice or "",
        cta_style=data.cta_style or "",
        target_audience=data.target_audience or "",
        offer_products=data.offer_products or "",
        forbidden_words=data.forbidden_words or [],
        content_pillars=data.content_pillars or [],
        is_active=True,
        created_at=now,
        updated_at=now
    )


@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(workspace_id: str):
    """Get a single workspace by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return row_to_workspace(row)


@router.put("/{workspace_id}", response_model=Workspace)
def update_workspace(workspace_id: str, data: WorkspaceUpdate):
    """Update a workspace"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get current workspace
    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Build update query dynamically
    updates = []
    params = []

    if data.name is not None:
        updates.append("name = ?")
        params.append(data.name)
    if data.niche is not None:
        updates.append("niche = ?")
        params.append(data.niche)
    if data.website_url is not None:
        updates.append("website_url = ?")
        params.append(data.website_url)
    if data.social_handles is not None:
        updates.append("social_handles = ?")
        params.append(json.dumps(data.social_handles))
    if data.brand_colors is not None:
        updates.append("brand_colors = ?")
        params.append(json.dumps(data.brand_colors))
    if data.brand_voice is not None:
        updates.append("brand_voice = ?")
        params.append(data.brand_voice)
    if data.cta_style is not None:
        updates.append("cta_style = ?")
        params.append(data.cta_style)
    if data.target_audience is not None:
        updates.append("target_audience = ?")
        params.append(data.target_audience)
    if data.offer_products is not None:
        updates.append("offer_products = ?")
        params.append(data.offer_products)
    if data.forbidden_words is not None:
        updates.append("forbidden_words = ?")
        params.append(json.dumps(data.forbidden_words))
    if data.content_pillars is not None:
        updates.append("content_pillars = ?")
        params.append(json.dumps(data.content_pillars))
    if data.is_active is not None:
        updates.append("is_active = ?")
        params.append(1 if data.is_active else 0)

    updates.append("updated_at = ?")
    params.append(datetime.utcnow().isoformat())

    params.append(workspace_id)

    cursor.execute(f"UPDATE workspaces SET {', '.join(updates)} WHERE id = ?", params)
    conn.commit()

    # Fetch updated row
    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
    updated_row = cursor.fetchone()
    conn.close()

    return row_to_workspace(updated_row)


@router.delete("/{workspace_id}")
def delete_workspace(workspace_id: str):
    """Delete a workspace (soft delete - sets is_active to 0)"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM workspaces WHERE id = ?", (workspace_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Workspace not found")

    cursor.execute("UPDATE workspaces SET is_active = 0, updated_at = ? WHERE id = ?",
                   (datetime.utcnow().isoformat(), workspace_id))
    conn.commit()
    conn.close()

    return {"message": "Workspace deleted successfully"}


import json