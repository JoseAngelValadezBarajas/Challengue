# Submission Notes

## Summary

This repository implements Parts 1 and 2 as a demoable TypeScript product with a shared redaction domain, Node.js API, CLI, React UI, automated tests, OpenAPI documentation, Docker support, and a SQLite prototype for Part 3.

## Demo Path

1. Install dependencies with `npm run setup`.
2. Start the API and web app with `npm run all`.
3. Open `http://127.0.0.1:5173`.
4. Use the `Redact` tab to redact text and generate a restoration key.
5. Use `Send to unredact` or the `Unredact` tab to restore the document.
6. Optionally load a `.txt` file in the `Redact` or `Documents` tabs instead of pasting text.
7. Use the `Documents` tab to store a redacted document, search by redacted term, inspect applied redactions, and restore the stored document.
8. Run `npm test`, `npm run lint`, `npm run build`, and `npm run openapi:validate`.

## What Was Implemented

- Part 1 redaction with keywords, phrases, straight quotes, and typographic quotes.
- Part 2 unredaction with a non-cryptographic Base64URL restoration key.
- Part 3 SQLite prototype for storing redacted documents, applied redactions, audit events, and exact-match redacted-term search.
- API request IDs, structured request logs, and OpenAPI 3.1 contract.
- CLI, API, and UI adapters over the same shared domain package.
- Optional `.txt` file loading in the UI and CLI while keeping the API contract text-based.

## Key Trade-offs

- Matching is case-sensitive and substring-based to keep behavior explicit and predictable for the assignment.
- The key is intentionally not cryptographic because the prompt says true cryptography is not required.
- SQLite is used only as a local prototype; PostgreSQL and OpenSearch remain the production architecture target.
- Stored-document unredaction is demo-friendly, but production would require authorization, encrypted restoration material, and stronger audit controls.

## Known Limitations

- No production authentication or authorization is implemented because Parts 1 and 2 are scoped as a local demo.
- The SQLite prototype stores restoration material locally for demonstration.
- Search is exact-match by normalized redacted term, not full-text ranking.
- File support is intentionally limited to `.txt`; PDF and DOCX parsing are treated as future ingestion features.
- The UI is optimized for local demonstration rather than large document operations.

## Production Next Steps

- Replace SQLite with PostgreSQL migrations and connection pooling.
- Move search to OpenSearch or hashed exact-match indexes depending on confidentiality needs.
- Store restoration material with envelope encryption and KMS-managed keys.
- Add authentication, authorization, rate limiting, audit exports, and operational dashboards.
- Add CI to run install, lint, tests, build, OpenAPI validation, and critical audit checks.
