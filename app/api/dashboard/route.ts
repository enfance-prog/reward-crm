import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.userId;

  const [
    listenerStats,
    packageStats,
    recentDistributions,
    monthlyStats,
  ] = await Promise.all([
    // リスナー総数 & 配布済み/未配布
    sql`
      SELECT
        COUNT(DISTINCT l.id) AS total_listeners,
        COUNT(DISTINCT CASE WHEN d.status = 'sent' THEN l.id END) AS sent_listeners,
        COUNT(DISTINCT CASE WHEN d.status = 'pending' OR d.id IS NULL THEN l.id END) AS pending_listeners
      FROM listeners l
      LEFT JOIN distributions d ON d.listener_id = l.id
      WHERE l.user_id = ${userId}
    `,
    // パッケージ総数
    sql`
      SELECT COUNT(*) AS total_packages
      FROM packages
      WHERE user_id = ${userId}
    `,
    // 直近10件の配布履歴
    sql`
      SELECT
        d.id,
        d.status,
        d.sent_at,
        d.created_at,
        l.name AS listener_name,
        p.name AS package_name,
        p.category
      FROM distributions d
      JOIN listeners l ON l.id = d.listener_id
      JOIN packages p ON p.id = d.package_id
      WHERE l.user_id = ${userId}
      ORDER BY COALESCE(d.sent_at, d.created_at) DESC
      LIMIT 10
    `,
    // 今月の配布数
    sql`
      SELECT COUNT(*) AS this_month
      FROM distributions d
      JOIN listeners l ON l.id = d.listener_id
      WHERE l.user_id = ${userId}
        AND d.status = 'sent'
        AND d.sent_at >= date_trunc('month', NOW())
    `,
  ]);

  return NextResponse.json({
    listeners: listenerStats[0],
    packages: packageStats[0],
    recentDistributions,
    monthlyStats: monthlyStats[0],
  });
}
