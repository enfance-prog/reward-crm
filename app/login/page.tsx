"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("通信エラーが発生しました。再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* 背景グラデーションブロブ */}
      <div className="blob blob-teal" />
      <div className="blob blob-peach" />
      <div className="blob blob-mint" />

      <main className="login-card">
        <div className="login-logo">
          <span className="logo-mark">R</span>
        </div>

        <div className="login-header">
          <h1 className="login-title">reward<span className="title-accent">crm</span></h1>
          <p className="login-subtitle">特典配布管理システム</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="handle" className="input-label">
              ハンドル
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="例: Pirozhki-Mizu"
              className="input-field"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div className="input-group">
            <label htmlFor="password" className="input-label">
              アクセスキー（パスワード）
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="input-field"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">!</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !handle.trim() || !password}
            className="submit-btn"
          >
            {loading ? (
              <span className="btn-loading">
                <span className="loading-dot" />
                <span className="loading-dot" />
                <span className="loading-dot" />
              </span>
            ) : (
              "ログイン"
            )}
          </button>
        </form>

        <p className="login-footer">
          アクセスキーは管理者から発行されます
        </p>
      </main>

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          background: #EDEAE3;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
        }

        /* グラデーションブロブ */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.45;
          animation: float 8s ease-in-out infinite;
        }
        .blob-teal {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #A8D8D0, transparent 70%);
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }
        .blob-peach {
          width: 450px;
          height: 450px;
          background: radial-gradient(circle, #F5C5A3, transparent 70%);
          bottom: -80px;
          right: -80px;
          animation-delay: -3s;
        }
        .blob-mint {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #B8E0D8, transparent 70%);
          bottom: 20%;
          left: 10%;
          animation-delay: -5s;
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -20px) scale(1.05); }
          66% { transform: translate(-15px, 15px) scale(0.97); }
        }

        /* カード */
        .login-card {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 28px;
          padding: 52px 48px;
          width: 100%;
          max-width: 400px;
          box-shadow:
            0 4px 6px rgba(0,0,0,0.04),
            0 20px 60px rgba(0,0,0,0.08),
            0 0 0 1px rgba(255,255,255,0.6) inset;
          animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ロゴ */
        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        .logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          background: #1A1A1A;
          color: #EDEAE3;
          border-radius: 14px;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          animation: logoIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
        }
        @keyframes logoIn {
          from { opacity: 0; transform: scale(0.7) rotate(-10deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* ヘッダー */
        .login-header {
          text-align: center;
          margin-bottom: 36px;
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
        }
        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #1A1A1A;
          letter-spacing: -1px;
          line-height: 1.1;
          margin: 0 0 6px;
        }
        .title-accent {
          color: #6B6B6B;
          font-weight: 400;
        }
        .login-subtitle {
          font-size: 13px;
          color: #9B9B9B;
          margin: 0;
          letter-spacing: 0.02em;
        }

        /* フォーム */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .input-label {
          font-size: 12px;
          font-weight: 600;
          color: #5A5A5A;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .input-field {
          width: 100%;
          padding: 14px 18px;
          background: rgba(237, 234, 227, 0.6);
          border: 1.5px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          font-size: 15px;
          color: #1A1A1A;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          letter-spacing: 0.1em;
        }
        .input-field::placeholder {
          color: #C0C0C0;
          letter-spacing: 0.15em;
        }
        .input-field:focus {
          background: rgba(255,255,255,0.9);
          border-color: #A8D8D0;
          box-shadow: 0 0 0 4px rgba(168, 216, 208, 0.2);
        }

        /* エラー */
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: rgba(245, 92, 68, 0.08);
          border: 1px solid rgba(245, 92, 68, 0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #D94040;
          animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97);
        }
        .error-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #D94040;
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* ボタン */
        .submit-btn {
          width: 100%;
          padding: 15px;
          background: #1A1A1A;
          color: #EDEAE3;
          border: none;
          border-radius: 999px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%);
          border-radius: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          background: #2A2A2A;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }
        .submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ローディング */
        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }
        .loading-dot {
          width: 6px;
          height: 6px;
          background: #EDEAE3;
          border-radius: 50%;
          animation: pulse 1.2s ease-in-out infinite;
        }
        .loading-dot:nth-child(2) { animation-delay: 0.2s; }
        .loading-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }

        /* フッター */
        .login-footer {
          text-align: center;
          font-size: 11.5px;
          color: #B0B0B0;
          margin: 20px 0 0;
          animation: fadeUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 16px;
            padding: 40px 28px;
          }
        }
      `}</style>
    </div>
  );
}
