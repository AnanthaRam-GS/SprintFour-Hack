export type SpanType =
  | "NAME"
  | "EMAIL"
  | "PHONE"
  | "SSN"
  | "ADDRESS"
  | "DATE_OF_BIRTH"
  | "ID_NUMBER"
  | "CREDIT_CARD"
  | "OTHER";

export type SpanAction = "accept" | "reject" | "add";

export interface Span {
  id: string;
  start: number;
  end: number;
  text: string;
  type: SpanType;
  confidence: number;
  explanation: string;
  pattern_matched: string;
  is_suggested: boolean;
  potentially_missed: boolean;
  decision?: SpanAction | null;
}
