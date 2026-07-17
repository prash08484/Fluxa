import { auth } from "@/auth";
import { youtubeUrlSchema } from "@/services/ai/schemas";
import { fetchYouTubeTranscript } from "@/services/youtube/transcript";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }

  const parsed = youtubeUrlSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues?.[0]?.message ?? "Invalid URL." },
      { status: 400 },
    );
  }

  try {
    const out = await fetchYouTubeTranscript(parsed.data.url);
    return Response.json(out);
  } catch (err) {
    // Friendly errors from the service already; pass through.
    return Response.json({ error: String(err?.message ?? err) }, { status: 422 });
  }
}
