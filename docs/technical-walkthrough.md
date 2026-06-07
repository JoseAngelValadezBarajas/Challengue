# Technical Walkthrough

## Problem Framing

The assignment asks for a demoable program that redacts keywords and quoted phrases from text, then restores those redactions with a key that does not need to be cryptographically secure. The implementation treats redaction as a domain problem first, then exposes that domain through CLI, API, and React UI adapters.

## Approach

- Keep parsing, redaction, key encoding, and unredaction in `packages/domain`.
- Use the same domain package from API, CLI, and UI-backed workflows to avoid duplicated behavior.
- Treat `.txt` files as an input convenience that is converted to plain text before entering the domain layer.
- Treat downloadable restoration bundles as UI-level packaging for the redacted text plus restoration key.
- Generate a Base64URL key containing the original redacted values in document order.
- Restore by replacing `XXXX` placeholders sequentially from the decoded key.
- Prioritize longer terms first so `"Boston Red Sox"` wins over `Boston` when both are present.

## Matching Rules

- Matching is case-sensitive.
- Keywords are separated by spaces or commas.
- Phrases can use straight quotes (`"`, `'`) or typographic quotes (`\u201c \u201d`, `\u2018 \u2019`).
- Matching currently operates on substrings. For example, a keyword can match inside a larger token.
- The mask is always `XXXX`, regardless of original term length.

These rules are intentionally explicit because the assignment leaves casing, word boundaries, and punctuation behavior open.

## Trade-offs

- A Base64URL key is simple and demo-friendly, but it is not secure. Production restoration material should be encrypted and separated from searchable metadata.
- A single-pass scanner is easy to reason about and test. For very large term dictionaries, a trie or Aho-Corasick matcher would reduce repeated term checks.
- Replacing every match with the same token keeps the output simple, but unredaction depends on placeholder order and placeholder count.
- The API is stateless for Parts 1 and 2, which makes local demo simple. Part 3 would introduce persistence, authorization, and indexing.
- The Part 3 prototype uses SQLite to show real persistence and searchable document boundaries without requiring an external database service.
- `.txt` loading is intentionally handled at the adapter layer. The API stays text-based, which keeps the core contract stable and avoids multipart ingestion complexity that the assignment does not require.
- Restoration bundle files use a small text format for demo portability. They are not a security mechanism and would be replaced by protected restoration material in a production service.

## Edge Cases Covered

- Space-separated keywords.
- Comma-separated keywords.
- Single-quoted, double-quoted, and typographic-quoted phrases.
- Longer overlapping terms.
- Multiple redactions of the same term.
- Invalid keys.
- Placeholder/key count mismatch.
- Invalid API payloads.
- CLI `.txt` file input.
- UI restoration bundle load/download flow.

## Production Hardening

- Replace the exercise key with encrypted restoration payloads managed through KMS.
- Add authentication, authorization, audit logs, and rate limits.
- Add structured observability: request IDs, metrics, traces, and domain event logs.
- Add OpenAPI-based contract tests.
- Consider whole-word and case-insensitive matching options if product requirements demand them.
- Use event-driven indexing for stored documents and redacted keyword search.
- Replace the SQLite repository with PostgreSQL for multi-instance production deployments.
- Add a dedicated ingestion pipeline for DOCX/PDF if non-text document formats become a product requirement.
