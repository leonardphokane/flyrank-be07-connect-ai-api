export class FakeX {
  constructor() {
    this.platform = "FakeX";
  }

  async publish(campaign) {
    if (!campaign.idempotencyKey) {
      throw new Error("Missing idempotency key");
    }

    // Simulate rate limit handling
    if (campaign.retryAfter) {
      return { status: "retry", retryAfter: campaign.retryAfter };
    }

    return {
      status: "success",
      platform: this.platform,
      campaignId: campaign.id,
      webhook: {
        signature: "valid_signature",
        payload: { status: "published" }
      }
    };
  }
}
