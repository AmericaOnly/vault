type NavbarProps = {
  onNavigate: (path: string) => void;
};

export function Navbar({ onNavigate }: NavbarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-white/10 bg-slate-950/65 px-4 py-3 shadow-[0_20px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate("/")}
          className="flex items-center gap-3 text-left"
        >
          <span className="taot-brand-mark">
            <img src={`${import.meta.env.BASE_URL}images/taot.png`} alt="TAOT" />
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.32em] text-slate-300/70">
              BuyTAOT.com
            </span>
            <span className="block text-lg font-semibold tracking-tight text-white">
              TAOT Vault
            </span>
          </span>
        </button>

        <nav className="flex items-center gap-2 text-sm text-slate-100 sm:gap-3">
          <div
            className="flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-500/10 px-3 py-2 text-blue-100"
            aria-label="Connected to Base network"
          >
            <span className="h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]" />
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] sm:inline">
              Connected to
            </span>
            <span className="font-semibold">Base</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("/")}
            className="rounded-full px-4 py-2 text-slate-300 transition hover:bg-white/8 hover:text-white"
          >
            Home
          </button>
        </nav>
      </div>
    </header>
  );
}
