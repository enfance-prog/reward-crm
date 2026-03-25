"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";

// ---- ストレージサービスの判定 ----
const STORAGE_SERVICES = [
  { key: "dropbox",    label: "Dropbox",      color: "#0061FF", match: (u: string) => u.includes("dropbox.com") },
  { key: "gdrive",     label: "Google Drive", color: "#34A853", match: (u: string) => u.includes("drive.google.com") || u.includes("docs.google.com") },
  { key: "gigafile",   label: "ギガファイル便", color: "#E85D2C", match: (u: string) => u.includes("gigafile.nu") },
];

function detectService(url: string) {
  return STORAGE_SERVICES.find((s) => s.match(url)) ?? { key: "other", label: "その他", color: "#9B9B9B" };
}

// ---- カテゴリの候補 ----
const CATEGORY_SUGGESTIONS = ["サブスク特典", "ガチャ特典", "配信限定特典", "イベント特典", "プレゼント企画"];

interface Package {
  id: number;
  name: string;
  category: string;
  link_url: string;
  created_at: string;
  sent_count: string;
  pending_count: string;
}

interface FormState { name: string; category: string; link_url: string; }
const emptyForm = (): FormState => ({ name: "", category: "", link_url: "" });

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
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100; animation: fadeIn 0.2s ease; }
        .modal-box { background: white; border-radius: 24px; padding: 32px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.15); animation: slideUp 0.3s cubic-bezier(0.16,1,0.3,1); }
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

