import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET(request: NextRequest) {
  // ログイン確認
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.replace(/^@/, "").trim();

  if (!username) {
    return NextResponse.json({ error: "ユーザー名を入力してください" }, { status: 400 });
  }

  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json(
      { error: "Twitter Bearer Token が設定されていません" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(username)}`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        // Next.jsのキャッシュを使いつつ、1時間で再検証
        next: { revalidate: 3600 },
      }
    );

    if (res.status === 404) {
      return NextResponse.json(
        { error: `@${username} は見つかりませんでした` },
        { status: 404 }
      );
    }

    if (res.status === 429) {
      return NextResponse.json(
        { error: "APIの利用制限に達しました。しばらく待ってから再試行してください" },
        { status: 429 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Xからのレスポンスでエラーが発生しました" },
        { status: res.status }
      );
    }

    const data = await res.json();

    if (data.errors) {
      return NextResponse.json(
        { error: data.errors[0]?.detail ?? "ユーザーが見つかりませんでした" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.data.id,
      name: data.data.name,
      username: data.data.username,
    });
  } catch (error) {
    console.error("Twitter API error:", error);
    return NextResponse.json(
      { error: "X APIへの接続に失敗しました" },
      { status: 500 }
    );
  }
}
