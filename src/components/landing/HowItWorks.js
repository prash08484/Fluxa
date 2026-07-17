import { CurvedArrow, Squiggle } from "@/components/ui/CurvedArrow";

const steps = [
  {
    n: "01",
    title: "Tell us your niche",
    body: "One sentence. \"fitness for busy moms\". That's it.",
    accent: "from-amber-200/10 to-amber-200/0",
    tag: "10 sec",
  },
  {
    n: "02",
    title: "We scan what's trending",
    body: "Real-time signals from YouTube, TikTok, X, Reddit. Not last year's data.",
    accent: "from-stone-300/10 to-stone-300/0",
    tag: "20 sec",
  },
  {
    n: "03",
    title: "Canvas fills in",
    body: "Ideas → hooks → scripts → thumbnails → SEO. All linked, all editable.",
    accent: "from-amber-100/10 to-amber-100/0",
    tag: "60 sec",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-20 relative">
          <p className="font-hand text-amber-200 text-xl mb-2">
            so, how does it actually work?
          </p>
          <h2 className="relative inline-block text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            Three steps. One canvas.
            <Squiggle width={280} delay="0.3s" className="left-1/2 -translate-x-1/2" />
          </h2>
          <p className="mt-6 text-zinc-400 max-w-xl mx-auto">
            No prompt engineering. No "first, fine-tune your...". Just type.
          </p>
        </div>

        <div className="relative grid md:grid-cols-3 gap-6 lg:gap-12">
          {steps.map((s, i) => {
            const isLast = i === steps.length - 1;
            const arrowColor = i === 0 ? "var(--accent)" : "var(--accent-2)";
            const arrowDelay = i === 0 ? "0.6s" : "1.1s";
            return (
              <div key={s.n} className="relative">
                <div className={`paper-card p-7 h-full bg-linear-to-b ${s.accent} hover:-translate-y-1 transition-transform duration-300`}>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-xs text-zinc-500">{s.n}</span>
                    <span className="font-hand text-sm text-zinc-400">
                      ~{s.tag}
                    </span>
                  </div>
                  <h3 className="text-2xl font-semibold text-zinc-50 mb-3">
                    {s.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">{s.body}</p>
                </div>

                {/* Arrow lives in the gap between this card and the next.
                    Positioned absolutely from the card edge, sized to fit the
                    gap (gap-6 = 24px, lg:gap-12 = 48px). z-10 keeps it under
                    the next card so it can never overlap content. */}
                {!isLast && (
                  <CurvedArrow
                    className="hidden md:block top-1/2 -translate-y-1/2 -right-4 lg:-right-8 z-0 pointer-events-none"
                    width={36}
                    height={20}
                    path="M2 14 Q 18 0, 34 12"
                    color={arrowColor}
                    delay={arrowDelay}
                    length={80}
                    strokeWidth={1.6}
                  />
                )}

                {/* Hand-drawn callout on the last step — moved well clear of card edge */}
                {isLast && (
                  <div className="hidden md:block absolute -bottom-14 right-2 font-hand text-amber-100 rotate-6 pointer-events-none">
                    <span className="text-lg whitespace-nowrap">and you're done ✨</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
