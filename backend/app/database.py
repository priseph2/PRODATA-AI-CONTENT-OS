# Database connection and session management
import sqlite3
from pathlib import Path
from typing import Optional

DATABASE_PATH = Path(__file__).parent.parent / "prod_data_os.db"


def get_db_connection():
    """Get a database connection with row factory enabled"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Workspaces table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            niche TEXT,
            website_url TEXT,
            social_handles TEXT,
            brand_colors TEXT,
            brand_voice TEXT,
            cta_style TEXT,
            target_audience TEXT,
            offer_products TEXT,
            forbidden_words TEXT,
            content_pillars TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Content inputs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_inputs (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            input_type TEXT NOT NULL,
            raw_content TEXT NOT NULL,
            extracted_metadata TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
        )
    """)

    # Generated content table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_content (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            input_id TEXT,
            content_type TEXT NOT NULL,
            platform TEXT NOT NULL,
            content_text TEXT NOT NULL,
            status TEXT DEFAULT 'draft',
            scheduled_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (input_id) REFERENCES content_inputs(id) ON DELETE SET NULL
        )
    """)

    # Visual assets table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS visual_assets (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            content_id TEXT,
            asset_type TEXT NOT NULL,
            file_path TEXT,
            template_style TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (content_id) REFERENCES generated_content(id) ON DELETE SET NULL
        )
    """)

    # Recipes table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recipes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            trigger_type TEXT NOT NULL,
            actions TEXT NOT NULL,
            schedule TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Scheduled posts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scheduled_posts (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            scheduled_at TEXT NOT NULL,
            published_at TEXT,
            status TEXT DEFAULT 'scheduled',
            FOREIGN KEY (content_id) REFERENCES generated_content(id) ON DELETE CASCADE
        )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully.")


if __name__ == "__main__":
    init_db()