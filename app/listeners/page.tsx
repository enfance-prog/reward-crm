"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

// ---- プラットフォーム定義 ----
const PLATFORMS = [
  {
    value: "x",
    label: "X (Twitter)",
    color: "#1A1A1A",
    prefix: "https://twitter.com/messages/compose?recipient_id=",
    inputLabel: "@ユーザー名",
    placeholder: "username（@なし）",
    hint: "@ユーザー名を入力して「IDを取得」を押すとDMリンクが自動生成されます。",
    inputPattern: undefined,
    hasLookup: true,
  },
  {
    value: "discord",
    label: "Discord",
    color: "#5865F2",
    prefix: "https://discord.com/users/",
    inputLabel: "ユーザーID（数値）",
    placeholder: "987654321012345678",
    hint: "Discord設定 › 詳細設定 › 開発者モードをONにしてユーザーを右クリック →「IDをコピー」",
    inputPattern: "[0-9]*",
    hasLookup: false,
  },
  {
    value: "twitch",
    label: "Twitch",
    color: "#9146FF",
    prefix: "https://www.twitch.tv/",
    inputLabel: "ユーザー名",
    placeholder: "username123（@なし）",
    hint: "TwitchのユーザーID（@なしのユーザー名）を入力してください。",
    inputPattern: undefined,
    hasLookup: false,
  },
] as const;

type PlatformValue = (typeof PLATFORMS)[number]["value"];

function getPlatform(value: string) {
  return PLATFORMS.find((p) => p.value === value) ?? PLATFORMS[0];
}

function buildDeepLink(platform: string, userId: string): string {
  const p = getPlatform(platform);
  return userId.trim() ? `${p.prefix}${userId.trim()}` : "";
}

function extractUserId(platform: string, deepLink: string): string {
  const p = getPlatform(platform);
  if (!deepLink) return "";
  if (deepLink.startsWith(p.prefix)) return deepLink.slice(p.prefix.length);
  return deepLink;
}

const PLATFORM_COLORS: Record<string, string> = { x: "#1A1A1A", discord: "#5865F2", twitch: "#9146FF" };
const PLATFORM_LABELS: Record<string, string> = { x: "X", discord: "Discord", twitch: "Twitch" };

interface ContactLink { id?: number; platform: string; deep_link: string; }
interface Listener {
  id: number; name: string; created_at: string;
  contact_links: ContactLink[];
  sent_count: string; pending_count: string;
}
interface FormLink { platform: PlatformValue; userId: string; }
interface FormState { name: string; contactLinks: FormLink[]; }

const emptyForm = (): FormState => ({
  name: "",
  contactLinks: [{ platform: "x", userId: "" }],
});

function toApiPayload(form: FormState) {
  return {
    name: form.name,
    contactLinks: form.contactLinks
      .filter((cl) => cl.userId.trim())
      .map((cl) => ({
        platform: cl.platform,
        deep_link: buildDeepLink(cl.platform, cl.userId),
      })),
  };
}

function fromApiContactLinks(contactLinks: ContactLink[]): FormLink[] {
  if (!contactLinks.length) return [{ platform: "x", userId: "" }];
  return contactLinks.map((cl) => ({
    platform: cl.platform as PlatformValue,
    userId: extractUserId(cl.platform, cl.deep_link),
  }));
}

