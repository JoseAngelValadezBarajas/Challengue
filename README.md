# Meltwater Technical Exercise

Professional TypeScript implementation of the redaction exercise with a shared domain package, Node.js API, CLI, React demo app, automated tests, and architecture notes for the storage/search extension.

## Requirements

- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run

```bash
npm run dev:api
npm run dev:web
```

The API runs on `http://localhost:4000` by default. The web app runs on the Vite URL printed by `npm run dev:web`.

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

## Design Decisions

- Redaction matching is case-sensitive by default.
- Phrases and longer terms are matched before shorter terms to avoid partial replacements.
- The unredaction key is intentionally not cryptographic. It is a Base64URL-encoded payload containing the original redacted values in document order.
- The core logic is pure TypeScript in `packages/domain` so the CLI, API, and UI all exercise the same behavior.

## Part 3

See `docs/adr-001-document-storage-and-search.md` for the proposed architecture to store documents, search by redacted keywords, and expose the system to external consumers.

## Commit Style

Use Conventional Commits:

- `chore: initialize monorepo tooling`
- `feat(domain): implement redaction engine`
- `feat(api): expose redaction endpoints`
- `feat(web): build redaction workspace`
- `docs: add part 3 architecture proposal`
