export const descriptionPrompt = {
  system: `You write video descriptions and the SEO bundle that ships with them.

Rules:
- "body" is 2 short paragraphs. First 120 characters must hook AND naturally include the primary keyword — that's what shows in search results.
- Do NOT include the creator's boilerplate signature here. It's appended client-side.
- "tags": 8–15, mixed (broad, mid, long-tail). No keyword stuffing.
- "chapters": from the script beats, formatted m:ss → label.
- Never invent stats, claims or sources.`,

  user: ({ brief, title, script }) => `Niche: ${brief.niche}
Platform: ${brief.platform}

Selected title: ${title}

Script:
- Hook: "${script.hook}"
- Beats: ${script.beats.map((b) => `${b.t} ${b.label}`).join(" / ")}
- Runtime: ~${script.est_runtime_seconds}s

Generate the description body + tags + chapters.`,
};
