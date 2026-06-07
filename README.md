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

## Demo In 5 Minutes

1. Run `npm run setup`.
2. Run `npm run all`.
3. Open `http://127.0.0.1:5173`.
4. Use `Redact` to mask a document and generate a key.
5. Use `Send to unredact` to restore the generated document.
6. Use `Documents` to store a redacted document in SQLite and search by redacted term.
7. Run `npm test`, `npm run lint`, `npm run build`, and `npm run openapi:validate`.

## How To Review This Submission

1. Start with `docs/submission-notes.md` for the reviewer-oriented overview.
2. Run `npm ci` or `npm run setup`.
3. Run the verification suite:

```bash
npm test
npm run lint
npm run build
npm run openapi:validate
```

4. Run `npm run all` and open `http://127.0.0.1:5173`.
5. Review `docs/technical-walkthrough.md` for implementation trade-offs.
6. Review `docs/adr-001-document-storage-and-search.md` for the Part 3 production architecture discussion.

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

```bash
npm run openapi:validate
```

## Technical Discussion

See `docs/technical-walkthrough.md` for the process, trade-offs, edge cases, and production-hardening discussion.

See `docs/submission-notes.md` for reviewer-oriented submission notes.

## CI

GitHub Actions runs install, lint, tests, build, OpenAPI validation, critical audit checks, and Docker Compose config validation on pushes and pull requests to `main` or `master`.

## Security Note

The restoration key is deliberately not secure because the assignment states that true cryptography is not required. Base64URL is encoding, not encryption. A production system should keep restoration material encrypted, access-controlled, audited, and separate from search indexes.

The SQLite prototype stores restoration material locally to support demo unredaction and redaction inspection. That is acceptable for this exercise but would be replaced with KMS-backed envelope encryption and stricter access policies in production.

## Known Limitations

- Matching is case-sensitive and substring-based. This is explicit and deterministic, but a production product might add whole-word or case-insensitive options.
- The `XXXX` placeholder is fixed by the assignment. If source text already contains `XXXX`, unredaction relies on placeholder count matching the generated key.
- The restoration key is Base64URL-encoded metadata, not encryption.
- SQLite is used as a local Part 3 prototype, not as the intended multi-instance production database.
- Authentication and authorization are not implemented because Parts 1 and 2 are scoped as a local demo. They would be required before exposing stored documents or unredaction externally.

## Part 3

See `docs/adr-001-document-storage-and-search.md` for the proposed architecture to store documents, search by redacted keywords, and expose the system to external consumers.

## Commit Style

Use Conventional Commits:

- `chore: initialize monorepo tooling`
- `feat(domain): implement redaction engine`
- `feat(api): expose redaction endpoints`
- `feat(web): build redaction workspace`
- `docs: add part 3 architecture proposal`
