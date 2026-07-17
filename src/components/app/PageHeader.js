export function PageHeader({ hand, title, subtitle, action }) {
  return (
    <header className="mb-8 flex items-start justify-between gap-4">
      <div>
        {hand && (
          <p className="font-hand text-amber-200 text-base mb-1">{hand}</p>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-50">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm text-zinc-400 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
