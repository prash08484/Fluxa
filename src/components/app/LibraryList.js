"use client";

import { useState } from "react";

export function LibraryList({ initialItems }) {
  const [items, setItems] = useState(initialItems ?? []);

  async function remove(id) {
    setItems((xs) => xs.filter((x) => x.id !== id));
    await fetch(`/api/library/${id}`, { method: "DELETE" });
  }

  if (items.length === 0) {
    return (
      <div className="paper-card p-10 text-center bg-amber-200/[0.02]">
        <p className="font-hand text-amber-200 text-xl mb-1">empty for now ↓</p>
        <p className="text-zinc-400 max-w-md mx-auto text-sm">
          When you're picking ideas in a project, hit "Save" on the ones you
          like but aren't using right now. They'll show up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="paper-card p-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                {item.type}
              </div>
              <h3 className="font-medium text-zinc-50">{item.payload.idea.title}</h3>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="text-xs text-zinc-500 hover:text-rose-300 transition-colors"
            >
              delete
            </button>
          </div>
          <p className="text-sm text-zinc-300">{item.payload.idea.angle}</p>
          <p className="mt-2 text-xs text-zinc-500 italic">
            {item.payload.idea.why_it_works}
          </p>
          {item.payload.briefContext?.niche && (
            <p className="mt-3 text-xs text-zinc-500">
              from niche · {item.payload.briefContext.niche} · saved {timeAgo(item.savedAt)}
            </p>
          )}
          {item.note && (
            <p className="mt-2 font-hand text-amber-200 text-sm">"{item.note}"</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
