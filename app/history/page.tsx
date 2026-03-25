"use client";

import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";

const PLATFORM_COLORS: Record<string, string> = { x: "#1A1A1A", discord: "#5865F2", twitch: "#9146FF" };
const PLATFORM_LABELS: Record<string, string> = { x: "X", discord: "Discord", twitch: "Twitch" };

const RANGE_OPTIONS = [
  { value: "month",    label: "1ヶ月" },
  { value: "3months",  label: "3ヶ月" },
  { value: "6months",  label: "6ヶ月" },
  { value: "year",     label: "1年" },
];

interface Distribution {
  id: number; status: string; sent_at: string | null; created_at: string;
  listener_name: string; package_name: string; category: string; link_url: string;
  contact_links: { platform: string; deep_link: string }[];
}
interface Summary { total: number; sent: number; pending: number; }

function StatusBadge({ status, distId, onUpdate }: { status: string; distId: number; onUpdate: (id: number, s: string) => void }) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    const next = current === "sent" ? "pending" : "sent";
    setLoading(true);
    await fetch(`/api/distribute/${distId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setCurrent(next);
    onUpdate(distId, next);
    setLoading(false);
  };

  return (
    <button className={`status-btn status-btn--${current} ${loading ? "status-btn--loading" : ""}`} onClick={toggle} disabled={loading}>
      {loading ? "..." : current === "sent" ? "✓ 配布済み" : "未配布"}
      <style jsx>{`
        .status-btn { font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 999px; border: none; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .status-btn--sent { background: rgba(168,216,208,0.25); color: #2A8A80; }
        .status-btn--sent:hover { background: rgba(168,216,208,0.4); }
        .status-btn--pending { background: rgba(245,197,163,0.25); color: #C07040; }
        .status-btn--pending:hover { background: rgba(245,197,163,0.4); }
        .status-btn--loading { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </button>
  );
}

export default function HistoryPage() {
  const [data, setData] = useState<{ distributions: Distribution[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "pending">("all");
  const [titleVisible, setTitleVisible] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/history?range=${range}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    fetchHistory();
    return () => clearTimeout(t);
  }, [fetchHistory]);

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setData((prev) => {
      if (!prev) return prev;
      const distributions = prev.distributions.map((d) => d.id === id ? { ...d, status: newStatus } : d);
      const sent = distributions.filter((d) => d.status === "sent").length;
      const pending = distributions.filter((d) => d.status === "pending").length;
      return { distributions, summary: { total: distributions.length, sent, pending } };
    });
  };

  const filtered = (data?.distributions ?? []).filter((d) => {
    const matchSearch = d.listener_name.toLowerCase().includes(search.toLowerCase()) ||
      d.package_name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (d: Distribution) => {
    const dt = d.sent_at ? new Date(d.sent_at) : new Date(d.created_at);
    return dt.toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <AppLayout>
      <div className="history-page">
        {/* ヘッダー */}
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">配布履歴</h1>
            <p className="page-subtitle">過去の特典配布の記録</p>
          </div>
        </div>

        {/* 期間フィルター */}
        <div className={`controls ${titleVisible ? "controls--visible" : ""}`}>
          <div className="range-pills">
            {RANGE_OPTIONS.map((opt) => (
              <button key={opt.value} className={`range-pill ${range === opt.value ? "range-pill--active" : ""}`} onClick={() => setRange(opt.value)}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="right-controls">
            {/* ステータスフィルター */}
            <div className="status-filter">
              {(["all", "sent", "pending"] as const).map((s) => (
                <button key={s} className={`status-filter-btn ${statusFilter === s ? "status-filter-btn--active" : ""}`} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "すべて" : s === "sent" ? "配布済み" : "未配布"}
                </button>
              ))}
            </div>
            {/* 検索 */}
            <div className="search-box">
              <span className="search-icon">◎</span>
              <input className="search-input" placeholder="検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        {!loading && data && (
          <div className="summary-row">
            {[
              { label: "総件数", value: data.summary.total, color: "#1A1A1A" },
              { label: "配布済み", value: data.summary.sent, color: "#2A8A80" },
              { label: "未配布", value: data.summary.pending, color: "#C07040" },
            ].map((s, i) => (
              <div key={i} className="summary-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="summary-value" style={{ color: s.color }}>{s.value}</div>
                <div className="summary-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 履歴テーブル */}
        <div className="history-card">
          {loading ? (
            <div className="skeleton-list">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◉</div>
              <p className="empty-title">{search || statusFilter !== "all" ? "該当する履歴がありません" : "配布履歴がありません"}</p>
            </div>
          ) : (
            <>
              <div className="table-header">
                <span>リスナー</span>
                <span>パッケージ / カテゴリ</span>
                <span>連絡先</span>
                <span>日付</span>
                <span>ステータス</span>
              </div>
              <div className="table-body">
                {filtered.map((d, i) => (
                  <div key={d.id} className="table-row" style={{ animationDelay: `${i * 0.04}s` }}>
                    {/* リスナー */}
                    <div className="cell-listener">
                      <div className="listener-avatar">{d.listener_name.charAt(0).toUpperCase()}</div>
                      <span className="listener-name">{d.listener_name}</span>
                    </div>
                    {/* パッケージ */}
                    <div className="cell-package">
                      <span className="pkg-name">{d.package_name}</span>
                      <span className="pkg-cat">{d.category}</span>
                    </div>
                    {/* 連絡先 */}
                    <div className="cell-contact">
                      {d.contact_links.length > 0
                        ? d.contact_links.map((cl) => (
                            <a key={cl.platform} href={cl.deep_link} target="_blank" rel="noopener noreferrer"
                              className="contact-tag" style={{ color: PLATFORM_COLORS[cl.platform], background: `${PLATFORM_COLORS[cl.platform]}12` }}>
                              {PLATFORM_LABELS[cl.platform]}
                            </a>
                          ))
                        : <span className="no-contact">-</span>
                      }
                    </div>
                    {/* 日付 */}
                    <div className="cell-date">{formatDate(d)}</div>
                    {/* ステータス */}
                    <div className="cell-status">
                      <StatusBadge status={d.status} distId={d.id} onUpdate={handleStatusUpdate} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="table-footer">
                {filtered.length} 件表示中（全 {data?.summary.total ?? 0} 件）
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .history-page { display: flex; flex-direction: column; gap: 20px; }

        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }

        /* コントロール */
        .controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s; }
        .controls--visible { opacity: 1; transform: translateY(0); }
        .range-pills { display: flex; gap: 6px; background: white; border-radius: 999px; padding: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .range-pill { padding: 8px 16px; border-radius: 999px; border: none; font-size: 13px; font-weight: 500; color: #6B6B6B; background: transparent; cursor: pointer; transition: all 0.2s ease; }
        .range-pill--active { background: #1A1A1A; color: #EDEAE3; font-weight: 600; }
        .right-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .status-filter { display: flex; gap: 4px; background: white; border-radius: 999px; padding: 3px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .status-filter-btn { padding: 7px 14px; border-radius: 999px; border: none; font-size: 12px; font-weight: 500; color: #6B6B6B; background: transparent; cursor: pointer; transition: all 0.15s ease; }
        .status-filter-btn--active { background: #1A1A1A; color: #EDEAE3; font-weight: 600; }
        .search-box { display: flex; align-items: center; gap: 8px; background: white; border-radius: 12px; padding: 9px 14px; border: 1.5px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: border-color 0.2s; }
        .search-box:focus-within { border-color: #A8D8D0; }
        .search-icon { font-size: 14px; color: #B0B0B0; }
        .search-input { background: transparent; border: none; outline: none; font-size: 14px; color: #1A1A1A; width: 160px; }
        .search-input::placeholder { color: #C0C0C0; }

        /* サマリー */
        .summary-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .summary-card { background: white; border-radius: 16px; padding: 20px 24px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 8px rgba(0,0,0,0.04); animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .summary-value { font-size: 36px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; margin-bottom: 4px; }
        .summary-label { font-size: 12px; font-weight: 600; color: #9B9B9B; text-transform: uppercase; letter-spacing: 0.05em; }

        /* 履歴カード */
        .history-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.04); animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .table-header { display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 100px 100px; gap: 16px; padding: 14px 20px; font-size: 11px; font-weight: 600; color: #B0B0B0; letter-spacing: 0.05em; text-transform: uppercase; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .table-body { display: flex; flex-direction: column; }
        .table-row { display: grid; grid-template-columns: 1.2fr 1.5fr 1fr 100px 100px; gap: 16px; padding: 14px 20px; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.04); transition: background 0.15s ease; animation: rowIn 0.35s cubic-bezier(0.16,1,0.3,1) both; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: #FAFAF8; }
        @keyframes rowIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
        .cell-listener { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .listener-avatar { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, #A8D8D0, #F5C5A3); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #1A1A1A; flex-shrink: 0; }
        .listener-name { font-size: 14px; font-weight: 600; color: #1A1A1A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cell-package { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .pkg-name { font-size: 13px; color: #3A3A3A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
        .pkg-cat { font-size: 11px; background: #EDEAE3; color: #6B6B6B; padding: 2px 8px; border-radius: 999px; width: fit-content; }
        .cell-contact { display: flex; gap: 5px; flex-wrap: wrap; }
        .contact-tag { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; text-decoration: none; transition: opacity 0.15s; }
        .contact-tag:hover { opacity: 0.7; }
        .no-contact { font-size: 13px; color: #C0C0C0; }
        .cell-date { font-size: 13px; color: #9B9B9B; white-space: nowrap; }
        .cell-status { display: flex; }
        .table-footer { padding: 12px 20px; font-size: 12px; color: #B0B0B0; border-top: 1px solid rgba(0,0,0,0.04); }

        .skeleton-list { display: flex; flex-direction: column; gap: 1px; }
        .skeleton-row { height: 62px; background: linear-gradient(90deg, #f7f5f0 25%, #f0ede6 50%, #f7f5f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.2; }
        .empty-title { font-size: 15px; color: #9B9B9B; margin: 0; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

        @media (max-width: 900px) {
          .table-header { grid-template-columns: 1fr 1fr 80px 90px; }
          .table-header span:nth-child(3) { display: none; }
          .table-row { grid-template-columns: 1fr 1fr 80px 90px; }
          .cell-contact { display: none; }
        }
        @media (max-width: 640px) {
          .controls { flex-direction: column; align-items: flex-start; }
          .right-controls { width: 100%; }
          .search-input { width: 100%; }
          .table-header { display: none; }
          .table-row { grid-template-columns: 1fr auto; grid-template-rows: auto auto; gap: 8px; }
          .cell-package { grid-column: 1; }
          .cell-date { display: none; }
          .cell-status { grid-column: 2; grid-row: 1 / 3; align-items: center; }
        }
      `}</style>
    </AppLayout>
  );
}
