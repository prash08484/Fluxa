import { Button } from "@/components/ui/Button";
import { CurvedArrow, Squiggle } from "@/components/ui/CurvedArrow";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-20 pb-32 sm:pt-28 sm:pb-40 relative">
        {/* Floating sticky-note: who it's for */}
        <div className="hidden lg:block absolute top-24 left-4 z-20 -rotate-6 cursor-dot">
          <div className="sticky-note rounded-md px-4 py-3 w-44 font-hand text-base leading-snug">
            <div className="tape h-3 w-16 -mt-5 mb-2 mx-auto rounded-sm" />
            for creators who'd rather
            <br />
            <em className="not-italic font-bold">film</em> than think
            about what to film
          </div>
        </div>

        {/* Floating chip: the painful truth */}
        <div className="hidden lg:block absolute top-44 right-6 z-20 rotate-3">
          <div className="paper-card px-4 py-3 max-w-[15rem]">
            <div className="font-hand text-amber-200 text-sm mb-1">
              the painful truth →
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              90% of creators quit because <span className="text-zinc-100">ideation</span>{" "}
              is harder than filming.
            </p>
          </div>
        </div>

        {/* Curved arrow pointing from sticky-note toward the headline */}
        <CurvedArrow
          className="hidden lg:block top-44 left-48 z-10"
          width={220}
          height={140}
          path="M10 10 C 80 30, 140 90, 200 120"
          color="var(--accent)"
          delay="0.4s"
          length={400}
        />

        {/* Curved arrow from "painful truth" toward the headline */}
        <CurvedArrow
          className="hidden lg:block top-64 right-52 z-10"
          width={200}
          height={120}
          path="M190 10 C 130 30, 70 70, 10 100"
          color="var(--accent-2)"
          delay="0.7s"
          length={400}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-200 animate-pulse" />
            The AI Operating System for creators · in private beta
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-zinc-50 leading-[1.05]">
            Type a niche.{" "}
            <span className="relative inline-block">
              <span className="scribble">Get a full content pipeline</span>
              <Squiggle width={420} delay="1.4s" />
            </span>
            <br />
            in <span className="font-hand text-amber-200">90 seconds.</span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Trending ideas, hooks, scripts, thumbnail concepts and SEO —
            generated on one infinite canvas. No tab-juggling. No blank-page paralysis.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button as="a" href="/dashboard" variant="accent" size="lg">
              Generate my first idea →
            </Button>
            <Button as="a" href="#demo" variant="ghost" size="lg">
              Watch 30s demo
            </Button>
          </div>

          <p className="mt-5 text-xs text-zinc-500">
            no credit card · free forever for solo creators
          </p>
        </div>

        {/* Hand-drawn arrow pointing down at the demo */}
        <div className="relative mt-20 max-w-5xl mx-auto">
          <CurvedArrow
            className="hidden md:block -top-16 left-1/2 -translate-x-1/2 z-10"
            width={120}
            height={80}
            path="M60 5 C 40 30, 80 50, 60 75"
            color="var(--accent-3)"
            delay="1.8s"
            length={200}
            label="↓ here's the canvas"
            labelClassName="text-amber-100 -bottom-6 left-16 whitespace-nowrap"
          />
          <DemoFrame />
        </div>
      </div>
    </section>
  );
}

function DemoFrame() {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-linear-to-b from-zinc-950 to-black p-2 shadow-[0_40px_120px_-20px_rgba(253,230,138,0.10)]">
      <div className="rounded-xl bg-[#0e0e10] overflow-hidden border border-white/5">
        {/* fake browser chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-zinc-950/60">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
            <span className="h-3 w-3 rounded-full bg-zinc-700" />
          </div>
          <div className="ml-3 flex-1 rounded-md bg-black/60 px-3 py-1 text-xs text-zinc-500 font-mono">
            fluxagent.app/canvas
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 min-h-[360px]">
          {/* Input card */}
          <div className="paper-card p-4">
            <div className="text-xs text-zinc-500 mb-2 font-mono">01 · INPUT</div>
            <div className="text-sm text-zinc-300 mb-3">Your niche</div>
            <div className="rounded-lg bg-black/60 border border-white/10 px-3 py-2 text-amber-200 font-hand text-lg">
              ai productivity for students
            </div>
            <div className="mt-4 text-xs text-zinc-500">→ feeds the canvas</div>
          </div>

          {/* Ideas card */}
          <div className="paper-card p-4">
            <div className="text-xs text-zinc-500 mb-2 font-mono">02 · IDEAS</div>
            <ul className="space-y-2 text-sm">
              {[
                "I tried 5 AI study tools for 7 days",
                "ChatGPT vs Claude: who actually helps you learn?",
                "Your professor can't tell. Here's how I know.",
              ].map((t) => (
                <li
                  key={t}
                  className="rounded-md bg-white/[0.03] border border-white/5 px-3 py-2 text-zinc-200"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Script card */}
          <div className="paper-card p-4 relative">
            <div className="text-xs text-zinc-500 mb-2 font-mono">03 · SCRIPT</div>
            <div className="space-y-2 text-sm text-zinc-300 leading-relaxed">
              <p>
                <span className="text-amber-200 font-hand text-base">hook:</span>{" "}
                "I let an AI plan my finals week. Then this happened."
              </p>
              <p className="text-zinc-500">
                [0:00–0:08] cold open, fast cuts of all-nighters…
              </p>
              <p className="text-zinc-500">
                [0:08–0:20] the setup — what I gave it…
              </p>
            </div>
            <span className="absolute -top-2 -right-2 rotate-12 sticky-note text-xs font-hand px-2 py-0.5 rounded">
              ready to film
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
