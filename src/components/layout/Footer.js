export function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 mt-10">
      <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md logo-chip font-bold text-sm">
            f
          </span>
          <span className="text-sm text-zinc-400">
            fluxagent · the canvas for creators
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="#" className="hover:text-zinc-200 transition">privacy</a>
          <a href="#" className="hover:text-zinc-200 transition">terms</a>
          <a href="#" className="hover:text-zinc-200 transition">x.com</a>
          <a href="#" className="hover:text-zinc-200 transition">contact</a>
        </div>
        <div className="font-hand text-zinc-600 text-base">
          made by creators, for creators ♡
        </div>
      </div>
    </footer>
  );
}