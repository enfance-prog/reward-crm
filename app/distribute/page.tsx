"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

const PLATFORM_LABELS: Record<string, string> = { x: "X", discord: "Discord", twitch: "Twitch" };
const PLATFORM_COLORS: Record<string, string> = { x: "#1A1A1A", discord: "#5865F2", twitch: "#9146FF" };

interface Listener {
  id: number; name: string;
  contact_links: { platform: string; deep_link: string }[];
  sent_count: string; pending_count: string;
}
interface Package { id: number; name: string; category: string; link_url: string; }
interface Template { id: number; name: string; subject: string; body: string; is_default: boolean; }

// ---- メッセージ変数展開 ----
function expandTemplate(template: string, vars: Record<string, string>) {
  return template
    .replace(/\[yyyy\]/g, vars.yyyy)
    .replace(/\[m\]/g, vars.m)
    .replace(/\[name\]/g, vars.name)
    .replace(/\[category\]/g, vars.category)
    .replace(/\[link_url\]/g, vars.link_url);
}

function getTemplateVars(listenerName: string, pkg: Package) {
  const now = new Date();
  return {
    yyyy: String(now.getFullYear()),
    m: String(now.getMonth() + 1),
    name: listenerName,
    category: pkg.category,
    link_url: pkg.link_url,
  };
}

// ---- ステップインジケーター ----
function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <div className="step-indicator">
      {steps.map((label, i) => (
        <div key={i} className={`step ${i < current ? "step--done" : ""} ${i === current ? "step--active" : ""}`}>
          <div className="step-dot">
            {i < current ? "✓" : i + 1}
          </div>
          <span className="step-label">{label}</span>
          {i < steps.length - 1 && <div className={`step-line ${i < current ? "step-line--done" : ""}`} />}
        </div>
      ))}
      <style jsx>{`
        .step-indicator { display: flex; align-items: center; gap: 0; margin-bottom: 40px; }
        .step { display: flex; align-items: center; gap: 10px; flex: 1; }
        .step:last-child { flex: 0; }
        .step-dot {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          background: #E8E5DE; color: #9B9B9B;
          transition: all 0.3s ease;
        }
        .step--active .step-dot { background: #1A1A1A; color: white; box-shadow: 0 0 0 4px rgba(26,26,26,0.12); }
        .step--done .step-dot { background: #A8D8D0; color: #1A1A1A; }
        .step-label { font-size: 13px; font-weight: 500; color: #9B9B9B; white-space: nowrap; }
        .step--active .step-label { color: #1A1A1A; font-weight: 600; }
        .step--done .step-label { color: #2A8A80; }
        .step-line { flex: 1; height: 2px; background: #E8E5DE; margin: 0 8px; transition: background 0.3s ease; }
        .step-line--done { background: #A8D8D0; }
        @media (max-width: 640px) { .step-label { display: none; } .step-indicator { gap: 4px; } }
      `}</style>
    </div>
  );
}

