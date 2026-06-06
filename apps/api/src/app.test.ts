import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("redaction API", () => {
  const app = createApp({ databasePath: ":memory:" });

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

  it("echoes caller request ids for traceability", async () => {
    const response = await request(app).get("/health").set("x-request-id", "demo-request-1").expect(200);

    expect(response.header["x-request-id"]).toBe("demo-request-1");
  });

  it("stores and retrieves redacted documents", async () => {
    const created = await request(app)
      .post("/documents/redactions")
      .send({
        terms: '"Boston Red Sox", beer',
        documentText: "The Boston Red Sox ordered beer.",
        metadata: {
          title: "Demo briefing",
          classification: "secret",
          ownerId: "demo-user",
        },
      })
      .expect(201);

    expect(created.body.id).toEqual(expect.any(String));
    expect(created.body.redactedText).toBe("The XXXX ordered XXXX.");
    expect(created.body.key).toEqual(expect.any(String));

    const fetched = await request(app).get(`/documents/${created.body.id}`).expect(200);

    expect(fetched.body.title).toBe("Demo briefing");
    expect(fetched.body.classification).toBe("secret");
    expect(fetched.body.redactedText).toBe("The XXXX ordered XXXX.");
    expect(fetched.body.key).toBeUndefined();
  });

  it("searches stored documents by redacted term", async () => {
    const created = await request(app)
      .post("/documents/redactions")
      .send({ terms: "pepperoni", documentText: "pepperoni appears here" })
      .expect(201);

    const response = await request(app).get("/documents").query({ redactedTerm: "Pepperoni" }).expect(200);

    expect(response.body.documents).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.id, redactedText: "XXXX appears here" })])
    );
  });

  it("unredacts a stored document using the provided key", async () => {
    const created = await request(app)
      .post("/documents/redactions")
      .send({ terms: "classified", documentText: "classified message" })
      .expect(201);

    const response = await request(app)
      .post(`/documents/${created.body.id}/unredactions`)
      .send({ key: created.body.key })
      .expect(200);

    expect(response.body.unredactedText).toBe("classified message");
  });
});
