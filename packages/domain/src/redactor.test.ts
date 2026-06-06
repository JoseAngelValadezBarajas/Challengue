import { describe, expect, it } from "vitest";
import { redactDocument, RedactionError, unredactDocument } from "./index.js";

describe("redactDocument", () => {
  it("redacts a single keyword", () => {
    const result = redactDocument("beer", "The agent ordered beer.");

    expect(result.redactedText).toBe("The agent ordered XXXX.");
    expect(result.redactions).toHaveLength(1);
    expect(result.redactions[0]?.original).toBe("beer");
  });

  it("redacts multiple occurrences", () => {
    const result = redactDocument("beer", "beer then more beer");

    expect(result.redactedText).toBe("XXXX then more XXXX");
    expect(result.redactions.map((entry) => entry.original)).toEqual(["beer", "beer"]);
  });

  it("redacts complete phrases", () => {
    const result = redactDocument('"Boston Red Sox"', "Boston Red Sox won.");

    expect(result.redactedText).toBe("XXXX won.");
  });

  it("prioritizes longer overlapping terms", () => {
    const result = redactDocument('"Boston Red Sox", Boston', "Boston Red Sox briefing");

    expect(result.redactedText).toBe("XXXX briefing");
    expect(result.redactions[0]?.original).toBe("Boston Red Sox");
  });

  it("leaves documents without matches unchanged", () => {
    const result = redactDocument("pizza", "Nothing to see here.");

    expect(result.redactedText).toBe("Nothing to see here.");
    expect(result.redactions).toEqual([]);
  });

  it("preserves surrounding text", () => {
    const result = redactDocument("classified", "A classified message arrived.");

    expect(result.redactedText).toBe("A XXXX message arrived.");
  });
});

describe("unredactDocument", () => {
  it("restores a redacted document with the generated key", () => {
    const original = "Hello world from the Boston Red Sox with beer.";
    const redacted = redactDocument('Hello world "Boston Red Sox", beer', original);

    expect(unredactDocument(redacted.key, redacted.redactedText).unredactedText).toBe(original);
  });

  it("throws a controlled error for an invalid key", () => {
    expect(() => unredactDocument("not-a-key", "XXXX")).toThrow(RedactionError);
  });

  it("throws when placeholder count does not match the key", () => {
    const redacted = redactDocument("beer", "beer");

    expect(() => unredactDocument(redacted.key, "XXXX and XXXX")).toThrow(RedactionError);
  });
});
