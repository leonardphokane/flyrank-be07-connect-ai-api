import crypto from "crypto";

export class FakeSocialPlatform {
  constructor(secret = "replace_me") {
    this.secret = secret;
    this.platform = "FakeSocialPlatform";
  }

  verifyWebhook(payload, signature) {
    const expected = crypto
      .createHmac("sha256", this.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return expected === signature;
  }

  async publish(campaign) {
    if (!campaign.idempotencyKey) {
      throw new Error("Missing idempotency key");
    }

    // Simulate webhook with signature
    const payload = { status: "published", campaignId: campaign.id };
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return {
      status: "success",
      platform: this.platform,
      campaignId: campaign.id,
      webhook: { signature, payload }
    };
  }
}
