import { auth } from "@/auth";
import { deleteItem } from "@/services/library/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req, ctx) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteItem(id, me.user.id ?? me.user.email);
  if (!ok) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ ok: true });
}
