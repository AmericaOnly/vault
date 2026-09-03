import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FarmConfig } from "@/lib/farms";

type NavbarProps = {
  currentPath: string;
  onNavigate: (path: string) => void;
  farms: FarmConfig[];
};

export function Navbar({ currentPath, onNavigate, farms }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

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
            className={`rounded-full px-4 py-2 transition ${
              currentPath === "/"
                ? "bg-white/12 text-white"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            Home
          </button>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition ${
                currentPath.startsWith("/vault/")
                  ? "bg-white/12 text-white"
                  : "text-slate-300 hover:bg-white/8 hover:text-white"
              }`}
            >
              Tokens
              <ChevronDown
                className={`h-4 w-4 transition ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] min-w-[12rem] rounded-3xl border border-white/10 bg-slate-950/92 p-2 shadow-[0_24px_90px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                {farms.map((farm) => {
                  const active = currentPath === farm.route;

                  return (
                    <button
                      key={farm.route}
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onNavigate(farm.route);
                      }}
                      className={`w-full rounded-2xl px-4 py-3 text-left text-sm uppercase tracking-[0.18em] transition ${
                        active
                          ? "bg-blue-500/20 text-white"
                          : "text-slate-200 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {farm.projectName}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
