import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, injectedWallet, metaMaskWallet, trustWallet, uniswapWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { base } from "wagmi/chains";

const baseRpcUrl = import.meta.env.VITE_BASE_RPC_URL?.trim() || undefined;
export const wagmiConfig = getDefaultConfig({
  appName: "TAOT Vault",
  appDescription: "Stake TAOT/USDC liquidity and earn TAOT rewards on Base.",
  appUrl: "https://buytaot.com/",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [base], transports: { [base.id]: http(baseRpcUrl) },
  wallets: [{ groupName: "Recommended", wallets: [metaMaskWallet, uniswapWallet, trustWallet, coinbaseWallet, walletConnectWallet, injectedWallet] }],
  ssr: false,
});
