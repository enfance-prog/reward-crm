import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  if (!["pending", "sent"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // 所有権確認（listenersのuser_idで確認）
  const dist = await sql`
    SELECT d.id FROM distributions d
    JOIN listeners l ON l.id = d.listener_id
    WHERE d.id = ${id} AND l.user_id = ${session.userId}
  `;
  if (!dist.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await sql`UPDATE distributions SET status = ${status} WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
