import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const cliCommand = ["--conditions", "development", "--import", "tsx", "apps/cli/src/index.ts"];

describe("redaction CLI", () => {
  it("redacts document text as JSON", async () => {
    const { stdout } = await execFileAsync("node", [
      ...cliCommand,
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

  it("redacts document text from a .txt file", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "redaction-cli-"));
    const filePath = join(tempDir, "briefing.txt");

    try {
      await writeFile(filePath, "beer at noon", "utf8");

      const { stdout } = await execFileAsync("node", [
        ...cliCommand,
        "redact",
        "--terms",
        "beer",
        "--file",
        filePath,
        "--json",
      ]);

      const payload = JSON.parse(stdout) as { redactedText: string; key: string };

      expect(payload.redactedText).toBe("XXXX at noon");
      expect(payload.key).toEqual(expect.any(String));
    } finally {
      await rm(tempDir, { force: true, recursive: true });
    }
  });

  it("unredacts document text as JSON", async () => {
    const redaction = await execFileAsync("node", [
      ...cliCommand,
      "redact",
      "--terms",
      "classified",
      "--text",
      "classified memo",
      "--json",
    ]);
    const redacted = JSON.parse(redaction.stdout) as { redactedText: string; key: string };

    const restoration = await execFileAsync("node", [
      ...cliCommand,
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
        ...cliCommand,
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

  it("returns an error for unsupported file extensions", async () => {
    await expect(
      execFileAsync("node", [
        ...cliCommand,
        "redact",
        "--terms",
        "beer",
        "--file",
        "briefing.md",
        "--json",
      ])
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Only .txt files are supported."),
    });
  });
});
