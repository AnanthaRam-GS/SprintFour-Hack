from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import load_backend_env, mask_api_key  # noqa: E402
from services.llm_detector import _completion_url  # noqa: E402


def main() -> None:
    load_backend_env()

    base_url = os.getenv("LLM_BASE_URL", "").strip()
    model = os.getenv("LLM_MODEL", "").strip()
    api_key = os.getenv("LLM_API_KEY", "").strip()

    print(f"LLM_BASE_URL={base_url}")
    print(f"LLM_MODEL={model}")
    print(f"LLM_API_KEY_PRESENT={bool(api_key)}")
    print(f"LLM_API_KEY_MASKED={mask_api_key(api_key)}")

    url = _completion_url(base_url)
    print(f"CHAT_COMPLETIONS_URL={url}")

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": 'Return only this JSON: [{"text":"ok","type":"OTHER"}]',
            }
        ],
        "temperature": 0,
        "max_tokens": 200,
    }

    response = httpx.post(
        url,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=float(os.getenv("LLM_TIMEOUT_SECONDS", "30")),
    )

    print(f"STATUS_CODE={response.status_code}")
    body_preview = response.text[:1000]
    print("RESPONSE_PREVIEW_START")
    print(body_preview)
    print("RESPONSE_PREVIEW_END")


if __name__ == "__main__":
    main()
