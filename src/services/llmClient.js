import fs from "fs";
import OpenAI from "openai";
import { logCost, killSwitch } from "../utils/logger.js";
import { retry } from "../utils/retry.js";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

export async function triageMessage(text) {
  if (killSwitch()) throw new Error("LLM disabled");

  const prompt = fs.readFileSync("./prompts/triage_v1.txt", "utf8");

  return await retry(async () => {
    const response = await client.chat.completions.create({
      model: "openrouter/free",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text }
      ],
      timeout: 5000,
    });

    logCost(response.usage);

    // Try parsing JSON, repair if malformed
    let parsed;
    try {
      parsed = JSON.parse(response.choices[0].message.content);
    } catch (err) {
      const repairResponse = await client.chat.completions.create({
        model: "openrouter/free",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Your last output was invalid JSON: ${err.message}. Please return valid JSON only.` }
        ],
        timeout: 5000,
      });
      parsed = JSON.parse(repairResponse.choices[0].message.content);
    }

    return parsed;
  });
}
