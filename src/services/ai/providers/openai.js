/**
 * The single place the OpenAI SDK is touched. Everything else in
 * services/ai/ goes through `chatJSON()` so we can later swap providers,
 * add caching, retries, telemetry, or port the whole module to Python/FastAPI
 * without changing any agent code.
 */

import { ChatOpenAI } from "@langchain/openai";
import { aiConfig, assertAIReady } from "../config.js";
import { resolveModel } from "../models/router.js";

const clientCache = new Map();

function getClient({ model, temperature }) {
  const key = `${model}::${temperature}`;
  if (!clientCache.has(key)) {
    clientCache.set(
      key,
      new ChatOpenAI({
        apiKey: aiConfig.openaiApiKey,
        model,
        temperature,
      }),
    );
  }
  return clientCache.get(key);
}

/**
 * Run a structured chat completion that is guaranteed to parse against the
 * provided zod schema. Tier picks the model — "fast" / "smart" / "best".
 *
 * @param {Object} args
 * @param {string} args.system     system prompt
 * @param {string} args.user       user prompt
 * @param {import("zod").ZodTypeAny} args.schema
 * @param {"fast"|"smart"|"best"} [args.tier="smart"]
 * @param {number} [args.temperature=0.7]
 * @param {Object} [args.mock]     mock value returned when AI_MOCK=true
 */
export async function chatJSON({
  system,
  user,
  schema,
  tier = "smart",
  temperature = 0.7,
  mock,
}) {
  assertAIReady();

  if (aiConfig.mock) {
    if (mock == null) {
      throw new Error(
        "AI_MOCK=true but no mock value provided for this call. Pass `mock` to chatJSON().",
      );
    }
    return schema.parse(mock);
  }

  const model = resolveModel(tier);
  const llm = getClient({ model, temperature });
  const structured = llm.withStructuredOutput(schema);

  return structured.invoke([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}
