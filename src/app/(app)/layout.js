import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/app/Sidebar";
import { BottomTabs } from "@/components/app/BottomTabs";

/**
 * Layout for all signed-in app routes.
 *
 * Auth: checked server-side here so every (app) page is gated in one place.
 * No middleware/proxy needed.
 *
 * Shell:
 *   - desktop (md+): fixed sidebar on the left, scrollable main on the right
 *   - mobile (<md):  full-width main, fixed bottom tab bar (mobile-app feel)
 */
export default async function AppLayout({ children }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />

      <div className="flex-1 flex flex-col md:pl-64">
        <main className="flex-1 pb-28 md:pb-12 pt-8 md:pt-12">
          <div className="mx-auto max-w-5xl px-5 sm:px-8">{children}</div>
        </main>
      </div>

      <BottomTabs />
    </div>
  );
}
