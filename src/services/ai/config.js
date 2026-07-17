/**
 * Central read of AI-related env. Keep all env access here so the rest of the
 * AI service layer is pure and easy to test / port to Python later.
 */

export const aiConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  models: {
    fast: process.env.OPENAI_MODEL_FAST ?? "gpt-4o-mini",
    smart: process.env.OPENAI_MODEL_SMART ?? "gpt-4o",
    best: process.env.OPENAI_MODEL_BEST ?? "gpt-4o",
  },
  mock: process.env.AI_MOCK === "true",
};

export function assertAIReady() {
  if (aiConfig.mock) return;
  if (!aiConfig.openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local or set AI_MOCK=true while developing.",
    );
  }
}
