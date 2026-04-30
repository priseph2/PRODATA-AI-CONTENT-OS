# Approval and scheduling router
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import json
from datetime import datetime

from ..database import get_db_connection

router = APIRouter(prefix="/api/approval", tags=["approval"])


@router.get("/{workspace_id}")
def get_pending_content(workspace_id: str):
    """Get all draft content pending approval for a workspace"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT * FROM generated_content
        WHERE workspace_id = ? AND status = 'draft'
        ORDER BY created_at DESC
    """, (workspace_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "platform": row["platform"],
            "content_type": row["content_type"],
            "content_text": row["content_text"],
            "status": row["status"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]


@router.post("/{content_id}/approve")
def approve_content(content_id: str):
    """Approve content - moves to publish queue"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM generated_content WHERE id = ?", (content_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Content not found")

    cursor.execute("UPDATE generated_content SET status = 'approved' WHERE id = ?", (content_id,))
    conn.commit()
    conn.close()

    return {"message": "Content approved", "status": "approved"}


@router.post("/{content_id}/reject")
def reject_content(content_id: str):
    """Reject content - marks as rejected"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM generated_content WHERE id = ?", (content_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Content not found")

    cursor.execute("UPDATE generated_content SET status = 'rejected' WHERE id = ?", (content_id,))
    conn.commit()
    conn.close()

    return {"message": "Content rejected", "status": "rejected"}


@router.post("/{content_id}/schedule")
def schedule_content(content_id: str, scheduled_at: str, platform: str):
    """Schedule approved content for publishing"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Verify content exists and is approved
    cursor.execute("SELECT id, status FROM generated_content WHERE id = ?", (content_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Content not found")

    if row["status"] != "approved":
        conn.close()
        raise HTTPException(status_code=400, detail="Content must be approved before scheduling")

    # Create scheduled post
    post_id = str(uuid.uuid())
    cursor.execute("""
        INSERT INTO scheduled_posts (id, content_id, platform, scheduled_at, status)
        VALUES (?, ?, ?, ?, 'scheduled')
    """, (post_id, content_id, platform, scheduled_at))
    conn.commit()
    conn.close()

    return {"message": "Content scheduled", "post_id": post_id}


@router.get("/schedule/{workspace_id}")
def get_scheduled_posts(workspace_id: str):
    """Get all scheduled posts for a workspace"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT sp.*, gc.content_text, gc.content_type
        FROM scheduled_posts sp
        JOIN generated_content gc ON sp.content_id = gc.id
        WHERE gc.workspace_id = ?
        ORDER BY sp.scheduled_at ASC
    """, (workspace_id,))
    rows = cursor.fetchall()
    conn.close()

    return [
        {
            "id": row["id"],
            "content_id": row["content_id"],
            "platform": row["platform"],
            "content_text": row["content_text"],
            "content_type": row["content_type"],
            "scheduled_at": row["scheduled_at"],
            "status": row["status"]
        }
        for row in rows
    ]


import uuid