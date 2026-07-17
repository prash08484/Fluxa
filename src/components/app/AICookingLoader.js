"use client";

import { useEffect, useState } from "react";

/**
 * "AI is cooking" loader. Rotates through a list of status messages so the
 * user feels progress instead of staring at a static spinner.
 *
 * Pass a `step` prop and we'll pick a relevant message set automatically.
 * Or pass `messages` directly for custom loaders.
 */

const STEP_MESSAGES = {
  trends: [
    "scanning what's trending…",
    "filtering for your niche…",
    "ranking signals by recency…",
    "writing down what we found ↓",
  ],
  ideas: [
    "shaping angles from your picks…",
    "killing the boring ones…",
    "rewording for click-through…",
    "ranking by appeal ↓",
  ],
  hooks: [
    "writing 5 first-five-seconds…",
    "mixing safe / spicy / polarising…",
    "trimming filler words…",
    "ready when you are ↓",
  ],
  script: [
    "writing the cold open…",
    "structuring the beats…",
    "drafting the payoff…",
    "polishing the CTA…",
    "almost done ↓",
  ],
  thumbnail: [
    "writing the description first…",
    "sketching thumbnail concepts…",
    "rendering each one as an image…",
    "this one takes ~20–40 seconds, hang tight ↓",
    "uploading the images to your library…",
  ],
  seo: [
    "writing titles that earn the click…",
    "compiling tags & chapters…",
    "shaping the first 120 chars…",
  ],
  analyze: [
    "reading every line…",
    "scoring 6 dimensions…",
    "ranking the top fixes…",
  ],
  default: ["thinking…", "almost there…"],
};

export function AICookingLoader({ step, messages, interval = 2200, className = "" }) {
  const list = messages ?? STEP_MESSAGES[step] ?? STEP_MESSAGES.default;
  const [i, setI] = useState(0);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => setI((n) => (n + 1) % list.length), interval);
    return () => clearInterval(t);
  }, [list, interval]);

  return (
    <div className={`paper-card p-6 ${className}`}>
      <div className="flex items-center gap-4">
        <Sparkles />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            AI is cooking
          </p>
          <p
            key={i}
            className="font-hand text-lg text-amber-200 animate-[fadeIn_0.4s_ease-out]"
          >
            {list[i]}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {list.map((_, idx) => (
          <span
            key={idx}
            className={
              "h-1 flex-1 rounded-full transition-colors " +
              (idx <= i ? "bg-amber-200/80" : "bg-white/8")
            }
          />
        ))}
      </div>
    </div>
  );
}

function Sparkles() {
  return (
    <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-200/30 bg-amber-200/5">
      <span className="absolute inset-1 rounded-full border border-dashed border-amber-200/30 animate-[spin_6s_linear_infinite]" />
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M18.5 5.5l-2.8 2.8M8.3 15.7l-2.8 2.8"
          stroke="#fde68a"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="2" fill="#fde68a" />
      </svg>
    </span>
  );
}
