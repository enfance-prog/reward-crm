import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await sql`
    SELECT id, name, subject, body, is_default, created_at
    FROM message_templates
    WHERE user_id = ${session.userId}
    ORDER BY is_default DESC, created_at ASC
  `;
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, subject, body, is_default } = await request.json();
  if (!name?.trim())    return NextResponse.json({ error: "テンプレート名は必須です" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "件名は必須です" },           { status: 400 });
  if (!body?.trim())    return NextResponse.json({ error: "本文は必須です" },           { status: 400 });

  // デフォルト設定時は他を解除
  if (is_default) {
    await sql`UPDATE message_templates SET is_default = false WHERE user_id = ${session.userId}`;
  }

  const result = await sql`
    INSERT INTO message_templates (user_id, name, subject, body, is_default)
    VALUES (${session.userId}, ${name.trim()}, ${subject.trim()}, ${body.trim()}, ${is_default ?? false})
    RETURNING id, name, subject, body, is_default, created_at
  `;
  return NextResponse.json(result[0], { status: 201 });
}
