"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

const VARIABLES = ["[yyyy]", "[m]", "[name]", "[category]", "[link_url]"];
const VARIABLE_DESC: Record<string, string> = {
  "[yyyy]": "年（自動）", "[m]": "月（自動）",
  "[name]": "リスナー名", "[category]": "特典カテゴリ", "[link_url]": "配布リンク",
};

interface Template { id: number; name: string; subject: string; body: string; is_default: boolean; created_at: string; }
interface FormState { name: string; subject: string; body: string; is_default: boolean; }
const emptyForm = (): FormState => ({ name: "", subject: "[yyyy]年[m]月 - 特典配布", body: "こんにちは [name] さん\n\n[category] の特典をお渡しします。以下のリンクをクリックしてダウンロードしてください。\n\n[link_url]", is_default: false });

// ---- プレビュー変数展開 ----
function previewExpand(text: string) {
  const now = new Date();
  return text
    .replace(/\[yyyy\]/g, String(now.getFullYear()))
    .replace(/\[m\]/g, String(now.getMonth() + 1))
    .replace(/\[name\]/g, "サンプルさん")
    .replace(/\[category\]/g, "サブスク特典")
    .replace(/\[link_url\]/g, "https://example.com/sample");
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
        .modal-box { background: white; border-radius: 24px; padding: 32px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.15); animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
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

// ---- テンプレートフォーム ----
function TemplateForm({ initial, onSubmit, onCancel, loading, error, isOnlyTemplate }: {
  initial: FormState; onSubmit: (d: FormState) => void;
  onCancel: () => void; loading: boolean; error: string; isOnlyTemplate: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  const insertVar = (v: string) => {
    setForm((f) => ({ ...f, body: f.body + v }));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="tmpl-form">
      {error && <div className="form-error">{error}</div>}

      {/* テンプレート名 */}
      <div className="field">
        <label className="field-label">テンプレート名 <span className="req">*</span></label>
        <input className="field-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="例: 標準テンプレート" autoFocus />
      </div>

      {/* 件名 */}
      <div className="field">
        <label className="field-label">件名 <span className="req">*</span></label>
        <input className="field-input" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} placeholder="[yyyy]年[m]月 - 特典配布" />
      </div>

      {/* 変数ピル */}
      <div className="vars-row">
        <span className="vars-label">変数を挿入:</span>
        {VARIABLES.map((v) => (
          <button key={v} type="button" className="var-pill" onClick={() => insertVar(v)} title={VARIABLE_DESC[v]}>
            {v}
          </button>
        ))}
      </div>

      {/* 本文 + プレビュー切り替え */}
      <div className="field">
        <div className="body-tabs">
          <button type="button" className={`body-tab ${tab === "edit" ? "body-tab--active" : ""}`} onClick={() => setTab("edit")}>編集</button>
          <button type="button" className={`body-tab ${tab === "preview" ? "body-tab--active" : ""}`} onClick={() => setTab("preview")}>プレビュー</button>
        </div>
        {tab === "edit" ? (
          <textarea
            className="field-textarea"
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            rows={8}
            placeholder="本文を入力..."
          />
        ) : (
          <div className="preview-box">
            <div className="preview-subject">件名: {previewExpand(form.subject)}</div>
            <div className="preview-body">{previewExpand(form.body)}</div>
          </div>
        )}
      </div>

      {/* デフォルト設定 */}
      <label className="default-toggle">
        <input type="checkbox" checked={form.is_default || isOnlyTemplate}
          disabled={isOnlyTemplate}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))} />
        <span className="toggle-label">デフォルトテンプレートに設定</span>
        {isOnlyTemplate && <span className="toggle-hint">（唯一のテンプレートは自動でデフォルトになります）</span>}
      </label>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn-submit" disabled={loading || !form.name.trim() || !form.subject.trim() || !form.body.trim()}>
          {loading ? "保存中..." : "保存"}
        </button>
      </div>

      <style jsx>{`
        .tmpl-form { display: flex; flex-direction: column; gap: 18px; }
        .form-error { background: rgba(217,64,64,0.08); border: 1px solid rgba(217,64,64,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #D94040; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 12px; font-weight: 600; color: #5A5A5A; letter-spacing: 0.05em; text-transform: uppercase; }
        .req { color: #D94040; }
        .field-input { padding: 12px 14px; background: #F7F5F0; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-size: 14px; color: #1A1A1A; outline: none; transition: all 0.2s ease; }
        .field-input:focus { background: white; border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .vars-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .vars-label { font-size: 12px; color: #9B9B9B; flex-shrink: 0; }
        .var-pill { padding: 4px 10px; background: #F0EDE6; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 999px; font-size: 12px; font-weight: 600; color: #3A3A3A; cursor: pointer; font-family: monospace; transition: all 0.15s ease; }
        .var-pill:hover { background: rgba(168,216,208,0.2); border-color: #A8D8D0; color: #2A8A80; }
        .body-tabs { display: flex; gap: 4px; background: #F0EDE6; border-radius: 999px; padding: 3px; width: fit-content; margin-bottom: 4px; }
        .body-tab { padding: 6px 16px; border-radius: 999px; border: none; font-size: 13px; font-weight: 500; color: #6B6B6B; background: transparent; cursor: pointer; transition: all 0.2s ease; }
        .body-tab--active { background: white; color: #1A1A1A; font-weight: 600; box-shadow: 0 1px 6px rgba(0,0,0,0.08); }
        .field-textarea { padding: 12px 14px; background: #F7F5F0; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-size: 14px; color: #1A1A1A; outline: none; resize: vertical; font-family: inherit; line-height: 1.6; transition: all 0.2s ease; }
        .field-textarea:focus { background: white; border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .preview-box { background: #F7F5F0; border-radius: 12px; padding: 16px; border: 1.5px solid rgba(0,0,0,0.06); min-height: 180px; }
        .preview-subject { font-size: 13px; font-weight: 600; color: #1A1A1A; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .preview-body { font-size: 13px; color: #3A3A3A; line-height: 1.7; white-space: pre-wrap; }
        .default-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .default-toggle input[type=checkbox] { width: 18px; height: 18px; accent-color: #1A1A1A; cursor: pointer; }
        .toggle-label { font-size: 14px; font-weight: 500; color: #1A1A1A; }
        .toggle-hint { font-size: 12px; color: #9B9B9B; }
        .form-actions { display: flex; gap: 10px; justify-content: flex-end; padding-top: 4px; }
        .btn-cancel { padding: 11px 22px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-cancel:hover { background: #F0EDE6; }
        .btn-submit { padding: 11px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-submit:hover:not(:disabled) { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
        .btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </form>
  );
}

// ---- テンプレートカード ----
function TemplateCard({ template, onEdit, onDelete, onSetDefault, delay }: {
  template: Template; onEdit: () => void; onDelete: () => void; onSetDefault: () => void; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`tmpl-card ${visible ? "tmpl-card--visible" : ""} ${template.is_default ? "tmpl-card--default" : ""}`}>
      <div className="card-top">
        <div className="card-left">
          <div className="tmpl-icon">✉</div>
          <div className="tmpl-meta">
            <div className="tmpl-name">
              {template.name}
              {template.is_default && <span className="default-chip">デフォルト</span>}
            </div>
            <div className="tmpl-subject">{template.subject}</div>
          </div>
        </div>
        <div className="card-right">
          <button className="expand-btn" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "▲" : "▼"}
          </button>
          <div className="menu-wrapper">
            <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)}>⋯</button>
            {menuOpen && (
              <div className="menu-dropdown">
                <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit(); }}>編集</button>
                {!template.is_default && (
                  <button className="menu-item" onClick={() => { setMenuOpen(false); onSetDefault(); }}>デフォルトに設定</button>
                )}
                {!template.is_default && (
                  <button className="menu-item menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>削除</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="card-body">
          <div className="body-preview">{previewExpand(template.body)}</div>
          <div className="body-note">※ サンプルデータでプレビュー表示しています</div>
        </div>
      )}

      <style jsx>{`
        .tmpl-card {
          background: white; border-radius: 18px;
          border: 1.5px solid rgba(0,0,0,0.06);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          opacity: 0; transform: translateY(12px);
          transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1),
                      transform 0.4s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.2s ease;
        }
        .tmpl-card--visible { opacity: 1; transform: translateY(0); }
        .tmpl-card--default { border-color: rgba(168,216,208,0.6); }
        .tmpl-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
        .card-top { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; gap: 12px; }
        .card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
        .tmpl-icon { width: 42px; height: 42px; border-radius: 12px; background: #EDEAE3; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .tmpl-meta { flex: 1; min-width: 0; }
        .tmpl-name { font-size: 15px; font-weight: 600; color: #1A1A1A; display: flex; align-items: center; gap: 8px; margin-bottom: 3px; }
        .default-chip { font-size: 10px; background: rgba(168,216,208,0.3); color: #2A8A80; padding: 2px 8px; border-radius: 999px; font-weight: 600; flex-shrink: 0; }
        .tmpl-subject { font-size: 13px; color: #9B9B9B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .card-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .expand-btn { width: 32px; height: 32px; background: #F0EDE6; border: none; border-radius: 8px; font-size: 10px; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; }
        .expand-btn:hover { background: #E8E5DE; color: #1A1A1A; }
        .menu-wrapper { position: relative; }
        .menu-btn { width: 32px; height: 32px; background: transparent; border: none; border-radius: 8px; font-size: 18px; color: #9B9B9B; cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center; }
        .menu-btn:hover { background: #F0EDE6; color: #1A1A1A; }
        .menu-dropdown { position: absolute; top: 36px; right: 0; background: white; border-radius: 12px; padding: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); border: 1px solid rgba(0,0,0,0.06); min-width: 160px; z-index: 50; animation: dropIn 0.2s cubic-bezier(0.16,1,0.3,1); }
        .menu-item { display: block; width: 100%; padding: 9px 14px; background: transparent; border: none; border-radius: 8px; font-size: 14px; color: #1A1A1A; text-align: left; cursor: pointer; transition: background 0.15s ease; white-space: nowrap; }
        .menu-item:hover { background: #F7F5F0; }
        .menu-item--danger { color: #D94040; }
        .menu-item--danger:hover { background: #FFF0F0; }
        @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .card-body { padding: 16px 20px 20px; border-top: 1px solid rgba(0,0,0,0.05); background: #FAFAF8; animation: expandIn 0.25s cubic-bezier(0.16,1,0.3,1); }
        @keyframes expandIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .body-preview { font-size: 13px; color: #3A3A3A; line-height: 1.7; white-space: pre-wrap; }
        .body-note { font-size: 11px; color: #B0B0B0; margin-top: 10px; }
      `}</style>
    </div>
  );
}

// ---- メインページ ----
export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Template | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    fetchTemplates();
    return () => clearTimeout(t);
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data);
    setLoading(false);
  };

  const handleAdd = async (form: FormState) => {
    setFormLoading(true); setError("");
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModalMode(null); fetchTemplates(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleEdit = async (form: FormState) => {
    if (!editTarget) return;
    setFormLoading(true); setError("");
    const res = await fetch(`/api/templates/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModalMode(null); setEditTarget(null); fetchTemplates(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/templates/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) { setDeleteTarget(null); fetchTemplates(); }
    else { const d = await res.json(); alert(d.error); }
  };

  const handleSetDefault = async (template: Template) => {
    await fetch(`/api/templates/${template.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...template, is_default: true }),
    });
    fetchTemplates();
  };

  return (
    <AppLayout>
      <div className="templates-page">
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">テンプレート管理</h1>
            <p className="page-subtitle">{templates.length} 件のテンプレートが登録されています</p>
          </div>
          <button className="add-btn" onClick={() => { setModalMode("add"); setError(""); }}>
            + テンプレートを作成
          </button>
        </div>

        {/* 変数説明 */}
        <div className={`vars-guide ${titleVisible ? "vars-guide--visible" : ""}`}>
          <div className="vars-guide-title">使用できる変数</div>
          <div className="vars-guide-list">
            {VARIABLES.map((v) => (
              <div key={v} className="var-item">
                <code className="var-code">{v}</code>
                <span className="var-desc">{VARIABLE_DESC[v]}</span>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="skeleton-list">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✉</div>
            <p className="empty-title">テンプレートがありません</p>
            <button className="empty-cta" onClick={() => { setModalMode("add"); setError(""); }}>
              最初のテンプレートを作成
            </button>
          </div>
        ) : (
          <div className="templates-list">
            {templates.map((t, i) => (
              <TemplateCard
                key={t.id} template={t} delay={i * 60}
                onEdit={() => { setEditTarget(t); setModalMode("edit"); setError(""); }}
                onDelete={() => setDeleteTarget(t)}
                onSetDefault={() => handleSetDefault(t)}
              />
            ))}
          </div>
        )}
      </div>

      {modalMode === "add" && (
        <Modal title="テンプレートを作成" onClose={() => setModalMode(null)}>
          <TemplateForm initial={{ ...emptyForm(), is_default: templates.length === 0 }} onSubmit={handleAdd} onCancel={() => setModalMode(null)} loading={formLoading} error={error} isOnlyTemplate={templates.length === 0} />
        </Modal>
      )}
      {modalMode === "edit" && editTarget && (
        <Modal title="テンプレートを編集" onClose={() => { setModalMode(null); setEditTarget(null); }}>
          <TemplateForm
            initial={{ name: editTarget.name, subject: editTarget.subject, body: editTarget.body, is_default: editTarget.is_default }}
            onSubmit={handleEdit} onCancel={() => { setModalMode(null); setEditTarget(null); }}
            loading={formLoading} error={error} isOnlyTemplate={templates.length === 1}
          />
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="テンプレートを削除" onClose={() => setDeleteTarget(null)}>
          <p className="delete-message"><strong>{deleteTarget.name}</strong> を削除しますか？</p>
          <div className="delete-actions">
            <button className="btn-cancel-del" onClick={() => setDeleteTarget(null)}>キャンセル</button>
            <button className="btn-delete" onClick={handleDelete}>削除する</button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .templates-page { display: flex; flex-direction: column; gap: 24px; }
        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }
        .add-btn { padding: 12px 24px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .add-btn:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
        .vars-guide { background: white; border-radius: 16px; padding: 18px 20px; border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 2px 8px rgba(0,0,0,0.04); opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s; }
        .vars-guide--visible { opacity: 1; transform: translateY(0); }
        .vars-guide-title { font-size: 12px; font-weight: 600; color: #9B9B9B; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; }
        .vars-guide-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .var-item { display: flex; align-items: center; gap: 6px; }
        .var-code { font-size: 12px; font-weight: 600; background: #F0EDE6; color: #3A3A3A; padding: 3px 8px; border-radius: 6px; font-family: monospace; }
        .var-desc { font-size: 12px; color: #9B9B9B; }
        .skeleton-list { display: flex; flex-direction: column; gap: 10px; }
        .skeleton-card { height: 80px; background: linear-gradient(90deg, #f0ede6 25%, #e8e5de 50%, #f0ede6 75%); background-size: 200% 100%; border-radius: 18px; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .empty-state { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.2; }
        .empty-title { font-size: 15px; color: #9B9B9B; margin: 0 0 20px; }
        .empty-cta { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .empty-cta:hover { background: #2A2A2A; transform: translateY(-1px); }
        .templates-list { display: flex; flex-direction: column; gap: 10px; }
        .delete-message { font-size: 15px; color: #3A3A3A; margin: 0 0 24px; }
        .delete-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel-del { padding: 11px 22px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-cancel-del:hover { background: #F0EDE6; }
        .btn-delete { padding: 11px 24px; background: #D94040; color: white; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-delete:hover { background: #C03030; transform: translateY(-1px); }
        @media (max-width: 640px) { .page-header { flex-direction: column; align-items: flex-start; gap: 12px; } .vars-guide-list { flex-direction: column; gap: 6px; } }
      `}</style>
    </AppLayout>
  );
}
