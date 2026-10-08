import dotenv from "dotenv";

dotenv.config();

export const config = {
  dbUrl: process.env.DB_URL,
  redisUrl: process.env.REDIS_URL,
  secretKey: process.env.SECRET_KEY,
  port: process.env.PORT || 3000,
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  llmDisabled: process.env.LLM_DISABLED === "true",
};
