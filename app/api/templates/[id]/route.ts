import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, subject, body, is_default } = await request.json();

  if (!name?.trim())    return NextResponse.json({ error: "テンプレート名は必須です" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "件名は必須です" },           { status: 400 });
  if (!body?.trim())    return NextResponse.json({ error: "本文は必須です" },           { status: 400 });

  const existing = await sql`SELECT id FROM message_templates WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (is_default) {
    await sql`UPDATE message_templates SET is_default = false WHERE user_id = ${session.userId}`;
  }

  await sql`
    UPDATE message_templates
    SET name = ${name.trim()}, subject = ${subject.trim()}, body = ${body.trim()}, is_default = ${is_default ?? false}
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await sql`SELECT id, is_default FROM message_templates WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing[0].is_default) return NextResponse.json({ error: "デフォルトテンプレートは削除できません" }, { status: 400 });

  await sql`DELETE FROM message_templates WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