// ---- Step1: リスナー選択 ----
function Step1Listeners({ listeners, selected, onToggle, onNext }: {
  listeners: Listener[]; selected: Set<number>;
  onToggle: (id: number) => void; onNext: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = listeners.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">配布対象のリスナーを選択</h2>
        <p className="step-desc">複数選択できます。同じ連絡手段のリスナーはまとめて送信できます。</p>
      </div>

      <div className="search-bar">
        <span className="search-icon">◎</span>
        <input className="search-input" placeholder="リスナーを検索..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* 全選択 */}
      <div className="select-all-row">
        <button className="select-all-btn" onClick={() => filtered.forEach((l) => { if (!selected.has(l.id)) onToggle(l.id); })}>
          すべて選択
        </button>
        <button className="select-all-btn" onClick={() => filtered.forEach((l) => { if (selected.has(l.id)) onToggle(l.id); })}>
          すべて解除
        </button>
        <span className="select-count">{selected.size} 名選択中</span>
      </div>

      <div className="listener-list">
        {filtered.map((l) => {
          const isSelected = selected.has(l.id);
          return (
            <div key={l.id} className={`listener-row ${isSelected ? "listener-row--selected" : ""}`} onClick={() => onToggle(l.id)}>
              <div className={`checkbox ${isSelected ? "checkbox--checked" : ""}`}>
                {isSelected && "✓"}
              </div>
              <div className="listener-avatar">{l.name.charAt(0).toUpperCase()}</div>
              <div className="listener-info">
                <div className="listener-name">{l.name}</div>
                <div className="listener-platforms">
                  {l.contact_links.length > 0
                    ? l.contact_links.map((cl) => (
                        <span key={cl.platform} className="platform-tag" style={{ color: PLATFORM_COLORS[cl.platform], background: `${PLATFORM_COLORS[cl.platform]}15` }}>
                          {PLATFORM_LABELS[cl.platform]}
                        </span>
                      ))
                    : <span className="no-contact">連絡先なし</span>
                  }
                </div>
              </div>
              {Number(l.pending_count) > 0 && (
                <span className="pending-badge">未配布 {l.pending_count}</span>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p className="no-result">リスナーが見つかりません</p>}
      </div>

      <div className="step-footer">
        <div />
        <button className="btn-next" disabled={selected.size === 0} onClick={onNext}>
          パッケージを選択 →
        </button>
      </div>

      <style jsx>{`
        .step-header { margin-bottom: 24px; }
        .step-title { font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 6px; letter-spacing: -0.4px; }
        .step-desc { font-size: 14px; color: #9B9B9B; margin: 0; }
        .search-bar { display: flex; align-items: center; gap: 10px; background: #F7F5F0; border-radius: 12px; padding: 10px 14px; margin-bottom: 12px; border: 1.5px solid transparent; transition: border-color 0.2s; }
        .search-bar:focus-within { border-color: #A8D8D0; background: white; }
        .search-icon { font-size: 15px; color: #B0B0B0; }
        .search-input { flex: 1; background: transparent; border: none; outline: none; font-size: 14px; color: #1A1A1A; }
        .search-input::placeholder { color: #C0C0C0; }
        .select-all-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .select-all-btn { padding: 6px 14px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 12px; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; }
        .select-all-btn:hover { background: #F0EDE6; color: #1A1A1A; }
        .select-count { font-size: 13px; font-weight: 600; color: #2A8A80; margin-left: auto; }
        .listener-list { display: flex; flex-direction: column; gap: 6px; max-height: 380px; overflow-y: auto; padding-right: 4px; }
        .listener-row {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 14px; border-radius: 12px;
          border: 1.5px solid rgba(0,0,0,0.06);
          cursor: pointer; transition: all 0.15s ease; background: white;
        }
        .listener-row:hover { border-color: #A8D8D0; background: #FAFAF8; }
        .listener-row--selected { border-color: #A8D8D0; background: rgba(168,216,208,0.08); }
        .checkbox {
          width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
          border: 2px solid rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: white;
          transition: all 0.15s ease;
        }
        .checkbox--checked { background: #1A1A1A; border-color: #1A1A1A; }
        .listener-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #A8D8D0, #F5C5A3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #1A1A1A; flex-shrink: 0; }
        .listener-info { flex: 1; min-width: 0; }
        .listener-name { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 3px; }
        .listener-platforms { display: flex; gap: 5px; flex-wrap: wrap; }
        .platform-tag { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; }
        .no-contact { font-size: 12px; color: #C0C0C0; }
        .pending-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; background: rgba(245,197,163,0.25); color: #C07040; flex-shrink: 0; }
        .no-result { text-align: center; color: #9B9B9B; font-size: 14px; padding: 32px 0; }
        .step-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06); }
        .btn-next { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-next:hover:not(:disabled) { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ---- Step2: パッケージ選択 ----
function Step2Package({ packages, selected, onSelect, onNext, onBack }: {
  packages: Package[]; selected: number | null;
  onSelect: (id: number) => void; onNext: () => void; onBack: () => void;
}) {
  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">配布するパッケージを選択</h2>
        <p className="step-desc">1つのパッケージを選んでください。</p>
      </div>

      <div className="pkg-grid">
        {packages.map((pkg) => (
          <div key={pkg.id} className={`pkg-card ${selected === pkg.id ? "pkg-card--selected" : ""}`} onClick={() => onSelect(pkg.id)}>
            <div className="pkg-check">{selected === pkg.id ? "✓" : ""}</div>
            <div className="pkg-icon">{pkg.name.charAt(0)}</div>
            <div className="pkg-name">{pkg.name}</div>
            <div className="pkg-cat">{pkg.category}</div>
          </div>
        ))}
        {packages.length === 0 && (
          <p className="no-pkg">パッケージが登録されていません。先にパッケージを作成してください。</p>
        )}
      </div>

      <div className="step-footer">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <button className="btn-next" disabled={selected === null} onClick={onNext}>テンプレートを選択 →</button>
      </div>

      <style jsx>{`
        .step-header { margin-bottom: 24px; }
        .step-title { font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 6px; letter-spacing: -0.4px; }
        .step-desc { font-size: 14px; color: #9B9B9B; margin: 0; }
        .pkg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; margin-bottom: 8px; }
        .pkg-card {
          position: relative; padding: 20px 16px; border-radius: 16px;
          border: 2px solid rgba(0,0,0,0.07); background: white;
          cursor: pointer; transition: all 0.2s ease; text-align: center;
        }
        .pkg-card:hover { border-color: #A8D8D0; box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
        .pkg-card--selected { border-color: #1A1A1A; background: rgba(26,26,26,0.03); box-shadow: 0 0 0 3px rgba(26,26,26,0.08); }
        .pkg-check { position: absolute; top: 12px; right: 12px; width: 20px; height: 20px; border-radius: 50%; background: #1A1A1A; color: white; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; }
        .pkg-card--selected .pkg-check { opacity: 1; }
        .pkg-icon { width: 48px; height: 48px; border-radius: 14px; background: #EDEAE3; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 700; margin: 0 auto 12px; }
        .pkg-name { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; line-height: 1.3; }
        .pkg-cat { font-size: 11px; color: #9B9B9B; background: #F0EDE6; padding: 2px 8px; border-radius: 999px; display: inline-block; }
        .no-pkg { color: #9B9B9B; font-size: 14px; padding: 32px 0; grid-column: 1/-1; text-align: center; }
        .step-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06); }
        .btn-back { padding: 12px 24px; background: transparent; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-back:hover { background: #F0EDE6; color: #1A1A1A; }
        .btn-next { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-next:hover:not(:disabled) { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ---- Step3: テンプレート選択 & プレビュー ----
function Step3Template({ templates, selectedTemplate, onSelectTemplate, listeners, selectedListeners, pkg, onNext, onBack }: {
  templates: Template[]; selectedTemplate: number | null;
  onSelectTemplate: (id: number) => void;
  listeners: Listener[]; selectedListeners: Set<number>;
  pkg: Package | null; onNext: () => void; onBack: () => void;
}) {
  const template = templates.find((t) => t.id === selectedTemplate);
  const firstListener = listeners.find((l) => selectedListeners.has(l.id));

  const previewBody = template && pkg && firstListener
    ? expandTemplate(template.body, getTemplateVars(firstListener.name, pkg))
    : "";
  const previewSubject = template && pkg && firstListener
    ? expandTemplate(template.subject, getTemplateVars(firstListener.name, pkg))
    : "";

  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">テンプレートを選択</h2>
        <p className="step-desc">送信するメッセージのテンプレートを選んでください。</p>
      </div>

      <div className="template-list">
        {templates.map((t) => (
          <div key={t.id} className={`template-row ${selectedTemplate === t.id ? "template-row--selected" : ""}`} onClick={() => onSelectTemplate(t.id)}>
            <div className={`radio ${selectedTemplate === t.id ? "radio--checked" : ""}`} />
            <div className="template-info">
              <div className="template-name">{t.name} {t.is_default && <span className="default-badge">デフォルト</span>}</div>
              <div className="template-subject">件名: {t.subject}</div>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="no-template">テンプレートが登録されていません。</p>}
      </div>

      {/* プレビュー */}
      {template && pkg && firstListener && (
        <div className="preview-card">
          <div className="preview-label">📄 メッセージプレビュー（{firstListener.name} さんの場合）</div>
          <div className="preview-subject">件名: {previewSubject}</div>
          <div className="preview-body">{previewBody}</div>
        </div>
      )}

      <div className="step-footer">
        <button className="btn-back" onClick={onBack}>← 戻る</button>
        <button className="btn-next" disabled={selectedTemplate === null} onClick={onNext}>送信フローへ →</button>
      </div>

      <style jsx>{`
        .step-header { margin-bottom: 24px; }
        .step-title { font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 6px; letter-spacing: -0.4px; }
        .step-desc { font-size: 14px; color: #9B9B9B; margin: 0; }
        .template-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .template-row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.07); background: white; cursor: pointer; transition: all 0.15s ease; }
        .template-row:hover { border-color: #A8D8D0; }
        .template-row--selected { border-color: #1A1A1A; background: rgba(26,26,26,0.02); }
        .radio { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(0,0,0,0.2); flex-shrink: 0; transition: all 0.15s ease; position: relative; }
        .radio--checked { border-color: #1A1A1A; background: #1A1A1A; box-shadow: inset 0 0 0 4px white; }
        .template-info { flex: 1; min-width: 0; }
        .template-name { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; }
        .default-badge { font-size: 10px; background: rgba(168,216,208,0.3); color: #2A8A80; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
        .template-subject { font-size: 12px; color: #9B9B9B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .no-template { color: #9B9B9B; font-size: 14px; padding: 24px 0; text-align: center; }
        .preview-card { background: #F7F5F0; border-radius: 14px; padding: 18px; margin-bottom: 8px; border: 1px solid rgba(0,0,0,0.06); }
        .preview-label { font-size: 12px; font-weight: 600; color: #9B9B9B; margin-bottom: 10px; letter-spacing: 0.03em; }
        .preview-subject { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .preview-body { font-size: 13px; color: #3A3A3A; line-height: 1.7; white-space: pre-wrap; }
        .step-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06); }
        .btn-back { padding: 12px 24px; background: transparent; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-back:hover { background: #F0EDE6; color: #1A1A1A; }
        .btn-next { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-next:hover:not(:disabled) { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .btn-next:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}

// ---- Step4: 送信フロー ----
function Step4Send({ listeners, selectedListeners, pkg, template, distributionIds, onStatusChange, onBack, onFinish }: {
  listeners: Listener[]; selectedListeners: Set<number>;
  pkg: Package | null; template: Template | null;
  distributionIds: Record<number, number>; // listenerId -> distributionId
  onStatusChange: (listenerId: number, status: "sent" | "pending") => void;
  onBack: () => void; onFinish: () => void;
}) {
  const [sentSet, setSentSet] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState<number | null>(null);
  const [sendMode, setSendMode] = useState<"individual" | "bulk">("individual");

  const targetListeners = listeners.filter((l) => selectedListeners.has(l.id));

  // プラットフォーム別グルーピング
  const platformGroups: Record<string, Listener[]> = {};
  targetListeners.forEach((l) => {
    l.contact_links.forEach((cl) => {
      if (!platformGroups[cl.platform]) platformGroups[cl.platform] = [];
      platformGroups[cl.platform].push(l);
    });
  });
  const hasBulkOption = Object.values(platformGroups).some((g) => g.length > 1);

  const buildMessage = (listener: Listener) => {
    if (!template || !pkg) return "";
    const vars = getTemplateVars(listener.name, pkg);
    return expandTemplate(template.body, vars);
  };

  const copyMessage = async (listener: Listener) => {
    const msg = buildMessage(listener);
    await navigator.clipboard.writeText(msg);
    setCopied(listener.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const markSent = async (listenerId: number) => {
    const distId = distributionIds[listenerId];
    if (!distId) return;
    await fetch(`/api/distribute/${distId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "sent" }),
    });
    setSentSet((s) => new Set([...s, listenerId]));
    onStatusChange(listenerId, "sent");
  };

  const markAllSent = async () => {
    for (const l of targetListeners) {
      if (!sentSet.has(l.id)) await markSent(l.id);
    }
  };

  const allSent = targetListeners.every((l) => sentSet.has(l.id));

  return (
    <div className="step-content">
      <div className="step-header">
        <h2 className="step-title">送信</h2>
        <p className="step-desc">{targetListeners.length} 名にメッセージを送信します。</p>
      </div>

      {/* 送信モード切り替え */}
      {hasBulkOption && (
        <div className="mode-toggle">
          <button className={`mode-btn ${sendMode === "individual" ? "mode-btn--active" : ""}`} onClick={() => setSendMode("individual")}>個別送信</button>
          <button className={`mode-btn ${sendMode === "bulk" ? "mode-btn--active" : ""}`} onClick={() => setSendMode("bulk")}>プラットフォーム別一括</button>
        </div>
      )}

      {sendMode === "individual" ? (
        /* 個別送信リスト */
        <div className="send-list">
          {targetListeners.map((l) => {
            const isSent = sentSet.has(l.id);
            const isCopied = copied === l.id;
            return (
              <div key={l.id} className={`send-row ${isSent ? "send-row--sent" : ""}`}>
                <div className="send-listener">
                  <div className="send-avatar">{l.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className="send-name">{l.name}</div>
                    <div className="send-platforms">
                      {l.contact_links.map((cl) => (
                        <a key={cl.platform} href={cl.deep_link} target="_blank" rel="noopener noreferrer"
                          className="platform-link" style={{ color: PLATFORM_COLORS[cl.platform], background: `${PLATFORM_COLORS[cl.platform]}15` }}
                          onClick={() => copyMessage(l)}>
                          {PLATFORM_LABELS[cl.platform]} で開く
                        </a>
                      ))}
                      {l.contact_links.length === 0 && <span className="no-link">連絡先なし</span>}
                    </div>
                  </div>
                </div>
                <div className="send-actions">
                  <button className={`copy-btn ${isCopied ? "copy-btn--copied" : ""}`} onClick={() => copyMessage(l)}>
                    {isCopied ? "✓ コピー済" : "メッセージをコピー"}
                  </button>
                  <button className={`sent-btn ${isSent ? "sent-btn--done" : ""}`} onClick={() => !isSent && markSent(l.id)}>
                    {isSent ? "✓ 配布済み" : "配布済みにする"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* プラットフォーム別グループ */
        <div className="bulk-groups">
          {Object.entries(platformGroups).map(([platform, group]) => (
            <div key={platform} className="bulk-group">
              <div className="bulk-group-header" style={{ color: PLATFORM_COLORS[platform] }}>
                <span className="bulk-platform">{PLATFORM_LABELS[platform]}</span>
                <span className="bulk-count">{group.length} 名</span>
              </div>
              <div className="bulk-listeners">
                {group.map((l) => <span key={l.id} className="bulk-name">{l.name}</span>)}
              </div>
              <div className="bulk-actions">
                <button className="copy-btn" onClick={async () => {
                  const msg = buildMessage(group[0]);
                  await navigator.clipboard.writeText(msg);
                  setCopied(group[0].id);
                  setTimeout(() => setCopied(null), 2000);
                }}>
                  {copied === group[0].id ? "✓ コピー済" : "メッセージをコピー"}
                </button>
                {group[0].contact_links.find((cl) => cl.platform === platform) && (
                  <a href={group[0].contact_links.find((cl) => cl.platform === platform)!.deep_link}
                    target="_blank" rel="noopener noreferrer" className="open-link-btn" style={{ color: PLATFORM_COLORS[platform] }}>
                    {PLATFORM_LABELS[platform]} で開く
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* まとめて配布済み */}
      {!allSent && (
        <button className="mark-all-btn" onClick={markAllSent}>
          全員を配布済みにする
        </button>
      )}

      <div className="step-footer">
        <button className="btn-back" onClick={onBack} disabled={allSent}>← 戻る</button>
        <button className="btn-finish" onClick={onFinish}>
          {allSent ? "✓ 完了" : "スキップして完了"}
        </button>
      </div>

      <style jsx>{`
        .step-header { margin-bottom: 24px; }
        .step-title { font-size: 20px; font-weight: 700; color: #1A1A1A; margin: 0 0 6px; letter-spacing: -0.4px; }
        .step-desc { font-size: 14px; color: #9B9B9B; margin: 0; }
        .mode-toggle { display: flex; gap: 6px; margin-bottom: 20px; background: #F0EDE6; border-radius: 999px; padding: 4px; width: fit-content; }
        .mode-btn { padding: 8px 18px; border-radius: 999px; border: none; font-size: 13px; font-weight: 500; color: #6B6B6B; background: transparent; cursor: pointer; transition: all 0.2s ease; }
        .mode-btn--active { background: white; color: #1A1A1A; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .send-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .send-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border-radius: 14px; border: 1.5px solid rgba(0,0,0,0.07); background: white; transition: all 0.2s ease; flex-wrap: wrap; }
        .send-row--sent { opacity: 0.5; background: #F7F5F0; }
        .send-listener { display: flex; align-items: center; gap: 12px; }
        .send-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #A8D8D0, #F5C5A3); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #1A1A1A; flex-shrink: 0; }
        .send-name { font-size: 14px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
        .send-platforms { display: flex; gap: 6px; flex-wrap: wrap; }
        .platform-link { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; text-decoration: none; transition: opacity 0.15s; }
        .platform-link:hover { opacity: 0.75; }
        .no-link { font-size: 12px; color: #C0C0C0; }
        .send-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .copy-btn { padding: 8px 14px; background: #F0EDE6; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 999px; font-size: 12px; font-weight: 600; color: #3A3A3A; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
        .copy-btn:hover { background: #E8E5DE; }
        .copy-btn--copied { background: rgba(168,216,208,0.2); border-color: #A8D8D0; color: #2A8A80; }
        .sent-btn { padding: 8px 14px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 12px; font-weight: 600; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; }
        .sent-btn:hover:not(.sent-btn--done) { border-color: #A8D8D0; color: #2A8A80; }
        .sent-btn--done { background: rgba(168,216,208,0.2); border-color: #A8D8D0; color: #2A8A80; cursor: default; }
        /* バルクグループ */
        .bulk-groups { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
        .bulk-group { background: white; border-radius: 14px; padding: 16px; border: 1.5px solid rgba(0,0,0,0.07); }
        .bulk-group-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .bulk-platform { font-size: 14px; font-weight: 700; }
        .bulk-count { font-size: 12px; background: rgba(0,0,0,0.06); color: #6B6B6B; padding: 2px 8px; border-radius: 999px; }
        .bulk-listeners { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .bulk-name { font-size: 12px; background: #F0EDE6; color: #3A3A3A; padding: 3px 10px; border-radius: 999px; }
        .bulk-actions { display: flex; gap: 8px; }
        .open-link-btn { padding: 8px 14px; background: transparent; border-radius: 999px; font-size: 12px; font-weight: 600; text-decoration: none; border: 1.5px solid currentColor; transition: opacity 0.15s; white-space: nowrap; }
        .open-link-btn:hover { opacity: 0.7; }
        /* まとめて */
        .mark-all-btn { width: 100%; padding: 12px; background: transparent; border: 1.5px dashed rgba(0,0,0,0.15); border-radius: 12px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; margin-bottom: 8px; }
        .mark-all-btn:hover { border-color: #A8D8D0; color: #2A8A80; background: rgba(168,216,208,0.06); }
        .step-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.06); }
        .btn-back { padding: 12px 24px; background: transparent; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-back:hover:not(:disabled) { background: #F0EDE6; color: #1A1A1A; }
        .btn-back:disabled { opacity: 0.3; cursor: not-allowed; }
        .btn-finish { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-finish:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
      `}</style>
    </div>
  );
}

// ---- メインページ ----
const STEPS = ["リスナー選択", "パッケージ", "テンプレート", "送信"];

export default function DistributePage() {
  const [step, setStep] = useState(0);
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedListeners, setSelectedListeners] = useState<Set<number>>(new Set());
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [distributionIds, setDistributionIds] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    Promise.all([
      fetch("/api/listeners").then((r) => r.json()),
      fetch("/api/packages").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([ls, ps, ts]) => {
      setListeners(ls);
      setPackages(ps);
      setTemplates(ts);
      // デフォルトテンプレートを自動選択
      const def = ts.find((t: Template) => t.is_default);
      if (def) setSelectedTemplate(def.id);
      setLoading(false);
    });
    return () => clearTimeout(t);
  }, []);

  const toggleListener = (id: number) => {
    setSelectedListeners((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Step3→4: 配布レコード作成
  const handleGoToSend = async () => {
    const res = await fetch("/api/distribute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listenerIds: Array.from(selectedListeners),
        packageId: selectedPackage,
        templateId: selectedTemplate,
      }),
    });
    const data = await res.json();
    // distributionIds を listenerId → distId にマッピング
    if (data.created) {
      const listenerArr = Array.from(selectedListeners);
      const map: Record<number, number> = {};
      data.created.forEach((distId: number, i: number) => {
        map[listenerArr[i]] = distId;
      });
      setDistributionIds(map);
    }
    setStep(3);
  };

  const pkg = packages.find((p) => p.id === selectedPackage) ?? null;
  const template = templates.find((t) => t.id === selectedTemplate) ?? null;

  if (loading) {
    return (
      <AppLayout>
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>読み込み中...</p>
        </div>
        <style jsx>{`
          .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 16px; color: #9B9B9B; }
          .loading-spinner { width: 32px; height: 32px; border: 3px solid #E8E5DE; border-top-color: #1A1A1A; border-radius: 50%; animation: spin 0.8s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </AppLayout>
    );
  }

  if (finished) {
    return (
      <AppLayout>
        <div className="finish-state">
          <div className="finish-icon">✓</div>
          <h2 className="finish-title">配布が完了しました！</h2>
          <p className="finish-desc">配布履歴から状況を確認できます。</p>
          <div className="finish-actions">
            <button className="finish-btn-history" onClick={() => window.location.href = "/history"}>履歴を見る</button>
            <button className="finish-btn-again" onClick={() => { setStep(0); setSelectedListeners(new Set()); setSelectedPackage(null); setSelectedTemplate(templates.find((t) => t.is_default)?.id ?? null); setDistributionIds({}); setFinished(false); }}>もう一度配布する</button>
          </div>
        </div>
        <style jsx>{`
          .finish-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 16px; }
          .finish-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(168,216,208,0.25); display: flex; align-items: center; justify-content: center; font-size: 32px; color: #2A8A80; animation: popIn 0.4s cubic-bezier(0.16,1,0.3,1) both; }
          @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          .finish-title { font-size: 24px; font-weight: 700; color: #1A1A1A; margin: 0; letter-spacing: -0.5px; }
          .finish-desc { font-size: 14px; color: #9B9B9B; margin: 0; }
          .finish-actions { display: flex; gap: 12px; margin-top: 8px; }
          .finish-btn-history { padding: 12px 24px; background: transparent; border: 1.5px solid rgba(0,0,0,0.15); border-radius: 999px; font-size: 14px; font-weight: 600; color: #3A3A3A; cursor: pointer; transition: all 0.2s ease; }
          .finish-btn-history:hover { background: #F0EDE6; }
          .finish-btn-again { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
          .finish-btn-again:hover { background: #2A2A2A; transform: translateY(-1px); }
        `}</style>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="distribute-page">
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">特典を配布する</h1>
            <p className="page-subtitle">4ステップで特典を送信します</p>
          </div>
        </div>

        <div className="wizard-card">
          <StepIndicator current={step} steps={STEPS} />

          {step === 0 && (
            <Step1Listeners listeners={listeners} selected={selectedListeners} onToggle={toggleListener} onNext={() => setStep(1)} />
          )}
          {step === 1 && (
            <Step2Package packages={packages} selected={selectedPackage} onSelect={setSelectedPackage} onNext={() => setStep(2)} onBack={() => setStep(0)} />
          )}
          {step === 2 && (
            <Step3Template
              templates={templates} selectedTemplate={selectedTemplate} onSelectTemplate={setSelectedTemplate}
              listeners={listeners} selectedListeners={selectedListeners}
              pkg={pkg} onNext={handleGoToSend} onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step4Send
              listeners={listeners} selectedListeners={selectedListeners}
              pkg={pkg} template={template}
              distributionIds={distributionIds}
              onStatusChange={() => {}}
              onBack={() => setStep(2)}
              onFinish={() => setFinished(true)}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .distribute-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }
        .wizard-card {
          background: white; border-radius: 24px;
          padding: 36px; box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.05);
          animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 640px) {
          .wizard-card { padding: 20px 16px; }
        }
      `}</style>
    </AppLayout>
  );
}
