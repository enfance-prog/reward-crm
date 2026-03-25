import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listeners = await sql`
    SELECT
      l.id,
      l.name,
      l.created_at,
      COALESCE(
        json_agg(
          json_build_object('id', cl.id, 'platform', cl.platform, 'deep_link', cl.deep_link)
          ORDER BY cl.platform
        ) FILTER (WHERE cl.id IS NOT NULL),
        '[]'
      ) AS contact_links,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'sent') AS sent_count,
      COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'pending') AS pending_count
    FROM listeners l
    LEFT JOIN contact_links cl ON cl.listener_id = l.id
    LEFT JOIN distributions d ON d.listener_id = l.id
    WHERE l.user_id = ${session.userId}
    GROUP BY l.id, l.name, l.created_at
    ORDER BY l.created_at DESC
  `;

  return NextResponse.json(listeners);
}

export async function POST(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, contactLinks } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "リスナー名は必須です" }, { status: 400 });

  // リスナー作成
  const result = await sql`
    INSERT INTO listeners (user_id, name)
    VALUES (${session.userId}, ${name.trim()})
    RETURNING id, name, created_at
  `;
  const listener = result[0];

  // 連絡先リンクを挿入
  if (contactLinks?.length) {
    for (const link of contactLinks) {
      if (link.platform && link.deep_link?.trim()) {
        await sql`
          INSERT INTO contact_links (listener_id, platform, deep_link)
          VALUES (${listener.id}, ${link.platform}, ${link.deep_link.trim()})
          ON CONFLICT (listener_id, platform) DO UPDATE SET deep_link = EXCLUDED.deep_link
        `;
      }
    }
  }

  return NextResponse.json(listener, { status: 201 });
}
