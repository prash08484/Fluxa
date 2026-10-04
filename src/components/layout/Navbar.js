import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-black/40 border-b border-white/5">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg logo-chip font-bold">
            f
          </span>
          <span className="font-semibold tracking-tight text-zinc-50">
            FluxAgent
          </span>
          <span className="font-hand text-amber-200 text-base ml-1 group-hover:rotate-3 transition-transform">
            ~beta
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how" className="hover:text-zinc-50 transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-zinc-50 transition-colors">
            Features
          </a>
          <a href="#demo" className="hover:text-zinc-50 transition-colors">
            See it
          </a>
          <a href="#pricing" className="hover:text-zinc-50 transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Button as="a" href="/login" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button as="a" href="/dashboard" variant="accent" size="sm">
            Open canvas
          </Button>
        </div>
      </nav>
    </header>
  );
}