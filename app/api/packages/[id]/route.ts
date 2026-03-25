import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, category, link_url } = await request.json();

  if (!name?.trim())     return NextResponse.json({ error: "パッケージ名は必須です" }, { status: 400 });
  if (!category?.trim()) return NextResponse.json({ error: "カテゴリは必須です" },     { status: 400 });
  if (!link_url?.trim()) return NextResponse.json({ error: "配布リンクは必須です" },   { status: 400 });

  try { new URL(link_url.trim()); } catch {
    return NextResponse.json({ error: "有効なURLを入力してください" }, { status: 400 });
  }

  const existing = await sql`SELECT id FROM packages WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`
    UPDATE packages SET name = ${name.trim()}, category = ${category.trim()}, link_url = ${link_url.trim()}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await sql`SELECT id FROM packages WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`DELETE FROM packages WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
