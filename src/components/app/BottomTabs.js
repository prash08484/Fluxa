"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOBILE_TABS } from "./navItems";
import { Icon } from "./Icon";

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Tools"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_TABS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] transition-colors " +
                  (active
                    ? "text-amber-200"
                    : "text-zinc-500 hover:text-zinc-200")
                }
              >
                <Icon name={item.icon} size={20} />
                <span className="tracking-tight">{item.short}</span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 bg-amber-200 rounded-full" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
