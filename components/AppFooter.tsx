import packageJson from "../package.json";

export default function AppFooter() {
  const version = packageJson.version;

  return (
    <footer
      className="shrink-0 border-t border-black/6 bg-[#EDEAE3]/80 px-4 py-3 text-center text-[11px] leading-relaxed text-[#9B9B9B]"
      role="contentinfo"
    >
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
    </footer>
  );
}
