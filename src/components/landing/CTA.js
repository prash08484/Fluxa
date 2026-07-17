import { Button } from "@/components/ui/Button";
import { CurvedArrow } from "@/components/ui/CurvedArrow";

export function CTA() {
  return (
    <section id="cta" className="relative py-32">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative paper-card p-10 sm:p-16 text-center overflow-hidden bg-white/[0.02]">
          <div className="font-hand text-amber-200 text-2xl mb-3">
            ok, your turn ↓
          </div>
          <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-50">
            What are you{" "}
            <span className="font-hand text-amber-100">not</span> filming yet?
          </h2>
          <p className="mt-5 text-zinc-400 max-w-xl mx-auto">
            Drop your niche. The canvas does the rest. Cancel any time —
            you keep everything you generated.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto justify-center">
            <Button as="a" href="/dashboard" variant="accent" size="lg">
              Open the canvas →
            </Button>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            no card · no spam · just ideas
          </p>

          <CurvedArrow
            className="hidden md:block bottom-10 right-10 z-10"
            width={140}
            height={80}
            path="M120 5 C 90 30, 60 60, 5 70"
            color="var(--accent)"
            delay="0.5s"
            length={250}
            label="start here"
            labelClassName="-top-2 -right-2 text-amber-200"
          />
        </div>
      </div>
    </section>
  );
}
