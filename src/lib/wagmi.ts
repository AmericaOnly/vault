import { getDefaultConfig, type Wallet } from "@rainbow-me/rainbowkit";
import { coinbaseWallet, injectedWallet, metaMaskWallet, trustWallet, uniswapWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConnector, fallback, http } from "wagmi";
import { base } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import type { EIP1193Provider } from "viem";

type Eip6963Announcement = {
  info?: {
    uuid?: string;
    name?: string;
    icon?: string;
    rdns?: string;
  };
  provider?: EIP1193Provider;
};

let taotBaseProvider: Eip6963Announcement["provider"];

const taotBaseWallet = (): Wallet => ({
  id: "taotBaseWallet",
  name: "TAOT Base Wallet",
  rdns: "com.buytaot.app",
  iconUrl: `${import.meta.env.BASE_URL}images/taot.png`,
  iconBackground: "#020617",
  createConnector: (walletDetails) =>
    createConnector((config) => ({
      ...injected({
        target: () => ({
          id: "com.buytaot.app",
          name: "TAOT Base Wallet",
          provider: taotBaseProvider as NonNullable<typeof taotBaseProvider>,
        }),
      })(config),
      ...walletDetails,
    })),
});

type WalletDiagnostic = {
  rawAnnouncements: Array<Record<string, unknown>>;
  wagmiConnectors: Array<Record<string, unknown>>;
};

const walletDiagnostic: WalletDiagnostic = {
  rawAnnouncements: [],
  wagmiConnectors: [],
};

if (typeof window !== "undefined") {
  (window as typeof window & { __TAOT_WALLET_DIAGNOSTICS__?: WalletDiagnostic })
    .__TAOT_WALLET_DIAGNOSTICS__ = walletDiagnostic;

  window.addEventListener("eip6963:announceProvider", (event) => {
    const detail = (event as CustomEvent<Eip6963Announcement>).detail;
    if (detail?.info?.rdns === "com.buytaot.app" && detail.provider) {
      taotBaseProvider = detail.provider;
    }
    const announcement = {
      uuid: detail?.info?.uuid,
      name: detail?.info?.name,
      rdns: detail?.info?.rdns,
      iconIsData: detail?.info?.icon?.startsWith("data:image") ?? false,
      requestIsFunction: typeof detail?.provider?.request === "function",
    };

    walletDiagnostic.rawAnnouncements.push(announcement);
    console.info("[TAOT wallet diagnostic] EIP-6963 announcement", announcement);
  });
}

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
  wallets: [{ groupName: "Recommended", wallets: [taotBaseWallet, metaMaskWallet, uniswapWallet, trustWallet, coinbaseWallet, walletConnectWallet, injectedWallet] }],
  ssr: false,
});

if (typeof window !== "undefined") {
  const recordConnectors = () => {
    walletDiagnostic.wagmiConnectors = wagmiConfig.connectors.map((connector) => ({
      id: connector.id,
      name: connector.name,
      rdns: connector.rdns,
      type: connector.type,
      iconIsData: connector.icon?.startsWith("data:image") ?? false,
    }));
    console.info(
      "[TAOT wallet diagnostic] wagmi connectors",
      walletDiagnostic.wagmiConnectors,
    );
  };

  recordConnectors();
  wagmiConfig._internal.connectors.subscribe(recordConnectors);
  window.dispatchEvent(new CustomEvent("eip6963:requestProvider"));
}
