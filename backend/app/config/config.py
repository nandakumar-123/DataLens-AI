from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    # Primary LLM config (Mistral AI)
    MISTRAL_API_BASE_URL: str = "https://api.mistral.ai/v1"
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"
    
    # Fallback/Alternative LLM config (GroqCloud - https://console.groq.com/keys)
    GROQ_API_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # Fallback/Alternative LLM config (xAI Grok - https://console.x.ai)
    GROK_API_BASE_URL: str = "https://api.x.ai/v1"
    GROK_API_KEY: str = ""
    GROK_MODEL: str = "grok-2-latest"
    
    # Database config
    DATABASE_URL: str = "sqlite:///./datalens.db"
    
    # App config
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    MAX_UPLOAD_SIZE_MB: int = 50
    UPLOAD_DIR: str = "./data/uploads"
    
    class Config:
        # Load from project root, assume backend is in <root>/backend
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), ".env")

settings = Settings()
if settings.MISTRAL_API_KEY:
    settings.MISTRAL_API_KEY = settings.MISTRAL_API_KEY.strip()
if settings.GROQ_API_KEY:
    settings.GROQ_API_KEY = settings.GROQ_API_KEY.strip()
if settings.GROK_API_KEY:
    settings.GROK_API_KEY = settings.GROK_API_KEY.strip()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
