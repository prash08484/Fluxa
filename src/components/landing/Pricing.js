import { Button } from "@/components/ui/Button";
import { Squiggle } from "@/components/ui/CurvedArrow";

const tiers = [
  {
    name: "Solo",
    price: "free",
    tag: "for life",
    blurb: "Get your first 10 ideas without thinking about it.",
    features: [
      "10 ideas / month",
      "3 full scripts",
      "1 niche",
      "community canvas",
    ],
    cta: "Start free",
    variant: "ghost",
  },
  {
    name: "Creator",
    price: "$19",
    tag: "/mo",
    blurb: "For the upload-every-week crew.",
    features: [
      "unlimited ideas & hooks",
      "60 scripts / mo",
      "5 niches",
      "trending radar",
      "thumbnail concepts",
    ],
    cta: "Try 7 days free",
    variant: "accent",
    highlight: true,
  },
  {
    name: "Studio",
    price: "$79",
    tag: "/mo",
    blurb: "Teams, agencies, multi-channel monsters.",
    features: [
      "everything in Creator",
      "unlimited scripts",
      "20 niches",
      "team canvas",
      "priority models",
    ],
    cta: "Talk to us",
    variant: "ghost",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-16 relative">
          <p className="font-hand text-amber-200 text-xl mb-2">
            the boring part
          </p>
          <h2 className="relative inline-block text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            Pricing that respects your wallet.
            <Squiggle width={380} delay="0.3s" className="left-1/2 -translate-x-1/2" />
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`paper-card p-7 relative flex flex-col ${
                t.highlight
                  ? "border-amber-200/40 bg-amber-200/[0.04]"
                  : ""
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 sticky-note px-3 py-1 text-xs font-hand rounded -rotate-3">
                  most picked
                </span>
              )}
              <div className="text-sm text-zinc-400 font-mono uppercase tracking-wider">
                {t.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-semibold text-zinc-50">
                  {t.price}
                </span>
                <span className="text-zinc-500 text-sm">{t.tag}</span>
              </div>
              <p className="mt-3 text-zinc-400 text-sm">{t.blurb}</p>

              <ul className="mt-6 space-y-2 text-sm text-zinc-300 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-amber-200">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                as="a"
                href="#cta"
                variant={t.variant}
                size="md"
                className="mt-7 w-full"
              >
                {t.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
