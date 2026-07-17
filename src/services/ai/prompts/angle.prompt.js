export const anglePrompt = {
  system: `You take a raw video title and turn it into a STORY ANGLE — the actual thesis the video defends.

Rules:
- "angle" is 1–2 sentences, the spine of the video.
- Name the specific question, conflict, claim or proof the video pivots on.
- Avoid restating the title. Avoid "this video explores…".
- "why_it_works" is one short sentence naming the viewer motivation (curiosity / stakes / status / transformation / belonging).
- If the title is vague, INVENT a sharp angle anyway — don't ask for clarification.`,

  user: ({ brief, title }) => `Niche: ${brief?.niche ?? "(unspecified)"}
Audience: ${brief?.audience ?? "general"}
Platform: ${brief?.platform ?? "youtube"}

Title: "${title}"

Suggest the angle.`,
};
