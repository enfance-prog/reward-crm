"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import Link from "next/link";

interface DashboardData {
  listeners: {
    total_listeners: string;
    sent_listeners: string;
    pending_listeners: string;
  };
  packages: { total_packages: string };
  recentDistributions: Array<{
    id: number;
    status: string;
    sent_at: string | null;
    created_at: string;
    listener_name: string;
    package_name: string;
    category: string;
  }>;
  monthlyStats: { this_month: string };
}

function StatCard({ label, value, sub, accent, delay }: {
  label: string; value: string | number; sub?: string; accent?: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`stat-card ${visible ? "stat-card--visible" : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <style jsx>{`
        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 28px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.04);
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                      transform 0.5s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.2s ease;
        }
        .stat-card--visible { opacity: 1; transform: translateY(0); }
        .stat-card:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.1); transform: translateY(-2px); }
        .stat-label { font-size: 11px; font-weight: 600; color: #9B9B9B; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
        .stat-value { font-size: 40px; font-weight: 700; color: #1A1A1A; letter-spacing: -2px; line-height: 1; margin-bottom: 6px; }
        .stat-sub { font-size: 12px; color: #9B9B9B; }
      `}</style>
    </div>
  );
}

function DistRow({ item, delay }: { item: DashboardData["recentDistributions"][0]; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const date = item.sent_at
    ? new Date(item.sent_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
    : new Date(item.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" });

  return (
    <div className={`dist-row ${visible ? "dist-row--visible" : ""}`}>
      <div className="dist-listener">{item.listener_name}</div>
      <div className="dist-package">
        <span className="dist-pkg-name">{item.package_name}</span>
        <span className="dist-cat">{item.category}</span>
      </div>
      <div className="dist-date">{date}</div>
      <div className={`dist-badge dist-badge--${item.status}`}>
        {item.status === "sent" ? "配布済み" : "未配布"}
      </div>
      <style jsx>{`
        .dist-row {
          display: grid;
          grid-template-columns: 1fr 2fr 80px 80px;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-radius: 12px;
          opacity: 0;
          transform: translateX(-12px);
          transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1),
                      transform 0.4s cubic-bezier(0.16,1,0.3,1),
                      background 0.15s ease;
        }
        .dist-row--visible { opacity: 1; transform: translateX(0); }
        .dist-row:hover { background: rgba(0,0,0,0.025); }
        .dist-listener { font-size: 14px; font-weight: 600; color: #1A1A1A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dist-package { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .dist-pkg-name { font-size: 13px; color: #3A3A3A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .dist-cat { font-size: 11px; background: #EDEAE3; color: #6B6B6B; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
        .dist-date { font-size: 13px; color: #9B9B9B; }
        .dist-badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; text-align: center; }
        .dist-badge--sent { background: rgba(168,216,208,0.3); color: #2A8A80; }
        .dist-badge--pending { background: rgba(245,197,163,0.3); color: #C07040; }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
    return () => clearTimeout(t);
  }, []);

  const totalListeners = Number(data?.listeners.total_listeners ?? 0);
  const pendingListeners = Number(data?.listeners.pending_listeners ?? 0);
  const sentListeners = Number(data?.listeners.sent_listeners ?? 0);
  const totalPackages = Number(data?.packages.total_packages ?? 0);
  const thisMonth = Number(data?.monthlyStats?.this_month ?? 0);
  const sentRate = totalListeners > 0 ? Math.round((sentListeners / totalListeners) * 100) : 0;

  return (
    <AppLayout>
      <div className="dashboard">
        {/* ヘッダー */}
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">ダッシュボード</h1>
            <p className="page-subtitle">特典配布の概要と最近の活動</p>
          </div>
          <Link href="/distribute" className="cta-btn">+ 配布を開始</Link>
        </div>

        {/* ステータスカード */}
        <div className="stats-grid">
          <StatCard label="リスナー総数" value={loading ? "—" : totalListeners} sub="登録済みリスナー" delay={100} />
          <StatCard label="未配布" value={loading ? "—" : pendingListeners} sub="配布待ち" accent={pendingListeners > 0 ? "#C07040" : undefined} delay={180} />
          <StatCard label="配布済み率" value={loading ? "—" : `${sentRate}%`} sub={`${sentListeners} / ${totalListeners} 名`} accent="#2A8A80" delay={260} />
          <StatCard label="今月の配布" value={loading ? "—" : thisMonth} sub="件" delay={340} />
          <StatCard label="パッケージ数" value={loading ? "—" : totalPackages} sub="登録済み" delay={420} />
        </div>

        {/* 進捗バー */}
        {!loading && totalListeners > 0 && (
          <div className="progress-card">
            <div className="progress-header">
              <span className="progress-label">今月の配布進捗</span>
              <span className="progress-rate">{sentRate}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${sentRate}%` }} />
            </div>
            <div className="progress-detail">配布済み {sentListeners} 名 / 全 {totalListeners} 名</div>
          </div>
        )}

        {/* 最近の配布履歴 */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">最近の配布履歴</h2>
            <Link href="/history" className="section-link">すべて見る →</Link>
          </div>
          {loading ? (
            <div className="loading-rows">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : !data?.recentDistributions.length ? (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <p className="empty-text">まだ配布履歴がありません</p>
              <Link href="/distribute" className="empty-cta">配布を開始する</Link>
            </div>
          ) : (
            <div className="dist-list">
              <div className="dist-list-header">
                <span>リスナー</span><span>パッケージ</span><span>日付</span><span>ステータス</span>
              </div>
              {data.recentDistributions.map((item, i) => (
                <DistRow key={item.id} item={item} delay={100 + i * 60} />
              ))}
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="quick-actions">
          {[
            { href: "/listeners",  icon: "◎", label: "リスナーを追加", desc: "名簿を管理" },
            { href: "/packages",   icon: "◻", label: "パッケージを作成", desc: "特典を登録" },
            { href: "/distribute", icon: "◆", label: "配布を開始", desc: "特典を送る" },
          ].map((action, i) => (
            <Link key={action.href} href={action.href} className="qa-card" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
              <span className="qa-icon">{action.icon}</span>
              <div><div className="qa-label">{action.label}</div><div className="qa-desc">{action.desc}</div></div>
              <span className="qa-arrow">→</span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .dashboard { display: flex; flex-direction: column; gap: 28px; }

        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }
        .cta-btn { padding: 12px 24px; background: #1A1A1A; color: #EDEAE3; border-radius: 999px; font-size: 14px; font-weight: 600; text-decoration: none; transition: all 0.2s ease; white-space: nowrap; }
        .cta-btn:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }

        .stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }

        .progress-card { background: white; border-radius: 20px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .progress-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .progress-label { font-size: 13px; font-weight: 600; color: #6B6B6B; }
        .progress-rate { font-size: 13px; font-weight: 700; color: #2A8A80; }
        .progress-track { height: 8px; background: #EDEAE3; border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #A8D8D0, #2A8A80); border-radius: 999px; transition: width 1s cubic-bezier(0.16,1,0.3,1); }
        .progress-detail { font-size: 12px; color: #9B9B9B; }

        .section-card { background: white; border-radius: 20px; padding: 28px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.6s both; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: 700; color: #1A1A1A; margin: 0; letter-spacing: -0.3px; }
        .section-link { font-size: 13px; color: #9B9B9B; text-decoration: none; transition: color 0.15s; }
        .section-link:hover { color: #1A1A1A; }

        .dist-list-header { display: grid; grid-template-columns: 1fr 2fr 80px 80px; gap: 16px; padding: 0 20px 10px; font-size: 11px; font-weight: 600; color: #B0B0B0; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.05); margin-bottom: 6px; }

        .loading-rows { display: flex; flex-direction: column; gap: 8px; }
        .skeleton-row { height: 44px; background: linear-gradient(90deg, #f0ede6 25%, #e8e5de 50%, #f0ede6 75%); background-size: 200% 100%; border-radius: 12px; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state { text-align: center; padding: 48px 24px; }
        .empty-icon { font-size: 32px; margin-bottom: 12px; opacity: 0.3; }
        .empty-text { font-size: 14px; color: #9B9B9B; margin: 0 0 16px; }
        .empty-cta { display: inline-block; padding: 10px 24px; background: #1A1A1A; color: #EDEAE3; border-radius: 999px; font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.2s ease; }
        .empty-cta:hover { background: #2A2A2A; transform: translateY(-1px); }

        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .qa-card { display: flex; align-items: center; gap: 14px; background: white; border-radius: 16px; padding: 20px; text-decoration: none; border: 1px solid rgba(0,0,0,0.04); box-shadow: 0 2px 12px rgba(0,0,0,0.05); transition: all 0.2s cubic-bezier(0.16,1,0.3,1); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .qa-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.1); border-color: rgba(168,216,208,0.5); }
        .qa-icon { font-size: 20px; width: 44px; height: 44px; background: #EDEAE3; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .qa-label { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 2px; }
        .qa-desc { font-size: 12px; color: #9B9B9B; }
        .qa-arrow { font-size: 16px; color: #C0C0C0; margin-left: auto; transition: transform 0.2s ease; }
        .qa-card:hover .qa-arrow { transform: translateX(4px); color: #1A1A1A; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: 1fr; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .dist-list-header { display: none; }
        }
      `}</style>
    </AppLayout>
  );
}
