import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

// 配布レコードを作成（pending状態で登録）
export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listenerIds, packageId, templateId } = await request.json();

  if (!listenerIds?.length || !packageId) {
    return NextResponse.json({ error: "リスナーとパッケージを選択してください" }, { status: 400 });
  }

  // 所有権確認
  const pkg = await sql`SELECT id FROM packages WHERE id = ${packageId} AND user_id = ${session.userId}`;
  if (!pkg.length) return NextResponse.json({ error: "パッケージが見つかりません" }, { status: 404 });

  // 各リスナーに配布レコード作成（既存のpendingがあればスキップ）
  const created = [];
  for (const listenerId of listenerIds) {
    const listener = await sql`SELECT id FROM listeners WHERE id = ${listenerId} AND user_id = ${session.userId}`;
    if (!listener.length) continue;

    const result = await sql`
      INSERT INTO distributions (listener_id, package_id, template_id, status)
      VALUES (${listenerId}, ${packageId}, ${templateId ?? null}, 'pending')
      RETURNING id
    `;
    created.push(result[0].id);
  }

  return NextResponse.json({ success: true, created });
}
