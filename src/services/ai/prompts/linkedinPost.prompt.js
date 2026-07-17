/**
 * Per-postType scaffolds. The agent receives ONE of these based on the
 * picker the user used on the LinkedIn extension panel.
 */
const TYPE_SCAFFOLDS = {
  story: `POST TYPE = STORY.
- First-person narrative, past tense.
- Arc: ordinary moment → inciting event → struggle → turn → lesson.
- One concrete sensory detail beats generic emotion.
- End on the lesson, not the resolution.`,

  educational: `POST TYPE = EDUCATIONAL.
- Open with the QUESTION the reader actually has — not "let me share".
- Structure: question → why it matters → the answer in plain language → one nuance / caveat → what to do today.
- Use named tools, real numbers, concrete dates. Vague kills it.`,

  experience: `POST TYPE = EXPERIENCE.
- "Here's what I learned doing X this week" framing.
- 3 short sections: what I tried / what surprised me / what I'm doing differently next time.
- First-person, present-and-past tense. No big abstractions — only what happened.`,

  hiring: `POST TYPE = HIRING.
- Open with the role + the unusual thing about it (not "we're hiring").
- Cover: who fits + who absolutely doesn't + what they'll work on first + how to apply.
- Be specific about compensation range, location, hours if you can — vague hiring posts get vague candidates.
- No "rockstar" / "ninja" / "passion for excellence". Banned.`,

  project_showcase: `POST TYPE = PROJECT SHOWCASE.
- Open with the BUILT THING and one sentence on what it does for whoever's reading.
- Cover: the problem → what you built → the surprising design choice → what's next + how readers can try / give feedback.
- Show humility about what didn't work. That earns trust on LinkedIn.`,

  announcement: `POST TYPE = ANNOUNCEMENT.
- Lead with the news in the FIRST line — no buildup.
- Cover: the announcement → why it matters NOW → what readers should do.
- One clear CTA — don't stack three asks.
- Skip the "I'm thrilled / honoured / humbled" opening. Banned.`,
};

export const linkedinPostPrompt = {
  system: `You adapt a video script into a LinkedIn post. Not a summary. A native LinkedIn post the creator could publish as-is.

UNIVERSAL RULES:
- "hook_line" is the FIRST line. LinkedIn cuts to "see more" around 150 chars — the hook decides whether anyone reads the rest. No "Hey everyone", no "Here's an interesting take". Banned.
- "body" is 200–2500 chars. Short paragraphs (1–3 lines), generous line breaks. LinkedIn rewards visual rhythm.
- Lean conversational + earnest. NOT corporate. NOT "thrilled to announce". NOT "in today's fast-paced world".
- Pull specific moments / numbers / examples from the source script — don't speak in abstractions when the script gave you concretes.
- One clear takeaway.
- "call_to_action" is one short line — specific to this post's payoff, not generic.
- "hashtags": 3–8, niche-relevant. No #motivation #success #inspiration stuffing.

The POST TYPE scaffold below is binding — follow its structural rules.
If FEEDBACK from a prior version is provided, apply it literally.`,

  user: ({ brief, idea, script, postType, feedback }) => {
    const scaffold = TYPE_SCAFFOLDS[postType] ?? TYPE_SCAFFOLDS.experience;
    const blocks = [
      `Creator's niche: ${brief?.niche ?? "(unspecified)"}`,
      `Audience: ${brief?.audience ?? "general"}`,
      `Tone: ${brief?.tone ?? "authentic, conversational"}`,
      "",
      scaffold,
      "",
      `Video idea: ${idea?.title ?? script?.title ?? "(untitled)"}`,
      idea?.angle ? `Angle: ${idea.angle}` : null,
      "",
      "Source video script to adapt:",
      `Title: ${script?.title ?? "(untitled)"}`,
      `Hook: "${script?.hook ?? ""}"`,
      `Beats:`,
      ...(script?.beats ?? []).map(
        (b, i) => `  ${i + 1}. [${b.label}] ${b.body}`,
      ),
      `CTA: ${script?.cta ?? ""}`,
    ].filter(Boolean);

    if (feedback) {
      blocks.push(
        "",
        "FEEDBACK on the previous LinkedIn version (apply this literally):",
        `"${feedback}"`,
      );
    }

    blocks.push("", "Write the LinkedIn post.");
    return blocks.join("\n");
  },
};
