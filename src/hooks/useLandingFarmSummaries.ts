import type { FarmConfig, FarmSlug } from "@/lib/farms";
export type LandingFarmSummary = { status: "unconfigured" | "ready"; rewardPerDay: number | null };
export function useLandingFarmSummaries(farms: FarmConfig[]) {
  const raw = import.meta.env.VITE_TAOT_REWARD;
  const parsed = typeof raw === "string" ? Number(raw.trim()) : Number.NaN;
  const summary: LandingFarmSummary = Number.isFinite(parsed) ? { status: "ready", rewardPerDay: parsed } : { status: "unconfigured", rewardPerDay: null };
  return { summaries: Object.fromEntries(farms.map((farm) => [farm.slug, summary])) as Record<FarmSlug, LandingFarmSummary>, isLoading: false };
}
