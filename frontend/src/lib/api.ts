import type { AnalysisRequest, AnalysisResult } from "@/types";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export async function analyzeDocument(
  payload: AnalysisRequest,
): Promise<AnalysisResult> {
  const response = await fetch(`${BACKEND_URL}/api/v1/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Analyze request failed (${response.status}): ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as AnalysisResult;
}
