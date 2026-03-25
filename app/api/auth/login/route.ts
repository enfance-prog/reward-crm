import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { sessionOptions, SessionData } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const handle = typeof body.handle === "string" ? body.handle.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!handle || !password) {
      return NextResponse.json(
        { error: "ハンドルとアクセスキー（パスワード）を入力してください" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT id, handle, password_hash, is_admin
      FROM users
      WHERE handle = ${handle}
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "ログインに失敗しました" },
        { status: 401 }
      );
    }

    const user = rows[0] as {
      id: number;
      handle: string;
      password_hash: string;
      is_admin: boolean;
    };

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "ログインに失敗しました" },
        { status: 401 }
      );
    }

    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    session.userId = user.id;
    session.handle = user.handle;
    session.isAdmin = user.is_admin;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: "ログインに失敗しました" },
      { status: 500 }
    );
  }
}
