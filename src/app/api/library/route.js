import { auth } from "@/auth";
import { libraryCreateSchema } from "@/services/ai/schemas";
import { createItem, listItems } from "@/services/library/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? undefined;
  const items = await listItems(me.user.id ?? me.user.email, { type });
  return Response.json({ items });
}

export async function POST(request) {
  const me = await auth();
  if (!me?.user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = libraryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid input.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await createItem({
    userId: me.user.id ?? me.user.email,
    ...parsed.data,
  });
  return Response.json({ item }, { status: 201 });
}
