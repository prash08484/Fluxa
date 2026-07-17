import { CurvedArrow, Squiggle } from "@/components/ui/CurvedArrow";

export function Demo() {
  return (
    <section id="demo" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-20 relative">
          <p className="font-hand text-amber-100 text-xl mb-2">
            okay, show me.
          </p>
          <h2 className="relative inline-block text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            From <span className="font-hand text-amber-200">"idk what to post"</span>
            <br />
            to <span className="font-hand text-stone-300">"this Sunday's drop"</span>.
            <Squiggle width={300} delay="0.4s" className="left-1/2 -translate-x-1/2" />
          </h2>
        </div>

        {/* Big canvas-style mockup with annotated arrows */}
        <div className="relative max-w-6xl mx-auto">
          <div className="relative rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 sm:p-10 overflow-hidden">
            {/* Faint inner grid to reinforce canvas feel */}
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative grid grid-cols-12 gap-6 min-h-[480px]">
              {/* Input bubble */}
              <div className="col-span-12 md:col-span-4 paper-card p-5 -rotate-1">
                <div className="text-xs text-zinc-500 font-mono mb-2">YOU</div>
                <p className="font-hand text-2xl text-amber-200 leading-snug">
                  "indie game dev,<br />solo, weekly devlog"
                </p>
              </div>

              {/* Ideas spread */}
              <div className="col-span-12 md:col-span-8 grid grid-cols-2 gap-4">
                <div className="paper-card p-4 rotate-1">
                  <div className="text-xs text-zinc-500 mb-1">IDEA</div>
                  <p className="text-sm text-zinc-200">
                    "I shipped a game in a weekend. It broke twice."
                  </p>
                </div>
                <div className="paper-card p-4 -rotate-2">
                  <div className="text-xs text-zinc-500 mb-1">IDEA</div>
                  <p className="text-sm text-zinc-200">
                    "Why my Steam wishlist tripled in 4 weeks."
                  </p>
                </div>
                <div className="paper-card p-4 rotate-1">
                  <div className="text-xs text-zinc-500 mb-1">HOOK</div>
                  <p className="text-amber-200 font-hand text-lg">
                    "If I quit my job to make games, would you watch?"
                  </p>
                </div>
                <div className="paper-card p-4 -rotate-1">
                  <div className="text-xs text-zinc-500 mb-1">THUMBNAIL</div>
                  <p className="text-sm text-zinc-200">
                    Split-frame: founder face / bug screen. Yellow shock text.
                  </p>
                </div>
              </div>

              {/* SEO row */}
              <div className="col-span-12 paper-card p-5 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-zinc-500 font-mono">SEO BUNDLE</div>
                  <span className="font-hand text-sm text-stone-300">
                    ↑ ranked for "solo dev devlog"
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    "solo gamedev",
                    "indie devlog",
                    "godot devlog",
                    "steam wishlist hack",
                    "quit job make games",
                    "weekend jam",
                    "solo founder devlog",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 text-zinc-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Curved arrows annotating the canvas */}
            <CurvedArrow
              className="hidden md:block top-[140px] left-[28%] z-20"
              width={140}
              height={60}
              path="M5 30 C 50 0, 100 60, 135 20"
              color="var(--accent)"
              delay="0.6s"
              length={250}
              label="ideas drop in"
              labelClassName="-bottom-8 left-4 text-amber-200"
            />
            <CurvedArrow
              className="hidden md:block top-[280px] left-[55%] z-20"
              width={120}
              height={50}
              path="M5 25 C 40 50, 80 0, 115 25"
              color="var(--accent-2)"
              delay="1.0s"
              length={200}
              label="hook → script → SEO, linked"
              labelClassName="-bottom-7 -left-2 text-stone-300 whitespace-nowrap"
            />
          </div>

          {/* Sticky note flying off the side */}
          <div className="hidden lg:block absolute right-4 top-1/2 sticky-note px-4 py-3 rotate-6 font-hand text-base max-w-56 z-30">
            <div className="tape h-3 w-12 -mt-5 mb-2 mx-auto rounded-sm" />
            you can drag, edit, re-prompt anything. it's <em className="not-italic font-bold">your</em> canvas.
          </div>
        </div>
      </div>
    </section>
  );
}
