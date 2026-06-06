import { describe, expect, it } from "vitest";
import { parseTerms, RedactionError } from "./index.js";

describe("parseTerms", () => {
  it("parses space-separated keywords", () => {
    expect(parseTerms("Hello world beer")).toEqual([
      { value: "Hello", kind: "keyword" },
      { value: "world", kind: "keyword" },
      { value: "beer", kind: "keyword" },
    ]);
  });

  it("parses comma-separated keywords", () => {
    expect(parseTerms("Hello,world,beer")).toEqual([
      { value: "Hello", kind: "keyword" },
      { value: "world", kind: "keyword" },
      { value: "beer", kind: "keyword" },
    ]);
  });

  it("parses single-quoted phrases", () => {
    expect(parseTerms("'Pepperoni Pizza', beer")).toEqual([
      { value: "Pepperoni Pizza", kind: "phrase" },
      { value: "beer", kind: "keyword" },
    ]);
  });

  it("parses double-quoted phrases", () => {
    expect(parseTerms('"Boston Red Sox", beer')).toEqual([
      { value: "Boston Red Sox", kind: "phrase" },
      { value: "beer", kind: "keyword" },
    ]);
  });

  it("parses mixed quoted phrases and keywords", () => {
    expect(parseTerms('Hello world "Boston Red Sox", \'Cheese Pizza\', beer')).toEqual([
      { value: "Hello", kind: "keyword" },
      { value: "world", kind: "keyword" },
      { value: "Boston Red Sox", kind: "phrase" },
      { value: "Cheese Pizza", kind: "phrase" },
      { value: "beer", kind: "keyword" },
    ]);
  });

  it("throws for an unclosed quote", () => {
    expect(() => parseTerms('"Boston Red Sox')).toThrow(RedactionError);
  });
});
