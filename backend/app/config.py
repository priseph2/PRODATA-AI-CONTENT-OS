# Default settings for PRO DATA AI CONTENT OS
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # AI - Claude (default)
    claude_api_key: str = ""
    claude_model: str = "claude-sonnet-4-7"

    # AI - OpenAI (alternative)
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # AI Provider selection
    ai_provider: str = "claude"  # "claude" or "openai"

    # App
    debug: bool = True
    app_name: str = "PRO DATA AI CONTENT OS"
    app_version: str = "1.0.0"

    # Database
    database_url: str = "sqlite:///./prod_data_os.db"

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()