// ---- パッケージフォーム ----
function PackageForm({ initial, onSubmit, onCancel, loading, error }: {
  initial: FormState; onSubmit: (d: FormState) => void;
  onCancel: () => void; loading: boolean; error: string;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const service = form.link_url ? detectService(form.link_url) : null;

  const filteredSuggestions = CATEGORY_SUGGESTIONS.filter(
    (s) => s.includes(form.category) && s !== form.category
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="pkg-form">
      {error && <div className="form-error">{error}</div>}

      {/* パッケージ名 */}
      <div className="field">
        <label className="field-label">パッケージ名 <span className="req">*</span></label>
        <input
          className="field-input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="例: 2025年4月サブスク特典"
          autoFocus
        />
      </div>

      {/* カテゴリ */}
      <div className="field" style={{ position: "relative" }}>
        <label className="field-label">カテゴリ <span className="req">*</span></label>
        <input
          className="field-input"
          value={form.category}
          onChange={(e) => { setForm((f) => ({ ...f, category: e.target.value })); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="例: サブスク特典"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="suggestions">
            {filteredSuggestions.map((s) => (
              <button key={s} type="button" className="suggestion-item"
                onMouseDown={() => { setForm((f) => ({ ...f, category: s })); setShowSuggestions(false); }}>
                {s}
              </button>
            ))}
          </div>
        )}
        {/* 定型ピルボタン */}
        <div className="category-pills">
          {CATEGORY_SUGGESTIONS.map((s) => (
            <button key={s} type="button" className={`cat-pill ${form.category === s ? "cat-pill--active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, category: s }))}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* 配布リンク */}
      <div className="field">
        <label className="field-label">配布リンク <span className="req">*</span></label>
        <div className="link-input-wrapper">
          <input
            className="field-input"
            value={form.link_url}
            onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
            placeholder="https://www.dropbox.com/... または Google Drive, ギガファイル便"
          />
          {service && (
            <span className="service-badge" style={{ background: `${service.color}15`, color: service.color }}>
              {service.label}
            </span>
          )}
        </div>
        <p className="field-hint">Dropbox / Google Drive / ギガファイル便 のリンクを貼り付けてください</p>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>キャンセル</button>
        <button type="submit" className="btn-submit" disabled={loading || !form.name.trim() || !form.category.trim() || !form.link_url.trim()}>
          {loading ? "保存中..." : "保存"}
        </button>
      </div>

      <style jsx>{`
        .pkg-form { display: flex; flex-direction: column; gap: 20px; }
        .form-error { background: rgba(217,64,64,0.08); border: 1px solid rgba(217,64,64,0.2); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #D94040; }
        .field { display: flex; flex-direction: column; gap: 8px; }
        .field-label { font-size: 12px; font-weight: 600; color: #5A5A5A; letter-spacing: 0.05em; text-transform: uppercase; }
        .req { color: #D94040; }
        .field-input { padding: 12px 14px; background: #F7F5F0; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 12px; font-size: 14px; color: #1A1A1A; outline: none; transition: all 0.2s ease; width: 100%; box-sizing: border-box; }
        .field-input:focus { background: white; border-color: #A8D8D0; box-shadow: 0 0 0 3px rgba(168,216,208,0.2); }
        .field-hint { font-size: 12px; color: #B0B0B0; margin: 0; }
        .suggestions { position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 8px 24px rgba(0,0,0,0.1); z-index: 10; overflow: hidden; margin-top: 4px; }
        .suggestion-item { display: block; width: 100%; padding: 10px 14px; background: transparent; border: none; text-align: left; font-size: 14px; color: #1A1A1A; cursor: pointer; transition: background 0.15s ease; }
        .suggestion-item:hover { background: #F7F5F0; }
        .category-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .cat-pill { padding: 5px 12px; background: #F0EDE6; border: 1.5px solid transparent; border-radius: 999px; font-size: 12px; color: #6B6B6B; cursor: pointer; transition: all 0.15s ease; }
        .cat-pill:hover { border-color: #A8D8D0; color: #2A8A80; }
        .cat-pill--active { background: rgba(168,216,208,0.2); border-color: #A8D8D0; color: #2A8A80; font-weight: 600; }
        .link-input-wrapper { position: relative; }
        .link-input-wrapper .field-input { padding-right: 110px; }
        .service-badge { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; pointer-events: none; }
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

// ---- パッケージカード ----
function PackageCard({ pkg, onEdit, onDelete, delay }: {
  pkg: Package; onEdit: () => void; onDelete: () => void; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const service = detectService(pkg.link_url);
  const sent = Number(pkg.sent_count);
  const pending = Number(pkg.pending_count);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className={`pkg-card ${visible ? "pkg-card--visible" : ""}`}>
      {/* カテゴリバー */}
      <div className="category-bar" style={{ background: `${service.color}18` }}>
        <span className="category-text">{pkg.category}</span>
        <span className="service-tag" style={{ color: service.color }}>{service.label}</span>
      </div>

      <div className="card-body">
        <div className="card-main">
          <div className="pkg-icon" style={{ background: `${service.color}15`, color: service.color }}>
            {pkg.name.charAt(0)}
          </div>
          <div className="pkg-info">
            <div className="pkg-name">{pkg.name}</div>
            <a href={pkg.link_url} target="_blank" rel="noopener noreferrer" className="pkg-link">
              リンクを開く →
            </a>
          </div>
        </div>

        <div className="card-footer">
          <div className="pkg-stats">
            {sent > 0 && <span className="stat-chip stat-sent">配布済 {sent}</span>}
            {pending > 0 && <span className="stat-chip stat-pending">未配布 {pending}</span>}
            {sent === 0 && pending === 0 && <span className="stat-chip stat-none">未使用</span>}
          </div>
          <div className="card-actions">
            <div className="menu-wrapper">
              <button className="menu-btn" onClick={() => setMenuOpen((v) => !v)}>⋯</button>
              {menuOpen && (
                <div className="menu-dropdown">
                  <button className="menu-item" onClick={() => { setMenuOpen(false); onEdit(); }}>編集</button>
                  <button className="menu-item menu-item--danger" onClick={() => { setMenuOpen(false); onDelete(); }}>削除</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pkg-card {
          background: white; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          overflow: hidden;
          opacity: 0; transform: translateY(14px);
          transition: opacity 0.4s cubic-bezier(0.16,1,0.3,1),
                      transform 0.4s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.2s ease;
        }
        .pkg-card--visible { opacity: 1; transform: translateY(0); }
        .pkg-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.09); }
        .category-bar { display: flex; align-items: center; justify-content: space-between; padding: 8px 16px; }
        .category-text { font-size: 11px; font-weight: 700; color: #4A4A4A; letter-spacing: 0.04em; text-transform: uppercase; }
        .service-tag { font-size: 11px; font-weight: 600; }
        .card-body { padding: 16px; }
        .card-main { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 14px; }
        .pkg-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; flex-shrink: 0; }
        .pkg-info { flex: 1; min-width: 0; }
        .pkg-name { font-size: 15px; font-weight: 600; color: #1A1A1A; margin-bottom: 4px; line-height: 1.3; }
        .pkg-link { font-size: 12px; color: #9B9B9B; text-decoration: none; transition: color 0.15s ease; }
        .pkg-link:hover { color: #1A1A1A; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px; }
        .pkg-stats { display: flex; gap: 6px; }
        .stat-chip { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; }
        .stat-sent { background: rgba(168,216,208,0.25); color: #2A8A80; }
        .stat-pending { background: rgba(245,197,163,0.25); color: #C07040; }
        .stat-none { background: #F0EDE6; color: #B0B0B0; }
        .card-actions { display: flex; gap: 8px; align-items: center; }
        .menu-wrapper { position: relative; }
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
export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<Package | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTitleVisible(true), 50);
    fetchPackages();
    return () => clearTimeout(t);
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    const res = await fetch("/api/packages");
    const data = await res.json();
    setPackages(data);
    setLoading(false);
  };

  const handleAdd = async (form: FormState) => {
    setFormLoading(true); setError("");
    const res = await fetch("/api/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModalMode(null); fetchPackages(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleEdit = async (form: FormState) => {
    if (!editTarget) return;
    setFormLoading(true); setError("");
    const res = await fetch(`/api/packages/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setModalMode(null); setEditTarget(null); fetchPackages(); }
    else { const d = await res.json(); setError(d.error ?? "エラーが発生しました"); }
    setFormLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/packages/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    fetchPackages();
  };

  // カテゴリフィルター用の一覧
  const categories = ["all", ...Array.from(new Set(packages.map((p) => p.category)))];
  const filtered = filterCategory === "all" ? packages : packages.filter((p) => p.category === filterCategory);

  return (
    <AppLayout>
      <div className="packages-page">
        {/* ヘッダー */}
        <div className={`page-header ${titleVisible ? "page-header--visible" : ""}`}>
          <div>
            <h1 className="page-title">パッケージ管理</h1>
            <p className="page-subtitle">{packages.length} 件のパッケージが登録されています</p>
          </div>
          <button className="add-btn" onClick={() => { setModalMode("add"); setError(""); }}>
            + パッケージを作成
          </button>
        </div>

        {/* カテゴリフィルター */}
        {categories.length > 1 && (
          <div className={`filter-bar ${titleVisible ? "filter-bar--visible" : ""}`}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${filterCategory === cat ? "filter-pill--active" : ""}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === "all" ? "すべて" : cat}
                <span className="filter-count">
                  {cat === "all" ? packages.length : packages.filter((p) => p.category === cat).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* グリッド */}
        {loading ? (
          <div className="skeleton-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.07}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◻</div>
            <p className="empty-title">パッケージがまだありません</p>
            <button className="empty-cta" onClick={() => { setModalMode("add"); setError(""); }}>
              最初のパッケージを作成
            </button>
          </div>
        ) : (
          <div className="packages-grid">
            {filtered.map((pkg, i) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onEdit={() => { setEditTarget(pkg); setModalMode("edit"); setError(""); }}
                onDelete={() => setDeleteTarget(pkg)}
                delay={i * 60}
              />
            ))}
          </div>
        )}
      </div>

      {/* 追加モーダル */}
      {modalMode === "add" && (
        <Modal title="パッケージを作成" onClose={() => setModalMode(null)}>
          <PackageForm initial={emptyForm()} onSubmit={handleAdd} onCancel={() => setModalMode(null)} loading={formLoading} error={error} />
        </Modal>
      )}

      {/* 編集モーダル */}
      {modalMode === "edit" && editTarget && (
        <Modal title="パッケージを編集" onClose={() => { setModalMode(null); setEditTarget(null); }}>
          <PackageForm
            initial={{ name: editTarget.name, category: editTarget.category, link_url: editTarget.link_url }}
            onSubmit={handleEdit}
            onCancel={() => { setModalMode(null); setEditTarget(null); }}
            loading={formLoading}
            error={error}
          />
        </Modal>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <Modal title="パッケージを削除" onClose={() => setDeleteTarget(null)}>
          <p className="delete-message">
            <strong>{deleteTarget.name}</strong> を削除しますか？<br />
            <span className="delete-warning">このパッケージを使用した配布履歴もすべて削除されます。</span>
          </p>
          <div className="delete-actions">
            <button className="btn-cancel-del" onClick={() => setDeleteTarget(null)}>キャンセル</button>
            <button className="btn-delete" onClick={handleDelete}>削除する</button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .packages-page { display: flex; flex-direction: column; gap: 24px; }

        .page-header { display: flex; align-items: center; justify-content: space-between; opacity: 0; transform: translateY(12px); transition: opacity 0.5s ease, transform 0.5s ease; }
        .page-header--visible { opacity: 1; transform: translateY(0); }
        .page-title { font-size: 28px; font-weight: 700; color: #1A1A1A; letter-spacing: -0.8px; margin: 0 0 4px; }
        .page-subtitle { font-size: 14px; color: #9B9B9B; margin: 0; }
        .add-btn { padding: 12px 24px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .add-btn:hover { background: #2A2A2A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }

        .filter-bar { display: flex; gap: 8px; flex-wrap: wrap; opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s; }
        .filter-bar--visible { opacity: 1; transform: translateY(0); }
        .filter-pill { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: white; border: 1.5px solid rgba(0,0,0,0.07); border-radius: 999px; font-size: 13px; font-weight: 500; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
        .filter-pill:hover { border-color: #A8D8D0; color: #2A8A80; }
        .filter-pill--active { background: #1A1A1A; border-color: #1A1A1A; color: #EDEAE3; }
        .filter-pill--active:hover { background: #2A2A2A; color: #EDEAE3; }
        .filter-count { font-size: 11px; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 999px; }
        .filter-pill--active .filter-count { background: rgba(255,255,255,0.2); }
        .filter-pill:not(.filter-pill--active) .filter-count { background: #F0EDE6; color: #9B9B9B; }

        .packages-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .skeleton-card { height: 160px; background: linear-gradient(90deg, #f0ede6 25%, #e8e5de 50%, #f0ede6 75%); background-size: 200% 100%; border-radius: 18px; animation: shimmer 1.5s infinite; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        .empty-state { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 36px; margin-bottom: 16px; opacity: 0.2; }
        .empty-title { font-size: 15px; color: #9B9B9B; margin: 0 0 20px; }
        .empty-cta { padding: 12px 28px; background: #1A1A1A; color: #EDEAE3; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .empty-cta:hover { background: #2A2A2A; transform: translateY(-1px); }

        .delete-message { font-size: 15px; color: #3A3A3A; line-height: 1.6; margin: 0 0 24px; }
        .delete-warning { font-size: 13px; color: #9B9B9B; }
        .delete-actions { display: flex; gap: 10px; justify-content: flex-end; }
        .btn-cancel-del { padding: 11px 22px; background: transparent; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px; font-size: 14px; color: #6B6B6B; cursor: pointer; transition: all 0.2s ease; }
        .btn-cancel-del:hover { background: #F0EDE6; }
        .btn-delete { padding: 11px 24px; background: #D94040; color: white; border: none; border-radius: 999px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-delete:hover { background: #C03030; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(217,64,64,0.25); }

        @media (max-width: 640px) { .page-header { flex-direction: column; align-items: flex-start; gap: 12px; } }
      `}</style>
    </AppLayout>
  );
}
