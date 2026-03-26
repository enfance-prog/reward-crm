"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePiroBurst } from "@/components/PiroBurstProvider";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "ダッシュボード", icon: "◈" },
  { href: "/listeners",  label: "リスナー",       icon: "◎" },
  { href: "/packages",   label: "パッケージ",     icon: "◻" },
  { href: "/distribute", label: "配布",           icon: "◆" },
  { href: "/templates",  label: "テンプレート",   icon: "◇" },
  { href: "/history",    label: "配布履歴",       icon: "◉" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const spawnBurst = usePiroBurst();
  const [handle, setHandle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onPiroInteract = (e: React.MouseEvent) => {
    spawnBurst(e.clientX, e.clientY);
  };

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => { if (d.handle) setHandle(d.handle); });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="app-root">
      {/* 背景ブロブ */}
      <div className="bg-blob bg-blob-1" />
      <div className="bg-blob bg-blob-2" />

      {/* モバイルオーバーレイ */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* サイドバー */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-logo">
          <button type="button" className="logo-mark-btn" onClick={onPiroInteract} aria-label="Reward-CRM">
            <span className="logo-mark">
              <Image src="/piro.png" alt="" width={32} height={32} className="logo-piro-img" priority />
            </span>
          </button>
          <span className="logo-text">reward<span className="logo-sub">crm</span></span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "nav-item--active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {active && <span className="nav-indicator" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{handle.charAt(0).toUpperCase()}</div>
            <span className="user-handle">{handle}</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <div className="main-wrapper">
        {/* モバイルヘッダー */}
        <header className="mobile-header">
          <button className="hamburger" onClick={() => setSidebarOpen(true)}>
            <span /><span /><span />
          </button>
          <button type="button" className="mobile-logo-mark-btn" onClick={onPiroInteract} aria-label="Reward-CRM">
            <Image src="/piro.png" alt="" width={26} height={26} className="mobile-piro-img" />
          </button>
          <span className="mobile-logo">rewardcrm</span>
        </header>

        <main className="main-content">
          {children}
        </main>
      </div>

      <style jsx>{`
        .app-root {
          display: flex;
          flex: 1;
          min-height: 0;
          width: 100%;
          background: #EDEAE3;
          font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* 背景ブロブ */
        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
        }
        .bg-blob-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #A8D8D0, transparent 70%);
          top: -200px; right: -100px;
          animation: blobFloat 12s ease-in-out infinite;
        }
        .bg-blob-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #F5C5A3, transparent 70%);
          bottom: -150px; left: 100px;
          animation: blobFloat 15s ease-in-out infinite reverse;
        }
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(30px,-30px) scale(1.08); }
        }

        /* サイドバー */
        .sidebar {
          width: 240px;
          flex-shrink: 0;
          align-self: stretch;
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0,0,0,0.06);
          display: flex;
          flex-direction: column;
          padding: 28px 16px;
          position: sticky;
          top: 0;
          min-height: 0;
          z-index: 50;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 8px 32px;
        }
        .logo-mark-btn {
          margin: 0;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 12px;
          flex-shrink: 0;
        }
        .logo-mark-btn:hover .logo-mark {
          box-shadow: 0 4px 14px rgba(0,0,0,0.12);
        }
        .logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 10px;
          flex-shrink: 0;
          overflow: hidden;
        }
        .logo-piro-img {
          object-fit: cover;
          border-radius: 8px;
        }
        .logo-text {
          font-size: 17px;
          font-weight: 700;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }
        .logo-sub { color: #8A8A8A; font-weight: 400; }

        /* ナビ */
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 14px;
          color: #2A2A2A;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
          cursor: pointer;
        }
        .nav-item:hover {
          background: rgba(0,0,0,0.06);
          color: #000000;
        }
        .nav-item--active {
          background: #111111;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .nav-item--active:hover {
          background: #222222;
          color: #FFFFFF;
        }
        .nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
        .nav-label { font-weight: 500; }
        .nav-indicator {
          width: 6px; height: 6px;
          background: #A8D8D0;
          border-radius: 50%;
          margin-left: auto;
          box-shadow: 0 0 6px rgba(168,216,208,0.8);
        }

        /* フッター */
        .sidebar-footer {
          border-top: 1px solid rgba(0,0,0,0.06);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
        }
        .user-avatar {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, #A8D8D0, #F5C5A3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #1A1A1A;
          flex-shrink: 0;
        }
        .user-handle {
          font-size: 14px;
          font-weight: 600;
          color: #0A0A0A;
        }
        .logout-btn {
          width: 100%;
          padding: 9px;
          background: transparent;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: 999px;
          font-size: 13px;
          color: #2A2A2A;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .logout-btn:hover {
          background: rgba(0,0,0,0.06);
          color: #000000;
          border-color: rgba(0,0,0,0.25);
        }

        /* メイン */
        .main-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          position: relative;
          z-index: 1;
        }
        .main-content {
          flex: 1;
          padding: 40px;
          max-width: 1100px;
          width: 100%;
        }

        /* モバイルヘッダー */
        .mobile-header {
          display: none;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          position: sticky;
          top: 0;
          z-index: 40;
        }
        .hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
        }
        .hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #1A1A1A;
          border-radius: 2px;
        }
        .mobile-logo-mark-btn {
          margin: 0;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 8px;
          flex-shrink: 0;
        }
        .mobile-logo-mark-btn:hover .mobile-piro-img {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .mobile-piro-img {
          border-radius: 8px;
          object-fit: cover;
          display: block;
        }
        .mobile-logo {
          font-size: 16px;
          font-weight: 700;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }

        /* モバイル対応 */
        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.3);
          z-index: 49;
        }

        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
          }
          .sidebar--open { transform: translateX(0); }
          .sidebar-overlay { display: block; }
          .mobile-header { display: flex; }
          .main-content { padding: 24px 16px; }
        }
      `}</style>
    </div>
  );
}
