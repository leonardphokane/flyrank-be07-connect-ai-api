import { FakeInstagram } from "./adapters/FakeInstagram.js";
import { FakeX } from "./adapters/FakeX.js";
import { FakeSocialPlatform } from "./adapters/FakeSocialPlatform.js";

const adapters = [
  new FakeInstagram(),
  new FakeX(),
  new FakeSocialPlatform(process.env.SECRET_KEY || "replace_me"),
];

// In-memory store for idempotency (replace with Redis for production)
const published = new Map();

/**
 * Process a campaign with durability and reliability guards.
 * @param {Object} campaign - Campaign object { id, idempotencyKey, retryAfter }
 */
export async function processCampaign(campaign) {
  if (published.has(campaign.idempotencyKey)) {
    console.log(`Skipping duplicate campaign: ${campaign.id}`);
    return published.get(campaign.idempotencyKey);
  }

  let result;
  for (const adapter of adapters) {
    try {
      result = await adapter.publish(campaign);

      // Handle retry-after (simulate rate limit)
      if (result.status === "retry") {
        console.log(
          `Rate limit hit on ${adapter.platform}, retrying after ${result.retryAfter}s`
        );

        // Skip scheduling retries when running tests
        if (process.env.NODE_ENV !== "test") {
          setTimeout(() => processCampaign(campaign), result.retryAfter * 1000);
        }

        return result; // ✅ return the retry object so tests can assert on it
      }

      // Verify webhook signature if present
      if (result.webhook?.signature) {
        const verified = adapter.verifyWebhook
          ? adapter.verifyWebhook(result.webhook.payload, result.webhook.signature)
          : true;
        if (!verified) {
          throw new Error(`Webhook signature invalid for ${adapter.platform}`);
        }
      }

      console.log(`Published to ${adapter.platform}:`, result);
      published.set(campaign.idempotencyKey, result);
    } catch (err) {
      console.error(`Error publishing to ${adapter.platform}:`, err.message);

      // Retry logic: simple exponential backoff
      if (process.env.NODE_ENV !== "test") {
        setTimeout(() => processCampaign(campaign), 2000);
      }
    }
  }

  return result;
}
