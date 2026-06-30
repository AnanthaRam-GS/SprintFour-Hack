from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.mock_detector import detect_mock  # noqa: E402

EMPLOYEE_SAMPLE = """Employee Onboarding Summary

Emma Rodriguez completed onboarding on March 12, 2026.
For payroll setup, contact emma.rodriguez@company.com or call +1 (415) 555-2381.
Employee ID: EMP-204981.
Emergency contact: Michael Rodriguez, phone +1 (415) 555-9021.
Residential Address:
2450 Mission Street
San Francisco, CA 94110
"""

CLIENT_SAMPLE = """Client Investment Review

Prepared for: David Wilson
For follow-up, contact david.wilson@wealthpartners.com or call +1 (212) 555-4411.
Account Number: ACC-98176234
Residential Address:
18 Park Avenue
New York, NY 10016
"""

SUPPORT_SAMPLE = """Support Case Summary

Customer: Olivia Turner
Project Phoenix was escalated by the engineering team.
Primary contact phone: 555-0198
Reviewed by:
Daniel Brooks
Case reference: CASE-98147
Priority High
"""


def print_sample(title: str, text: str, mode: str = "trust") -> None:
    print(f"=== {title} ({mode}) ===")
    spans = detect_mock(text, mode)
    for span in spans:
        print(f"{span.text} | {span.type} | {span.confidence:.2f} | {span.pattern_matched}")
    print()


if __name__ == "__main__":
    print_sample("Employee onboarding sample", EMPLOYEE_SAMPLE)
    print_sample("Client investment sample", CLIENT_SAMPLE)
    print_sample("Support case sample", SUPPORT_SAMPLE)
