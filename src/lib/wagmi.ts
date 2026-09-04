import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, injectedWallet, metaMaskWallet, trustWallet, uniswapWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { fallback, http } from "wagmi";
import { base } from "wagmi/chains";

const configuredBaseRpcUrl = import.meta.env.VITE_BASE_RPC_URL?.trim();
const publicBaseRpcUrls = [
  "https://mainnet.base.org",
  "https://base-rpc.publicnode.com",
  "https://1rpc.io/base",
  "https://base.drpc.org",
];
const baseRpcUrls = configuredBaseRpcUrl
  ? [configuredBaseRpcUrl, ...publicBaseRpcUrls.filter((url) => url !== configuredBaseRpcUrl)]
  : publicBaseRpcUrls;
const baseTransport = fallback(baseRpcUrls.map((url) => http(url, { timeout: 10_000 })));
export const wagmiConfig = getDefaultConfig({
  appName: "TAOT Vault",
  appDescription: "Stake TAOT/USDC liquidity and earn TAOT rewards on Base.",
  appUrl: "https://buytaot.com/",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [base], transports: { [base.id]: baseTransport },
  wallets: [{ groupName: "Recommended", wallets: [metaMaskWallet, uniswapWallet, trustWallet, coinbaseWallet, walletConnectWallet, injectedWallet] }],
  ssr: false,
});
