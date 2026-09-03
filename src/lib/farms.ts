export type FarmSlug = "taot";
export type FarmTheme = { key: FarmSlug; route: string; backgroundClassName: string; panelClassName: string; sectionClassName: string };
export type FarmConfig = { slug: FarmSlug; route: string; routerKind: "aerodromeV2" | "uniswapV2"; chainId: number; chainName: string; projectName: string; projectTicker: string; tokenSymbol: string; tokenAddress: string; quoteTokenSymbol: string; quoteTokenAddress: string; quoteTokenDecimals: number; lpSymbol: string; rewardsContractAddress: string; lpTokenAddress: string; v2RouterAddress: string; v2PoolAddress: string; poolStable: boolean; liquiditySlippageBps: number; liquidityDeadlineMinutes: number; tokenDecimals: number; lpDecimals: number; theme: FarmTheme };

function getEnv(name: string, fallback: string) { const raw = import.meta.env[name]; return typeof raw === "string" && raw.trim() ? raw.trim() : fallback; }
function getNumberEnv(name: string, fallback: number) { const raw = import.meta.env[name]; if (typeof raw !== "string" || !raw.trim()) return fallback; const value = Number(raw); return Number.isFinite(value) ? value : fallback; }
function getBooleanEnv(name: string, fallback: boolean) { const value = import.meta.env[name]?.trim().toLowerCase(); return value === "true" ? true : value === "false" ? false : fallback; }

const defaults: FarmConfig = {
  slug: "taot", route: "/farm/taot", routerKind: "aerodromeV2", chainId: 8453, chainName: "Base Network",
  projectName: "TAOT", projectTicker: "TAOT", tokenSymbol: "TAOT",
  tokenAddress: "0x7f2f00e54dcaa8b248bdfd75da2ae859d4d8ff3e",
  quoteTokenSymbol: "WETH", quoteTokenAddress: "0x4200000000000000000000000000000000000006", quoteTokenDecimals: 18,
  lpSymbol: "TAOT/WETH LP", rewardsContractAddress: "0xYourTaotRewardsContractAddressHere",
  lpTokenAddress: "0xYourTaotLpTokenAddressHere", v2RouterAddress: "0xYourTaotV2RouterAddressHere",
  v2PoolAddress: "0xYourTaotPoolAddressHere", poolStable: false, liquiditySlippageBps: 100,
  liquidityDeadlineMinutes: 20, tokenDecimals: 18, lpDecimals: 18,
  theme: { key: "taot", route: "/farm/taot", backgroundClassName: "farm-dashboard-theme-taot", panelClassName: "farm-section-shell", sectionClassName: "farm-section-shell" },
};

const taotFarm: FarmConfig = {
  ...defaults,
  chainId: getNumberEnv("VITE_TAOT_CHAIN_ID", defaults.chainId), chainName: getEnv("VITE_TAOT_CHAIN_NAME", defaults.chainName),
  projectName: getEnv("VITE_TAOT_PROJECT_NAME", defaults.projectName), projectTicker: getEnv("VITE_TAOT_PROJECT_TICKER", defaults.projectTicker),
  tokenSymbol: getEnv("VITE_TAOT_TOKEN_SYMBOL", defaults.tokenSymbol), tokenAddress: getEnv("VITE_TAOT_TOKEN_ADDRESS", defaults.tokenAddress),
  quoteTokenSymbol: getEnv("VITE_TAOT_QUOTE_TOKEN_SYMBOL", defaults.quoteTokenSymbol), quoteTokenAddress: getEnv("VITE_TAOT_QUOTE_TOKEN_ADDRESS", defaults.quoteTokenAddress),
  quoteTokenDecimals: getNumberEnv("VITE_TAOT_QUOTE_TOKEN_DECIMALS", defaults.quoteTokenDecimals), lpSymbol: getEnv("VITE_TAOT_LP_SYMBOL", defaults.lpSymbol),
  rewardsContractAddress: getEnv("VITE_TAOT_REWARDS_CONTRACT_ADDRESS", defaults.rewardsContractAddress), lpTokenAddress: getEnv("VITE_TAOT_LP_TOKEN_ADDRESS", defaults.lpTokenAddress),
  v2RouterAddress: getEnv("VITE_TAOT_V2_ROUTER_ADDRESS", defaults.v2RouterAddress), v2PoolAddress: getEnv("VITE_TAOT_V2_POOL_ADDRESS", defaults.v2PoolAddress),
  poolStable: getBooleanEnv("VITE_TAOT_POOL_STABLE", defaults.poolStable), liquiditySlippageBps: getNumberEnv("VITE_TAOT_LIQUIDITY_SLIPPAGE_BPS", defaults.liquiditySlippageBps),
  liquidityDeadlineMinutes: getNumberEnv("VITE_TAOT_LIQUIDITY_DEADLINE_MINUTES", defaults.liquidityDeadlineMinutes), tokenDecimals: getNumberEnv("VITE_TAOT_TOKEN_DECIMALS", defaults.tokenDecimals), lpDecimals: getNumberEnv("VITE_TAOT_LP_DECIMALS", defaults.lpDecimals),
};

export const farmConfigs: Record<FarmSlug, FarmConfig> = { taot: taotFarm };
export const farmList = [taotFarm];
export function getFarmConfig(slug: FarmSlug) { return farmConfigs[slug]; }
