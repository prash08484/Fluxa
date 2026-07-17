import { Squiggle, CurvedArrow } from "@/components/ui/CurvedArrow";

const features = [
  {
    icon: "🔥",
    title: "Trend radar",
    body: "Live signals from YT, TikTok, X & Reddit. Catch waves before everyone else.",
    rotate: "-rotate-1",
  },
  {
    icon: "💡",
    title: "Idea engine",
    body: "100+ unique angles per niche. Not recycled BuzzFeed listicles.",
    rotate: "rotate-1",
  },
  {
    icon: "🎣",
    title: "Hooks that hook",
    body: "Pattern-broken, curiosity-loaded, A/B-rankable. Pick the winner in one click.",
    rotate: "-rotate-1",
  },
  {
    icon: "📝",
    title: "Full scripts",
    body: "Cold open → payoff → CTA. Your tone, your length, your structure.",
    rotate: "rotate-2",
  },
  {
    icon: "🖼️",
    title: "Thumbnail concepts",
    body: "Composition, text overlay, expression notes. Hand it to your designer (or yourself).",
    rotate: "-rotate-2",
  },
  {
    icon: "🔎",
    title: "SEO that lifts",
    body: "Titles, descriptions, tags, chapters — built from the keywords actually ranking.",
    rotate: "rotate-1",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl mb-16 relative">
          <p className="font-hand text-stone-300 text-xl mb-2">
            what's on the canvas?
          </p>
          <h2 className="relative inline-block text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            Six tools.
            <span className="font-hand text-amber-200"> One brain.</span>
            <Squiggle width={180} delay="0.4s" className="left-0" />
          </h2>
          <p className="mt-6 text-zinc-400 text-lg">
            Each card on your canvas knows about the others. Edit your hook —
            your script updates. Refine your script — your SEO follows. Connected, not pasted.
          </p>
        </div>

        <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Decorative connecting squiggle */}
          <CurvedArrow
            className="hidden lg:block top-32 left-[28%] z-0 opacity-40"
            width={180}
            height={80}
            path="M5 10 Q 45 70, 90 20 T 175 50"
            color="var(--accent)"
            delay="0.4s"
            length={400}
            withHead={false}
          />
          <CurvedArrow
            className="hidden lg:block bottom-32 right-[28%] z-0 opacity-40"
            width={180}
            height={80}
            path="M5 50 Q 45 0, 90 60 T 175 20"
            color="var(--accent-2)"
            delay="0.7s"
            length={400}
            withHead={false}
          />

          {features.map((f) => (
            <div
              key={f.title}
              className={`paper-card p-6 relative z-10 hover:${f.rotate} transition-transform duration-300`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-zinc-50 mb-2">
                {f.title}
              </h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
