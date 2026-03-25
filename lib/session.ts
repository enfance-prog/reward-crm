import { SessionOptions } from "iron-session";

export interface SessionData {
  userId: number;
  handle: string;
  isAdmin: boolean;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "reward-crm-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: undefined, // ブラウザセッション（閉じたらログアウト）
  },
};
