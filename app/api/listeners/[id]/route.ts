import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, contactLinks } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "リスナー名は必須です" }, { status: 400 });

  // 所有権確認
  const existing = await sql`SELECT id FROM listeners WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // リスナー名更新
  await sql`UPDATE listeners SET name = ${name.trim()} WHERE id = ${id}`;

  // 連絡先リンクを全削除→再挿入
  await sql`DELETE FROM contact_links WHERE listener_id = ${id}`;
  if (contactLinks?.length) {
    for (const link of contactLinks) {
      if (link.platform && link.deep_link?.trim()) {
        await sql`
          INSERT INTO contact_links (listener_id, platform, deep_link)
          VALUES (${id}, ${link.platform}, ${link.deep_link.trim()})
        `;
      }
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // 所有権確認
  const existing = await sql`SELECT id FROM listeners WHERE id = ${id} AND user_id = ${session.userId}`;
  if (!existing.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`DELETE FROM listeners WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
