import json
import logging
import httpx
import re
from typing import Dict, Any, List, Optional
from app.config.config import settings

logger = logging.getLogger("datalens.llm_client")

def is_llm_available() -> bool:
    """Returns True if any supported LLM API key (Mistral, Groq, or Grok) is configured."""
    return bool(
        (settings.MISTRAL_API_KEY and settings.MISTRAL_API_KEY.strip()) or 
        (settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()) or
        (settings.GROK_API_KEY and settings.GROK_API_KEY.strip())
    )

def get_active_provider_name() -> str:
    """Returns the primary active LLM provider name."""
    if settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip():
        return "Groq"
    elif settings.MISTRAL_API_KEY and settings.MISTRAL_API_KEY.strip():
        return "Mistral AI"
    elif settings.GROK_API_KEY and settings.GROK_API_KEY.strip():
        return "xAI Grok"
    return "None (Deterministic Fallback)"

def _prepare_payload(
    messages: List[Dict[str, str]],
    model: str,
    temperature: float = 0.0,
    response_format: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature
    }
    if response_format:
        payload["response_format"] = response_format
    return payload

def clean_llm_output(content: str) -> str:
    """Strips markdown code fences like ```json ... ``` from LLM output if present."""
    if not content:
        return ""
    text = content.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text

async def call_llm_async(
    messages: List[Dict[str, str]],
    temperature: float = 0.0,
    response_format: Optional[Dict[str, str]] = None,
    timeout: float = 30.0
) -> str:
    """
    Executes an async LLM request with graceful multi-provider fallback:
    1. Mistral AI (if MISTRAL_API_KEY configured)
    2. GroqCloud (if GROQ_API_KEY configured)
    3. xAI Grok (if GROK_API_KEY configured)
    """
    mistral_key = (settings.MISTRAL_API_KEY or "").strip()
    groq_key = (settings.GROQ_API_KEY or "").strip()
    grok_key = (settings.GROK_API_KEY or "").strip()

    errors: List[str] = []

    # 1. Try Mistral if key is available
    if mistral_key:
        try:
            headers = {
                "Authorization": f"Bearer {mistral_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.MISTRAL_MODEL, temperature, response_format)
            url = f"{settings.MISTRAL_API_BASE_URL.rstrip('/')}/chat/completions"
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    return clean_llm_output(content)
        except Exception as e:
            logger.warning(f"[LLM Client] Mistral API call failed: {e}. Checking fallback providers...")
            errors.append(f"Mistral: {e}")

    # 2. Try Groq as fallback or primary
    if groq_key:
        try:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.GROQ_MODEL, temperature, response_format)
            url = f"{settings.GROQ_API_BASE_URL.rstrip('/')}/chat/completions"
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    logger.info("[LLM Client] Successfully received response from Groq.")
                    return clean_llm_output(content)
        except Exception as e:
            logger.warning(f"[LLM Client] Groq API call failed: {e}. Checking next provider...")
            errors.append(f"Groq: {e}")

    # 3. Try Grok (xAI) as fallback or primary
    if grok_key:
        try:
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.GROK_MODEL, temperature, response_format)
            url = f"{settings.GROK_API_BASE_URL.rstrip('/')}/chat/completions"
            
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    logger.info("[LLM Client] Successfully received response from Grok.")
                    return clean_llm_output(content)
        except Exception as e:
            logger.error(f"[LLM Client] Grok API call failed: {e}")
            errors.append(f"Grok: {e}")

    if not mistral_key and not groq_key and not grok_key:
        raise RuntimeError("No LLM API keys are configured (neither MISTRAL_API_KEY, GROQ_API_KEY, nor GROK_API_KEY).")
    
    raise RuntimeError(f"All configured LLM providers failed: {'; '.join(errors)}")

def call_llm_sync(
    messages: List[Dict[str, str]],
    temperature: float = 0.0,
    response_format: Optional[Dict[str, str]] = None,
    timeout: float = 15.0
) -> str:
    """
    Synchronous version of call_llm for sync routines (e.g. Optuna loops).
    Fallback chain: Mistral -> Groq -> Grok.
    """
    mistral_key = (settings.MISTRAL_API_KEY or "").strip()
    groq_key = (settings.GROQ_API_KEY or "").strip()
    grok_key = (settings.GROK_API_KEY or "").strip()

    errors: List[str] = []

    # 1. Try Mistral
    if mistral_key:
        try:
            headers = {
                "Authorization": f"Bearer {mistral_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.MISTRAL_MODEL, temperature, response_format)
            url = f"{settings.MISTRAL_API_BASE_URL.rstrip('/')}/chat/completions"
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    return clean_llm_output(content)
        except Exception as e:
            logger.warning(f"[LLM Client Sync] Mistral call failed: {e}. Attempting fallback...")
            errors.append(f"Mistral: {e}")

    # 2. Try Groq
    if groq_key:
        try:
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.GROQ_MODEL, temperature, response_format)
            url = f"{settings.GROQ_API_BASE_URL.rstrip('/')}/chat/completions"
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    logger.info("[LLM Client Sync] Successfully received response from Groq.")
                    return clean_llm_output(content)
        except Exception as e:
            logger.warning(f"[LLM Client Sync] Groq call failed: {e}. Attempting next provider...")
            errors.append(f"Groq: {e}")

    # 3. Try Grok (xAI)
    if grok_key:
        try:
            headers = {
                "Authorization": f"Bearer {grok_key}",
                "Content-Type": "application/json"
            }
            payload = _prepare_payload(messages, settings.GROK_MODEL, temperature, response_format)
            url = f"{settings.GROK_API_BASE_URL.rstrip('/')}/chat/completions"
            
            with httpx.Client(timeout=timeout) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                if content:
                    logger.info("[LLM Client Sync] Successfully received response from Grok.")
                    return clean_llm_output(content)
        except Exception as e:
            logger.error(f"[LLM Client Sync] Grok call failed: {e}")
            errors.append(f"Grok: {e}")

    if not mistral_key and not groq_key and not grok_key:
        raise RuntimeError("No LLM API keys are configured (neither MISTRAL_API_KEY, GROQ_API_KEY, nor GROK_API_KEY).")

    raise RuntimeError(f"All configured LLM providers failed: {'; '.join(errors)}")
