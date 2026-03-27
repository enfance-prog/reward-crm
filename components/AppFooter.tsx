import packageJson from "../package.json";

const X_SUPPORT_HREF = "https://x.com/CKohaku38423";

export default function AppFooter() {
  const version = packageJson.version;

  return (
    <footer
      className="shrink-0 border-t border-black/6 bg-[#EDEAE3]/80 px-3 py-3 text-center text-[11px] leading-relaxed text-[#9B9B9B] sm:px-4"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap sm:gap-x-3 sm:gap-y-2">
        <p className="m-0 font-medium tracking-wide">
          Development by Pirozhki.
          <span className="mx-2 font-normal opacity-50" aria-hidden>
            ·
          </span>
          <span className="tabular-nums text-[#6B6B6B]">v{version}</span>
          <span className="ml-2 rounded bg-black/4 px-1.5 py-0.5 text-[10px] font-semibold text-[#8A8A8A]">
            α
          </span>
          <span className="ml-1 text-[10px] text-[#B0B0B0]">アルファ版</span>
        </p>
        <a
          href={X_SUPPORT_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#5A5A5A] shadow-sm transition hover:border-sky-500/35 hover:bg-sky-500/5 hover:text-[#0f1419]"
        >
          <span className="shrink-0 font-bold text-[#0f1419]" aria-hidden>
            X
          </span>
          <span className="min-w-0 truncate">サポートへ連絡（DM）</span>
        </a>
      </div>
    </footer>
  );
}
