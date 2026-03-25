import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packages = await sql`
    SELECT
      p.id,
      p.name,
      p.category,
      p.link_url,
      p.created_at,
      COUNT(d.id) FILTER (WHERE d.status = 'sent')    AS sent_count,
      COUNT(d.id) FILTER (WHERE d.status = 'pending') AS pending_count
    FROM packages p
    LEFT JOIN distributions d ON d.package_id = p.id
    WHERE p.user_id = ${session.userId}
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  return NextResponse.json(packages);
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category, link_url } = await request.json();

  if (!name?.trim())     return NextResponse.json({ error: "パッケージ名は必須です" },   { status: 400 });
  if (!category?.trim()) return NextResponse.json({ error: "カテゴリは必須です" },       { status: 400 });
  if (!link_url?.trim()) return NextResponse.json({ error: "配布リンクは必須です" },     { status: 400 });

  // URLの簡易バリデーション
  try { new URL(link_url.trim()); } catch {
    return NextResponse.json({ error: "有効なURLを入力してください" }, { status: 400 });
  }

  const result = await sql`
    INSERT INTO packages (user_id, name, category, link_url)
    VALUES (${session.userId}, ${name.trim()}, ${category.trim()}, ${link_url.trim()})
    RETURNING id, name, category, link_url, created_at
  `;

  return NextResponse.json(result[0], { status: 201 });
}