// ---- モーダル ----
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
      <style jsx>{`
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; padding: 16px; }
        .modal-box { background: white; border-radius: 24px; padding: 32px; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.15); animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .modal-title { font-size: 18px; font-weight: 700; color: #1A1A1A; margin: 0; letter-spacing: -0.4px; }
        .modal-close { width: 32px; height: 32px; background: #EDEAE3; border: none; border-radius: 50%; font-size: 12px; cursor: pointer; color: #6B6B6B; transition: all 0.15s ease; }
        .modal-close:hover { background: #1A1A1A; color: white; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

// ---- 連絡先入力フィールド ----
function ContactLinkField({ link, onChange, onRemove, showRemove }: {
  link: FormLink;
  onChange: (field: "platform" | "userId", value: string) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const platform = getPlatform(link.platform);
  const previewUrl = buildDeepLink(link.platform, link.userId);

  // X IDルックアップ用ステート
  const [xUsername, setXUsername] = useState(""); // @ユーザー名入力欄
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lookupMsg, setLookupMsg] = useState(""); // 成功時の表示名、エラーメッセージ

  // プラットフォーム切り替え時にリセット
  const handlePlatformChange = (value: string) => {
    onChange("platform", value);
    setXUsername("");
    setLookupState("idle");
    setLookupMsg("");
  };

  const handleXLookup = async () => {
    const username = xUsername.replace(/^@/, "").trim();
    if (!username) return;
    setLookupState("loading");
    setLookupMsg("");
    try {
      const res = await fetch(`/api/x-lookup?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupState("error");
        setLookupMsg(data.error ?? "IDの取得に失敗しました");
        return;
      }
      onChange("userId", data.id); // 数値IDをセット
      setLookupState("success");
      setLookupMsg(`@${data.username}（${data.name}）のIDを取得しました`);
    } catch {
      setLookupState("error");
      setLookupMsg("通信エラーが発生しました");
    }
  };

  return (
    <div className="contact-field">
      {/* プラットフォームタブ */}
      <div className="platform-tabs">
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={`platform-tab ${link.platform === p.value ? "platform-tab--active" : ""}`}
            style={link.platform === p.value ? { background: `${p.color}12`, borderColor: `${p.color}60`, color: p.color } : {}}
            onClick={() => handlePlatformChange(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* X: ユーザー名入力 + IDを取得ボタン */}
      {link.platform === "x" && (
        <div className="x-lookup-section">
          <div className="x-input-row">
            <div className="x-at-prefix">@</div>
            <input
              className="x-username-input"
              value={xUsername}
              onChange={(e) => {
                setXUsername(e.target.value.replace(/^@/, ""));
                setLookupState("idle");
                setLookupMsg("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleXLookup(); } }}
              placeholder={platform.placeholder}
            />
            <button
              type="button"
              className={`lookup-btn ${lookupState === "loading" ? "lookup-btn--loading" : ""} ${lookupState === "success" ? "lookup-btn--success" : ""}`}
              onClick={handleXLookup}
              disabled={!xUsername.trim() || lookupState === "loading"}
            >
              {lookupState === "loading" ? (
                <span className="lookup-spinner" />
              ) : lookupState === "success" ? (
                "✓ 取得済み"
              ) : (
                "IDを取得"
              )}
            </button>
          </div>

          {/* 結果メッセージ */}
          {lookupState === "success" && (
            <div className="lookup-result lookup-result--success">
              ✓ {lookupMsg}
            </div>
          )}
          {lookupState === "error" && (
            <div className="lookup-result lookup-result--error">
              ✕ {lookupMsg}
            </div>
          )}
          {lookupState === "idle" && (
            <p className="id-hint">{platform.hint}</p>
          )}

          {/* 取得済みIDと生成URL */}
          {link.userId && (
            <div className="id-result">
              <div className="id-result-row">
                <span className="id-result-label">数値ID:</span>
                <code className="id-result-value">{link.userId}</code>
              </div>
              <div className="id-result-row">
                <span className="id-result-label">生成URL:</span>
                <span className="id-result-url">{previewUrl}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Discord / Twitch: 直接入力 */}
      {link.platform !== "x" && (
        <div className="direct-input-section">
          <div className="id-input-wrapper">
            <div className="id-prefix">{platform.prefix}</div>
            <input
              className="id-input"
              type="text"
              pattern={platform.inputPattern}
              value={link.userId}
              onChange={(e) => onChange("userId", e.target.value)}
              placeholder={platform.placeholder}
            />
          </div>
          <p className="id-hint">{platform.hint}</p>
          {previewUrl && (
            <div className="url-preview">
              <span className="url-preview-label">生成URL:</span>
              <span className="url-preview-value">{previewUrl}</span>
            </div>
          )}
        </div>
      )}

      {showRemove && (
        <button type="button" className="remove-btn" onClick={onRemove}>
          この連絡先を削除
        </button>
      )}

      <style jsx>{`
        .contact-field { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: #FAFAF8; border-radius: 14px; border: 1.5px solid rgba(0,0,0,0.06); }
        .platform-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .platform-tab { padding: 7px 14px; border-radius: 999px; border: 1.5px solid rgba(0,0,0,0.1); background: white; font-size: 13px; font-weight: 500; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; }
        .platform-tab:hover { border-color: rgba(0,0,0,0.2); color: #1A1A1A; }
        .platform-tab--active { font-weight: 600; }

        /* X ルックアップ */
        .x-lookup-section { display: flex; flex-direction: column; gap: 8px; }
        .x-input-row { display: flex; align-items: center; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; background: white; transition: border-color 0.2s; }
        .x-input-row:focus-within { border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .x-at-prefix { padding: 11px 10px 11px 14px; font-size: 15px; font-weight: 600; color: #9B9B9B; background: white; flex-shrink: 0; }
        .x-username-input { flex: 1; padding: 11px 8px; border: none; outline: none; font-size: 14px; color: #1A1A1A; background: transparent; min-width: 0; }
        .x-username-input::placeholder { color: #C0C0C0; }
        .lookup-btn { padding: 8px 16px; margin: 4px; background: #1A1A1A; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
        .lookup-btn:hover:not(:disabled) { background: #2A2A2A; }
        .lookup-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .lookup-btn--loading { background: #4A4A4A; }
        .lookup-btn--success { background: #2A8A80; }
        .lookup-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lookup-result { font-size: 13px; padding: 8px 12px; border-radius: 8px; font-weight: 500; }
        .lookup-result--success { background: rgba(168,216,208,0.15); color: #2A8A80; border: 1px solid rgba(168,216,208,0.4); }
        .lookup-result--error { background: rgba(217,64,64,0.08); color: #D94040; border: 1px solid rgba(217,64,64,0.2); }
        .id-result { background: rgba(168,216,208,0.08); border: 1px solid rgba(168,216,208,0.25); border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 5px; }
        .id-result-row { display: flex; gap: 8px; align-items: flex-start; }
        .id-result-label { font-size: 11px; font-weight: 600; color: #2A8A80; flex-shrink: 0; min-width: 60px; margin-top: 1px; }
        .id-result-value { font-size: 12px; font-family: monospace; color: #1A1A1A; background: white; padding: 2px 6px; border-radius: 4px; }
        .id-result-url { font-size: 11px; font-family: monospace; color: #6B9B98; word-break: break-all; }

        /* Discord / Twitch */
        .direct-input-section { display: flex; flex-direction: column; gap: 8px; }
        .id-input-wrapper { display: flex; align-items: stretch; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; background: white; transition: border-color 0.2s; }
        .id-input-wrapper:focus-within { border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .id-prefix { padding: 11px 10px; background: #F0EDE6; font-size: 11px; color: #9B9B9B; border-right: 1px solid rgba(0,0,0,0.08); display: flex; align-items: center; white-space: nowrap; max-width: 220px; overflow: hidden; text-overflow: ellipsis; font-family: monospace; flex-shrink: 0; }
        .id-input { flex: 1; padding: 11px 12px; border: none; outline: none; font-size: 14px; color: #1A1A1A; background: transparent; min-width: 0; }
        .id-input::placeholder { color: #C0C0C0; }

        .id-hint { font-size: 12px; color: #9B9B9B; margin: 0; line-height: 1.5; }
        .url-preview { display: flex; gap: 6px; align-items: flex-start; background: rgba(168,216,208,0.1); border: 1px solid rgba(168,216,208,0.3); border-radius: 8px; padding: 8px 10px; }
        .url-preview-label { font-size: 11px; font-weight: 600; color: #2A8A80; flex-shrink: 0; margin-top: 1px; }
        .url-preview-value { font-size: 11px; color: #2A8A80; font-family: monospace; word-break: break-all; }

        .remove-btn { align-self: flex-start; padding: 6px 14px; background: transparent; border: 1.5px solid rgba(217,64,64,0.2); border-radius: 999px; font-size: 12px; color: #D94040; cursor: pointer; transition: all 0.15s ease; }
        .remove-btn:hover { background: #FFF0F0; border-color: #D94040; }
      `}</style>
    </div>
  );
}

// ---- フォーム ----
function ListenerForm({ initial, onSubmit, onCancel, loading }: {
  initial: FormState; onSubmit: (data: FormState) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  const usedPlatforms = new Set(form.contactLinks.map((cl) => cl.platform));
  const availablePlatforms = PLATFORMS.filter((p) => !usedPlatforms.has(p.value));

  const updateLink = (i: number, field: "platform" | "userId", value: string) => {
    setForm((f) => {
      const links = [...f.contactLinks];
      if (field === "platform") {
        links[i] = { platform: value as PlatformValue, userId: "" };
      } else {
        links[i] = { ...links[i], [field]: value };
      }
      return { ...f, contactLinks: links };
    });
  };

  const addLink = () => {
    if (!availablePlatforms.length) return;
    setForm((f) => ({
      ...f,
      contactLinks: [...f.contactLinks, { platform: availablePlatforms[0].value, userId: "" }],
    }));
  };

  const removeLink = (i: number) => {
    setForm((f) => ({ ...f, contactLinks: f.contactLinks.filter((_, idx) => idx !== i) }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="listener-form">
      <div className="field">
        <label className="field-label">リスナー名 <span className="required">*</span></label>
        <input
          className="field-input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Twitchユーザー名など"
          autoFocus
        />
      </div>

      <div className="section">
        <div className="section-header">
          <span className="section-label">連絡先リンク</span>
          <span className="section-note">IDを入力するとDMリンクを自動生成します</span>
        </div>
        <div className="contact-list">
          {form.contactLinks.map((link, i) => (
            <ContactLinkField
              key={`${link.platform}-${i}`}
              link={link}
              onChange={(field, value) => updateLink(i, field, value)}
              onRemove={() => removeLink(i)}
              showRemove={form.contactLinks.length > 1}
            />
          ))}
        </div>
        {availablePlatforms.length > 0 && (
          <button type="button" className="add-link-btn" onClick={addLink}>
            + {availablePlatforms[0].label} の連絡先を追加
          </button>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn-submit" disabled={loading || !form.name.trim()}>
          {loading ? "保存中..." : "保存"}
        </button>
      </div>

      <style jsx>{`
        .listener-form { display: flex; flex-direction: column; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 12px; font-weight: 600; color: #5A5A5A; letter-spacing: 0.05em; text-transform: uppercase; }
        .required { color: #D94040; }
        .field-input { padding: 12px 14px; background: #F7F5F0; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-size: 14px; color: #1A1A1A; outline: none; transition: all 0.2s ease; }
        .field-input:focus { background: white; border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .section { display: flex; flex-direction: column; gap: 10px; }
        .section-header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
        .section-label { font-size: 12px; font-weight: 600; color: #5A5A5A; letter-spacing: 0.05em; text-transform: uppercase; }
        .section-note { font-size: 11px; color: #B0B0B0; }
        .contact-list { display: flex; flex-direction: column; gap: 10px; }
        .add-link-btn { align-self: flex-start; padding: 8px 16px; background: transparent; border: 1.5px dashed rgba(0,0,0,0.15); border-radius: 999px; font-size: 13px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .add-link-btn:hover { border-color: #A8D8D0; color: #2A8A80; background: rgba(168,216,208,0.06); }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .btn-cancel { padding: 11px 22px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-cancel:hover { background: #F0EDE6; }
        .btn-submit { padding: 11px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-submit:hover:not(:disabled) { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </form>
  );
}

// ---- リスナーカード ----
function ListenerCard({ listener, onEdit, onDelete, delay }: {
  listener: Listener; onEdit: () => void; onDelete: () => void; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const sent = Number(listener.sent_count);
  const pending = Number(listener.pending_count);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`listener-card ${visible ? "listener-card--visible" : ""}`}>
      <div className="card-main">
        <div className="listener-avatar">{listener.name.charAt(0).toUpperCase()}</div>
        <div className="listener-info">
          <div className="listener-name">{listener.name}</div>
          <div className="listener-meta">
            {listener.contact_links.length > 0
              ? listener.contact_links.map((cl) => (
                  <span key={cl.platform} className="platform-badge"
                    style={{ background: `${PLATFORM_COLORS[cl.platform]}15`, color: PLATFORM_COLORS[cl.platform] }}>
                    {PLATFORM_LABELS[cl.platform]}
                  </span>
                ))
              : <span className="no-link">連絡先未設定</span>}
          </div>
        </div>
        <div className="card-stats">
          {sent > 0 && <span className="stat-badge stat-sent">配布済 {sent}</span>}
          {pending > 0 && <span className="stat-badge stat-pending">未配布 {pending}</span>}
        </div>
        <div className="card-menu-wrapper">
          <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)}>⋯</button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit(); }}>編集</button>
              <button className="menu-item menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>削除</button>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .listener-card { background: white; border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 8px rgba(0,0,0,0.04); opacity: 0; transform: translateY(12px); transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1), transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease; }
        .listener-card--visible { opacity: 1; transform: translateY(0); }
        .listener-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
        .card-main { display: flex; align-items: center; gap: 14px; }
        .listener-avatar { width: 40px; height: 40px; flex-shrink: 0; background: linear-gradient(135deg, #A8D8D0, #F5C5A3); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #1A1A1A; }
        .listener-info { flex: 1; min-width: 0; }
        .listener-name { font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; }
        .listener-meta { display: flex; gap: 6px; flex-wrap: wrap; }
        .platform-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
        .no-link { font-size: 12px; color: #C0C0C0; }
        .card-stats { display: flex; gap: 6px; flex-shrink: 0; }
        .stat-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
        .stat-sent { background: rgba(168,216,208,0.25); color: #2A8A80; }
        .stat-pending { background: rgba(245,197,163,0.25); color: #C07040; }
        .card-menu-wrapper { position: relative; flex-shrink: 0; }
        .menu-btn { width: 32px; height: 32px; background: transparent; border: none; border-radius: 8px; font-size: 18px; color: #9B9B9B; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; }
        .menu-btn:hover { background: #F0EDE6; color: #1A1A1A; }
        .menu-dropdown { position: absolute; top: 36px; right: 0; background: white; border-radius: 12px; padding: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.06); min-width: 120px; z-index: 50; animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        .menu-item { display: block; width: 100%; padding: 9px 14px; background: transparent; border: none; border-radius: 8px; font-size: 14px; color: #1A1A1A; text-align: left; cursor: pointer; transition: background 0.15s ease; }
        .menu-item:hover { background: #F7F5F0; }
        .menu-item--danger { color: #D94040; }
        .menu-item--danger:hover { background: #FFF0F0; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}

// ---- メインページ ----
export default function ListenersPage() {
  const [listeners, setListeners] = useState<Listener[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Listener | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Listener | null>(null);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    fetchListeners();
    return () => clearTimeout(t);
  }, []);

  const fetchListeners = async () => {
    setLoading(true);
    const res = await fetch("/api/listeners");
    const data = await res.json();
    setListeners(data);
    setLoading(false);
  };

  const handleAdd = async (form: FormState) => {
    setFormLoading(true); setError("");
    const res = await fetch("/api/listeners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toApiPayload(form)),
    });
    if (res.ok) { setModalMode(null); fetchListeners(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleEdit = async (form: FormState) => {
    if (!editTarget) return;
    setFormLoading(true); setError("");
    const res = await fetch(`/api/listeners/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toApiPayload(form)),
    });
    if (res.ok) { setModalMode(null); setEditTarget(null); fetchListeners(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/listeners/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchListeners();
  };

  const filtered = listeners.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="listeners-page">
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">リスナー管理</h1>
            <p className="page-subtitle">{listeners.length} 名のリスナーが登録されています</p>
          </div>
          <button className="add-btn" onClick={() => { setModalMode("add"); setError(""); }}>
            + リスナーを追加
          </button>
        </div>

        <div className={`search-bar ${titleVisible ? "search-bar--visible" : ""}`}>
          <span className="search-icon">◎</span>
          <input className="search-input" placeholder="リスナーを検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}>✕</button>}
        </div>

        {loading ? (
          <div className="skeleton-list">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p className="empty-title">{searchQuery ? "該当するリスナーが見つかりません" : "まだリスナーがいません"}</p>
            {!searchQuery && <button className="empty-cta" onClick={() => { setModalMode("add"); setError(""); }}>最初のリスナーを追加</button>}
          </div>
        ) : (
          <div className="listeners-list">
            {filtered.map((listener, i) => (
              <ListenerCard key={listener.id} listener={listener} delay={i * 50}
                onEdit={() => { setEditTarget(listener); setModalMode("edit"); setError(""); }}
                onDelete={() => setDeleteTarget(listener)} />
            ))}
          </div>
        )}
      </div>

      {modalMode === "add" && (
        <Modal title="リスナーを追加" onClose={() => setModalMode(null)}>
          {error && <div className="modal-error">{error}</div>}
          <ListenerForm initial={emptyForm()} onSubmit={handleAdd} onCancel={() => setModalMode(null)} loading={formLoading} />
        </Modal>
      )}
      {modalMode === "edit" && editTarget && (
        <Modal title="リスナーを編集" onClose={() => { setModalMode(null); setEditTarget(null); }}>
          {error && <div className="modal-error">{error}</div>}
          <ListenerForm
            initial={{ name: editTarget.name, contactLinks: fromApiContactLinks(editTarget.contact_links) }}
            onSubmit={handleEdit} onCancel={() => { setModalMode(null); setEditTarget(null); }} loading={formLoading} />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="リスナーを削除" onClose={() => setDeleteTarget(null)}>
          <p className="delete-message"><strong>{deleteTarget.name}</strong> を削除しますか？<br /><span className="delete-warning">関連する配布履歴もすべて削除されます。</span></p>
          <div className="delete-actions">
            <button className="btn-cancel-del" onClick={() => setDeleteTarget(null)}>キャンセル</button>
            <button className="btn-delete" onClick={handleDelete}>削除する</button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .listeners-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }
        .add-btn { padding: 12px 24px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .add-btn:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
        .search-bar { display: flex; align-items: center; gap: 12px; background: white; border-radius: 14px; padding: 12px 16px; border: 1.5px solid rgba(0,0,0,0.06); box-shadow: 0 2px 8px rgba(0,0,0,0.04); opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s, border-color 0.2s ease; }
        .search-bar--visible { opacity: 1; transform: translateY(0); }
        .search-bar:focus-within { border-color: #A8D8D0; }
        .search-icon { font-size: 16px; color: #B0B0B0; }
        .search-input { flex: 1; background: transparent; border: none; outline: none; font-size: 14px; color: #1A1A1A; }
        .search-input::placeholder { color: #C0C0C0; }
        .search-clear { background: #EDEAE3; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 10px; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; }
        .search-clear:hover { background: #1A1A1A; color: white; }
        .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
        .skeleton-card { height: 76px; background: linear-gradient(90deg, #f0ede6 25%, #e8e5de 50%, #f0ede6 75%); background-size: 200% 100%; border-radius: 16px; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .empty-state { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.2; }
        .empty-title { font-size: 15px; color: #9B9B9B; margin: 0 0 20px; }
        .empty-cta { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .empty-cta:hover { background: #2A2A2A; transform: translateY(-1px); }
        .listeners-list { display: flex; flex-direction: column; gap: 10px; }
        :global(.modal-error) { background: rgba(217,64,64,0.08); border: 1px solid rgba(217,64,64,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #D94040; margin-bottom: 16px; }
        .delete-message { font-size: 15px; color: #3A3A3A; line-height: 1.6; margin: 0 0 24px; }
        .delete-warning { font-size: 13px; color: #9B9B9B; }
        .delete-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel-del { padding: 11px 22px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-cancel-del:hover { background: #F0EDE6; }
        .btn-delete { padding: 11px 24px; background: #D94040; color: white; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-delete:hover { background: #C03030; transform: translateY(-1px); }
        @media (max-width: 640px) { .page-header { flex-direction: column; align-items: flex-start; gap: 12px; } }
      `}</style>
    </AppLayout>
  );
}
