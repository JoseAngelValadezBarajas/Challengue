import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("redaction API", () => {
  const app = createApp();

  it("redacts document text", async () => {
    const response = await request(app)
      .post("/redactions")
      .send({ terms: 'Hello world "Boston Red Sox"', documentText: "Hello world met Boston Red Sox" })
      .expect(201);

    expect(response.body.redactedText).toBe("XXXX XXXX met XXXX");
    expect(response.body.key).toEqual(expect.any(String));
    expect(response.body.redactions).toHaveLength(3);
  });

  it("unredacts document text", async () => {
    const redaction = await request(app)
      .post("/redactions")
      .send({ terms: "beer", documentText: "beer at noon" })
      .expect(201);

    const response = await request(app)
      .post("/unredactions")
      .send({ key: redaction.body.key, documentText: redaction.body.redactedText })
      .expect(200);

    expect(response.body.unredactedText).toBe("beer at noon");
  });

  it("returns validation errors for invalid payloads", async () => {
    const response = await request(app).post("/redactions").send({ documentText: "missing terms" }).expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns controlled errors for invalid keys", async () => {
    const response = await request(app)
      .post("/unredactions")
      .send({ key: "invalid", documentText: "XXXX" })
      .expect(422);

    expect(response.body.error.code).toBe("INVALID_KEY");
  });
});
