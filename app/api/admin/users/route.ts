import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";

export async function POST(request: NextRequest) {
  // 管理者シークレットによる認証
  const adminSecret = request.headers.get("x-admin-secret");
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { handle, password, isAdmin = false } = await request.json();

    if (!handle || !password) {
      return NextResponse.json(
        { error: "handle と password は必須です" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await sql`
      INSERT INTO users (handle, password_hash, is_admin)
      VALUES (${handle}, ${passwordHash}, ${isAdmin})
      RETURNING id, handle, is_admin, created_at
    `;

    // デフォルトテンプレートを自動挿入
    await sql`SELECT insert_default_template(${result[0].id})`;

    return NextResponse.json({ success: true, user: result[0] });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("unique")
    ) {
      return NextResponse.json(
        { error: "そのハンドルは既に使用されています" },
        { status: 409 }
      );
    }
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "ユーザー作成に失敗しました" },
      { status: 500 }
    );
  }
}
