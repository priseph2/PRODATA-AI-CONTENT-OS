# Content generation router
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime

from ..database import get_db_connection
from ..models.content import (
    ContentGenerateRequest,
    ContentGenerateResponse,
    GeneratedContentItem
)
from ..services.ai_engine import generate_content

router = APIRouter(prefix="/api/generate", tags=["generation"])


def get_workspace_profile(workspace_id: str) -> dict:
    """Fetch workspace as a profile dict for the AI engine"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workspaces WHERE id = ?", (workspace_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Workspace not found")

    return {
        "name": row["name"],
        "niche": row["niche"],
        "brand_voice": row["brand_voice"] or "",
        "cta_style": row["cta_style"] or "",
        "target_audience": row["target_audience"] or "",
        "forbidden_words": json.loads(row["forbidden_words"]) if row["forbidden_words"] else [],
        "content_pillars": json.loads(row["content_pillars"]) if row["content_pillars"] else [],
        "brand_colors": json.loads(row["brand_colors"]) if row["brand_colors"] else []
    }


@router.post("/content", response_model=ContentGenerateResponse)
def generate_content_endpoint(data: ContentGenerateRequest):
    """
    Generate content for specified platforms using AI prompt chaining.

    Input: raw content text + workspace_id + platforms
    Output: structured batch of platform-specific content
    """
    # Get workspace profile
    workspace_profile = get_workspace_profile(data.workspace_id)

    # Run AI content engine
    result = generate_content(
        workspace_profile=workspace_profile,
        content=data.input_text,
        platforms=data.platforms
    )

    # Store input in database
    conn = get_db_connection()
    cursor = conn.cursor()

    input_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    cursor.execute("""
        INSERT INTO content_inputs (id, workspace_id, input_type, raw_content, extracted_metadata, created_at)
        VALUES (?, ?, 'text', ?, ?, ?)
    """, (input_id, data.workspace_id, data.input_text, json.dumps(result.get("metadata", {})), now))
    conn.commit()

    # Store generated content
    generated_items = []
    for platform, platform_content in result.get("content", {}).items():
        for content_type, outputs in platform_content.items():
            for output_text in outputs:
                content_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO generated_content (id, workspace_id, input_id, content_type, platform, content_text, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, 'draft', ?)
                """, (content_id, data.workspace_id, input_id, content_type, platform, output_text, now))
                conn.commit()

                generated_items.append(GeneratedContentItem(
                    platform=platform,
                    content_type=content_type,
                    content_text=output_text
                ))

    conn.close()

    return ContentGenerateResponse(
        success=True,
        input_id=input_id,
        generated_content=generated_items,
        metadata=result.get("metadata", {})
    )


@router.get("/content/{workspace_id}")
def get_generated_content(workspace_id: str, platform: Optional[str] = None):
    """Get all generated content for a workspace, optionally filtered by platform"""
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM generated_content WHERE workspace_id = ?"
    params = [workspace_id]

    if platform:
        query += " AND platform = ?"
        params.append(platform)

    query += " ORDER BY created_at DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "workspace_id": row["workspace_id"],
            "content_type": row["content_type"],
            "platform": row["platform"],
            "content_text": row["content_text"],
            "status": row["status"],
            "scheduled_at": row["scheduled_at"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]


import json