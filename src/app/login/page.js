import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";

export const metadata = {
  title: "Sign in — vidagent",
};

export default async function LoginPage({ searchParams }) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = typeof params?.callbackUrl === "string" ? params.callbackUrl : "/dashboard";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-12">
      <div className="w-full max-w-md paper-card p-8 sm:p-10 relative">
        <div className="absolute -top-3 left-6 sticky-note px-3 py-1 text-xs font-hand rounded -rotate-3">
          one click in
        </div>

        <div className="text-center mb-8">
          <div className="inline-grid h-12 w-12 place-items-center rounded-xl logo-chip font-bold text-xl mb-4">
            v
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in to open your canvas.
          </p>
        </div>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-3 h-12 rounded-full bg-zinc-50 text-zinc-950 font-medium hover:bg-white transition-colors"
          >
            <GoogleMark />
            Continue with Google
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          By continuing you agree to terms. We never post on your behalf.
        </p>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
