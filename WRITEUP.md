# Conseal Writeup

Conseal is a deployable MVP for reviewing sensitive information before documents are shared with AI systems. The product is built around a simple idea: detection alone is not enough. Users need to understand what was flagged, correct mistakes, and export a reviewed document with an audit trail. That requirement shaped both the architecture and the feature choices.

The implementation focuses on three review workflows:

- **Trust Review**
  - helps users inspect why content was flagged and why visible content was left alone
- **Correction Review**
  - helps users catch missed PII, reject false positives, and slow down overconfident review
- **Batch Review**
  - provides a lightweight queue for processing multiple text files without building a full backend job system

The most important architectural decision was to build one shared review engine instead of three disconnected demos. The document viewer, span highlights, action bar, audit panel, export flow, and core review state are reused across all modes. That keeps the codebase smaller, makes behavior more consistent, and demonstrates a stronger systems design story for the hackathon.

The detector strategy is intentionally pragmatic. Conseal supports an optional OpenAI-compatible LLM detector, but it does not depend on one. If LLM detection fails, the backend falls back to a deterministic heuristic detector that can still catch common names, emails, phones, IDs, addresses, SSNs, and DOB-style values. This keeps the demo reliable even when cloud connectivity or provider behavior is unstable.

Several scope cuts were deliberate. There is no auth, no database, no PDF or DOCX parsing, no backend batch queue, and no bulk batch ZIP export. Those cuts were made to keep the project focused on review quality, explainability, correction behavior, and audited export rather than infrastructure-heavy features that would dilute the core product story in a limited build window.

Conseal is not presented as a production-ready platform. It is a strong prototype that demonstrates the review layer needed between raw detection and safe AI document sharing.
