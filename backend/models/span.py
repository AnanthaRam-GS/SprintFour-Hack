from enum import Enum
from typing import Optional

from pydantic import BaseModel, field_validator


class SpanType(str, Enum):
    NAME = "NAME"
    EMAIL = "EMAIL"
    PHONE = "PHONE"
    SSN = "SSN"
    ADDRESS = "ADDRESS"
    DATE_OF_BIRTH = "DATE_OF_BIRTH"
    ID_NUMBER = "ID_NUMBER"
    CREDIT_CARD = "CREDIT_CARD"
    OTHER = "OTHER"


class SpanAction(str, Enum):
    accept = "accept"
    reject = "reject"
    add = "add"


class Span(BaseModel):
    id: str
    start: int
    end: int
    text: str
    type: SpanType
    confidence: float
    explanation: str
    pattern_matched: str
    is_suggested: bool = True
    potentially_missed: bool = False
    decision: Optional[SpanAction] = None

    @field_validator("start")
    @classmethod
    def validate_start(cls, value: int) -> int:
        if value < 0:
            raise ValueError("start must be >= 0")
        return value

    @field_validator("end")
    @classmethod
    def validate_end(cls, value: int, info) -> int:
        start = info.data.get("start")
        if start is not None and value <= start:
            raise ValueError("end must be greater than start")
        return value

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("confidence must be between 0 and 1")
        return value
