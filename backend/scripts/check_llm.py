from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from config import load_backend_env, mask_api_key  # noqa: E402
from services.pii_detector import detect_pii  # noqa: E402

SAMPLE_TEXT = """Employee Onboarding Summary

Emma Rodriguez completed onboarding on March 12, 2026.
For payroll setup, contact emma.rodriguez@company.com or call +1 (415) 555-2381.
Employee ID: EMP-204981.
Emergency contact: Michael Rodriguez, phone +1 (415) 555-9021.
Residential Address: 2450 Mission Street, San Francisco, CA 94110.
"""


async def main() -> None:
    load_backend_env()
    use_llm = os.getenv("USE_LLM", "")
    llm_base_url = os.getenv("LLM_BASE_URL", "")
    llm_model = os.getenv("LLM_MODEL", "")
    llm_provider = os.getenv("LLM_PROVIDER", "")
    llm_api_key = os.getenv("LLM_API_KEY", "")

    print(f"USE_LLM={use_llm}")
    print(f"LLM_PROVIDER={llm_provider}")
    print(f"LLM_BASE_URL={llm_base_url}")
    print(f"LLM_MODEL={llm_model}")
    print(f"LLM_API_KEY_PRESENT={bool(llm_api_key.strip())}")
    print(f"LLM_API_KEY_MASKED={mask_api_key(llm_api_key.strip())}")
    print()

    spans = await detect_pii(SAMPLE_TEXT, "trust")

    print(f"Detected spans: {len(spans)}")
    for span in spans:
        source = "mock"
        if span.pattern_matched.startswith("LLM") or "llm" in span.pattern_matched.lower():
            source = "llm"
        print(f"{span.text} | {span.type} | {span.confidence:.2f} | {source}")


if __name__ == "__main__":
    asyncio.run(main())
