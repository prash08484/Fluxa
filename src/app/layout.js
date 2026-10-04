import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata = {
  title: "FluxAgent — The AI Operating System for Creators",
  description:
    "Type a niche. Get trending ideas, hooks, full scripts, thumbnail concepts and SEO — in one canvas. Built for creators who'd rather film than think about what to film.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-zinc-100 font-sans selection:bg-amber-200/30 selection:text-amber-100">
        <div className="canvas-grid pointer-events-none fixed inset-0 -z-10" />
        <div className="canvas-glow pointer-events-none fixed inset-0 -z-10" />
        {children}
      </body>
    </html>
  );
}
