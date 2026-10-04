"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { NAV_ITEMS } from "./navItems";
import { Icon } from "./Icon";

export function Sidebar({ user }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-white/5 bg-black/60 backdrop-blur-md z-30">
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="grid h-8 w-8 place-items-center rounded-lg logo-chip font-bold">
            f
          </span>
          <span className="font-semibold tracking-tight text-zinc-50">FluxAgent</span>
          <span className="ml-1 font-hand text-amber-200 text-sm group-hover:rotate-3 transition-transform">
            ~beta
          </span>
        </Link>
      </div>

      <div className="px-3 pb-2">
        <Link
          href="/projects/new"
          className="flex items-center justify-center gap-2 h-10 rounded-lg bg-amber-200 text-zinc-950 text-sm font-medium hover:bg-amber-100 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          New project
        </Link>
      </div>

      <nav className="flex-1 px-3 pt-2 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-zinc-600 font-mono">
          tools
        </p>
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors " +
                (active
                  ? "bg-amber-200/10 text-amber-100 border border-amber-200/25"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 border border-transparent")
              }
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/5 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt=""
              className="h-8 w-8 rounded-full border border-white/10"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-zinc-700 grid place-items-center text-xs text-zinc-200">
              {(user?.name ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-sm text-zinc-100 truncate">{user?.name ?? "you"}</div>
            <div className="text-xs text-zinc-500 truncate">{user?.email ?? ""}</div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-white/5 transition-colors"
            aria-label="Sign out"
            title="Sign out"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}