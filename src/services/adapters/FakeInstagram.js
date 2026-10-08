export class FakeInstagram {
  constructor() {
    this.platform = "FakeInstagram";
  }

  async publish(campaign) {
    // Simulate publishing with idempotency key
    if (!campaign.idempotencyKey) {
      throw new Error("Missing idempotency key");
    }

    // Simulate webhook callback
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
