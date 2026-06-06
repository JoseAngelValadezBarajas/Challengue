# Meltwater Technical Exercise

Professional TypeScript implementation of the redaction exercise with a shared domain package, Node.js API, CLI, React demo app, automated tests, and architecture notes for the storage/search extension.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm run setup
```

## Run

```bash
npm run all
```

The API runs on `http://localhost:4000` by default. The web app runs on the Vite URL printed by `npm run dev:web`.

## Docker Demo

```bash
docker compose up --build
```

Docker exposes the API on `http://localhost:4000` and the web app on `http://localhost:5173`.

## CLI Demo

```bash
npm run cli -- redact --terms "Hello,beer" --text "Hello from headquarters with beer"
npm run cli -- unredact --key "<key>" --text "XXXX from headquarters with XXXX"
```

Use `--json` on either command for machine-readable output.

## API Demo

```bash
curl -X POST http://localhost:4000/redactions \
  -H "Content-Type: application/json" \
  -d "{\"terms\":\"Hello world, beer\",\"documentText\":\"Hello world with beer\"}"
```

```bash
curl -X POST http://localhost:4000/unredactions \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"<key>\",\"documentText\":\"XXXX with XXXX\"}"
```

## Stored Document Demo

Part 3 is implemented as a lightweight SQLite prototype for local demo purposes. The production architecture remains PostgreSQL plus a protected search index as described in the ADR.

```bash
curl -X POST http://localhost:4000/documents/redactions \
  -H "Content-Type: application/json" \
  -d "{\"terms\":\"beer\",\"documentText\":\"The agent ordered beer\",\"metadata\":{\"title\":\"Demo briefing\",\"classification\":\"secret\",\"ownerId\":\"demo-user\"}}"
```

```bash
curl "http://localhost:4000/documents?redactedTerm=beer"
curl "http://localhost:4000/documents/<document-id>"
curl "http://localhost:4000/documents/<document-id>/redactions"
curl -X POST http://localhost:4000/documents/<document-id>/unredactions \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"<key>\"}"
```

## Design Decisions

- Redaction matching is case-sensitive by default.
- Keywords are separated by spaces or commas.
- Phrases can use straight quotes (`"`, `'`) or typographic quotes.
- Phrases and longer terms are matched before shorter terms to avoid partial replacements.
- The unredaction key is intentionally not cryptographic. It is a Base64URL-encoded payload containing the original redacted values in document order.
- The core logic is pure TypeScript in `packages/domain` so the CLI, API, and UI all exercise the same behavior.
- The API includes request IDs in headers and error payloads to make local debugging and production-style tracing easier.
- Stored-document endpoints use SQLite as a local persistence prototype. The repository boundary is intentionally isolated so it can be replaced by PostgreSQL in production.

## API Contract

See `docs/openapi.yaml` for the OpenAPI 3.1 contract.

## Technical Discussion

See `docs/technical-walkthrough.md` for the process, trade-offs, edge cases, and production-hardening discussion.

## Security Note

The restoration key is deliberately not secure because the assignment states that true cryptography is not required. Base64URL is encoding, not encryption. A production system should keep restoration material encrypted, access-controlled, audited, and separate from search indexes.

The SQLite prototype stores restoration material locally to support demo unredaction and redaction inspection. That is acceptable for this exercise but would be replaced with KMS-backed envelope encryption and stricter access policies in production.

## Part 3

See `docs/adr-001-document-storage-and-search.md` for the proposed architecture to store documents, search by redacted keywords, and expose the system to external consumers.

## Commit Style

Use Conventional Commits:

- `chore: initialize monorepo tooling`
- `feat(domain): implement redaction engine`
- `feat(api): expose redaction endpoints`
- `feat(web): build redaction workspace`
- `docs: add part 3 architecture proposal`
