import { chatJSON } from "../providers/openai.js";
import { linkedinPostPrompt } from "../prompts/linkedinPost.prompt.js";
import { linkedinPostOutSchema } from "../schemas/index.js";

/**
 * Adapt a project's video script into a LinkedIn post.
 *
 * postType picks the scaffold the prompt uses — different post types are
 * structurally different (a "hiring" post ≠ a "story" post), so we don't
 * try to one-prompt them.
 */
export async function generateLinkedinPost({
  brief,
  idea,
  script,
  postType = "experience",
  feedback,
}) {
  if (!script) {
    throw new Error("generateLinkedinPost: script is required. Finish the canvas first.");
  }
  return chatJSON({
    system: linkedinPostPrompt.system,
    user: linkedinPostPrompt.user({ brief, idea, script, postType, feedback }),
    schema: linkedinPostOutSchema,
    tier: "smart",
    temperature: 0.75,
    mock: {
      hook_line: feedback
        ? `[regen·${postType}] What I learned about ${brief?.niche ?? "the work"} the expensive way ↓`
        : `[${postType}] What I learned about ${brief?.niche ?? "the work"} that no one told me ↓`,
      body:
`I tried something this week that broke a rule everyone in ${brief?.niche ?? "this space"} swears by.

It worked.

Here's what happened.

Most people approach ${idea?.title ?? "this"} by following the textbook path. Safe, predictable, slow.

I went the other way.

The reason: ${idea?.angle ?? "the textbook ignores how the actual decision gets made"}.

What I expected: failure. What I got: a result that's still surprising me a week in.

Three things I'd tell past-me:

1. The "obvious" advice in this space is averaged from people who weren't testing.
2. The cheapest experiment beats the most considered plan.
3. You learn more from one specific failure than ten generic wins.`,
      call_to_action: "What's one rule in your field you'd love to break this month?",
      hashtags: [
        (brief?.niche ?? "creators").replace(/\s+/g, "").toLowerCase(),
        postType.replace(/_/g, ""),
        "buildinpublic",
        "lessonslearned",
      ],
    },
  });
}
