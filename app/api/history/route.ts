import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "month"; // month | 3months | 6months | year

  // 期間の計算
  const rangeMap: Record<string, string> = {
    month:   "1 month",
    "3months": "3 months",
    "6months": "6 months",
    year:    "1 year",
  };
  const interval = rangeMap[range] ?? "1 month";

  const distributions = await sql`
    SELECT
      d.id,
      d.status,
      d.sent_at,
      d.created_at,
      l.name AS listener_name,
      p.name AS package_name,
      p.category,
      p.link_url,
      ARRAY(
        SELECT json_build_object('platform', cl.platform, 'deep_link', cl.deep_link)
        FROM contact_links cl WHERE cl.listener_id = l.id
      ) AS contact_links
    FROM distributions d
    JOIN listeners l ON l.id = d.listener_id
    JOIN packages p  ON p.id = d.package_id
    WHERE l.user_id = ${session.userId}
      AND COALESCE(d.sent_at, d.created_at) >= NOW() - CAST(${interval} AS INTERVAL)
    ORDER BY COALESCE(d.sent_at, d.created_at) DESC
  `;

  // サマリー
  const total = distributions.length;
  const sent = distributions.filter((d) => d.status === "sent").length;
  const pending = distributions.filter((d) => d.status === "pending").length;

  return NextResponse.json({ distributions, summary: { total, sent, pending } });
}
