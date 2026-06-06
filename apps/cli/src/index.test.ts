import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("redaction CLI", () => {
  it("redacts document text as JSON", async () => {
    const { stdout } = await execFileAsync("node", [
      "--import",
      "tsx",
      "apps/cli/src/index.ts",
      "redact",
      "--terms",
      "beer",
      "--text",
      "beer at noon",
      "--json",
    ]);

    const payload = JSON.parse(stdout) as { redactedText: string; key: string };

    expect(payload.redactedText).toBe("XXXX at noon");
    expect(payload.key).toEqual(expect.any(String));
  });

  it("unredacts document text as JSON", async () => {
    const redaction = await execFileAsync("node", [
      "--import",
      "tsx",
      "apps/cli/src/index.ts",
      "redact",
      "--terms",
      "classified",
      "--text",
      "classified memo",
      "--json",
    ]);
    const redacted = JSON.parse(redaction.stdout) as { redactedText: string; key: string };

    const restoration = await execFileAsync("node", [
      "--import",
      "tsx",
      "apps/cli/src/index.ts",
      "unredact",
      "--key",
      redacted.key,
      "--text",
      redacted.redactedText,
      "--json",
    ]);

    const payload = JSON.parse(restoration.stdout) as { unredactedText: string };

    expect(payload.unredactedText).toBe("classified memo");
  });

  it("returns a JSON error for invalid keys", async () => {
    await expect(
      execFileAsync("node", [
        "--import",
        "tsx",
        "apps/cli/src/index.ts",
        "unredact",
        "--key",
        "invalid",
        "--text",
        "XXXX",
        "--json",
      ])
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("INVALID_KEY"),
    });
  });
});
