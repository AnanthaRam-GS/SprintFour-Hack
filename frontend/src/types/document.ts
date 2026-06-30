import type { Span } from "@/types/span";

export type AppMode = "trust" | "batch" | "correction";

export interface AppDocument {
  id: string;
  filename: string;
  text: string;
  uploaded_at: string;
}

export interface AnalysisRequest {
  text: string;
  filename: string;
  mode: AppMode;
}

export interface AnalysisResult {
  session_id: string;
  document: AppDocument;
  spans: Span[];
  mode: AppMode;
}
