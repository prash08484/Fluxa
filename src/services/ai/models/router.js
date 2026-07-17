import { aiConfig } from "../config.js";

/**
 * Map a logical tier to the configured OpenAI model.
 * Tier semantics:
 *   fast  → cheap, structured / deterministic tasks (SEO, trend extraction, thumb concepts)
 *   smart → quality matters (ideas, hooks)
 *   best  → highest quality, only the script step uses it by default
 */
export function resolveModel(tier = "smart") {
  switch (tier) {
    case "fast":
      return aiConfig.models.fast;
    case "best":
      return aiConfig.models.best;
    case "smart":
    default:
      return aiConfig.models.smart;
  }
}
