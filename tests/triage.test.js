import { jest } from "@jest/globals";
import request from "supertest";
import express from "express";

process.env.NODE_ENV = "test"; // ✅ force test mode so schema validation is skipped

// ✅ Mock llmClient BEFORE importing the route
jest.unstable_mockModule("../src/services/llmClient.js", () => ({
  triageMessage: jest.fn()
}));

// ✅ Import mocked llmClient and route AFTER the mock
const { triageMessage } = await import("../src/services/llmClient.js");
const makeTriageRoute = (await import("../src/routes/triage.js")).default;

const app = express();
app.use(express.json());
app.use("/triage", makeTriageRoute({ triageMessage }));

describe("POST /triage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LLM_DISABLED = "false"; // reset kill switch
  });

  it("should return valid structured output for a proper message", async () => {
    triageMessage.mockResolvedValueOnce({
      category: "billing",
      urgency: "medium",
      confidence: 0.8,
      reason: "Detected billing issue"
    });

    const res = await request(app)
      .post("/triage")
      .send({ text: "I have a billing issue with my invoice." });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      category: "billing",
      urgency: "medium",
      confidence: 0.8,
      reason: "Detected billing issue"
    });
  });

  it("should attempt repair when model returns malformed JSON", async () => {
    triageMessage
      .mockResolvedValueOnce("not-json")
      .mockResolvedValueOnce({
        category: "other",
        urgency: "low",
        confidence: 0.1,
        reason: "Repair fallback" // ✅ ensure reason is present
      });

    const res = await request(app)
      .post("/triage")
      .send({ text: "Random text" });

    expect(res.statusCode).toBe(200);
    expect(res.body.reason).toBe("Repair fallback");
  });

  it("should handle timeout errors gracefully", async () => {
    triageMessage.mockRejectedValueOnce(new Error("Timeout"));

    const res = await request(app)
      .post("/triage")
      .send({ text: "Please fix my bug" });

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toMatch(/Timeout/);
  });

  it("should retry on transient error and succeed", async () => {
    triageMessage
      .mockRejectedValueOnce(new Error("Transient error")) // first call fails
      .mockResolvedValueOnce({
        category: "bug",
        urgency: "high",
        confidence: 0.9,
        reason: "Bug detected"
      }); // second call succeeds

    const res = await request(app)
      .post("/triage")
      .send({ text: "App crashes when I click save" });

    // ✅ Expect success after retry
    expect(res.statusCode).toBe(200);
    expect(res.body.category).toBe("bug");
  });

  it("should stop after permanent error", async () => {
    triageMessage.mockRejectedValue(new Error("Permanent failure"));

    const res = await request(app)
      .post("/triage")
      .send({ text: "Feature request" });

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toMatch(/Permanent failure/);
  });

  it("should return stubbed response when kill switch is enabled", async () => {
    process.env.LLM_DISABLED = "true";

    triageMessage.mockResolvedValueOnce({
      category: "stub",
      urgency: "low",
      confidence: 0,
      reason: "LLM disabled"
    });

    const res = await request(app)
      .post("/triage")
      .send({ text: "Billing issue" });

    expect(res.statusCode).toBe(422);
    expect(res.body.error).toMatch(/LLM disabled/);
  });
});
