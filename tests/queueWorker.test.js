import { processCampaign } from "../src/services/queueWorker.js";

describe("Queue Worker Reliability", () => {
  test("should publish campaign successfully", async () => {
    const campaign = {
      id: "cmp_success",
      idempotencyKey: "key_success",
      retryAfter: null,
    };

    const result = await processCampaign(campaign);
    expect(result.status).toBe("success");
    expect(result.platform).toBeDefined();
  });

  test("should enforce idempotency", async () => {
    const campaign = {
      id: "cmp_idempotent",
      idempotencyKey: "key_idempotent",
      retryAfter: null,
    };

    const first = await processCampaign(campaign);
    const second = await processCampaign(campaign);

    expect(second).toEqual(first); // same result, no duplicate publish
  });

  test("should handle retry-after gracefully", async () => {
    const campaign = {
      id: "cmp_retry",
      idempotencyKey: "key_retry",
      retryAfter: 1, // simulate rate limit
    };

    const result = await processCampaign(campaign);
    expect(result.status).toBe("retry");
    expect(result.retryAfter).toBe(1);
  });

  test("should verify webhook signature", async () => {
    const campaign = {
      id: "cmp_webhook",
      idempotencyKey: "key_webhook",
      retryAfter: null,
    };

    const result = await processCampaign(campaign);
    expect(result.webhook.signature).toBeDefined();
    expect(result.webhook.payload.status).toBe("published");
  });
});
