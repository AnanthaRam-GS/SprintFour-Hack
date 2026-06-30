import type { Span, SpanAction, SpanType } from "@/types/span";

export interface AuditEntry {
  timestamp: string;
  span_id: string;
  span_text: string;
  span_type: SpanType;
  action: SpanAction;
  confidence: number;
}

export interface BatchJob {
  job_id: string;
  filename: string;
  status: "queued" | "processing" | "needs_review" | "approved" | "rejected";
  session_id?: string | null;
  span_count?: number | null;
  processed_at?: string | null;
}

export interface DecisionRequest {
  session_id: string;
  span_id: string;
  action: SpanAction;
  new_span?: Span;
}

export interface DecisionResponse {
  ok: boolean;
  audit_entry: AuditEntry;
}
