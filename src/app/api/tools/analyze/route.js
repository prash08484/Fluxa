import { auth } from "@/auth";
import { analyzeVideo } from "@/services/ai/agents/analyze.agent";
import { analyzeInputSchema } from "@/services/ai/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = analyzeInputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyzeVideo(parsed.data);
    return Response.json({ analysis });
  } catch (err) {
    return Response.json(
      { error: "Analysis failed.", detail: String(err?.message ?? err) },
      { status: 500 },
    );
  }
}
