import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  JsonRpcSigner,
  MaxUint256,
  isAddress,
  type Eip1193Provider,
} from "ethers";
import { useAccount, useBalance, useReadContracts } from "wagmi";
import { useFarmConfig } from "@/lib/farm-context";
import { REWARDS_ABI } from "@/lib/abis";
import {
  getLpReadContract,
  getTokenReadContract,
  getTokenWriteContract,
  getV2PairReadContract,
  getV2RouterWriteContract,
  getLpWriteContract,
  getRewardsReadContract,
  getRewardsWriteContract,
} from "@/lib/contracts";
import { formatUnitsSafe, parseInputToUnits, parseInputToUnitsSafe } from "@/lib/format";

export type FarmState = {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string;
  status: string;
  busy: boolean;
  walletLpBalance: bigint;
  walletTokenBalance: bigint;
  walletQuoteTokenBalance: bigint;
  stakedBalance: bigint;
  earnedRewards: bigint;
  rewardRate: bigint;
  periodFinish: bigint;
  allowance: bigint;
  tokenAllowanceToRouter: bigint;
  quoteTokenAllowanceToRouter: bigint;
  lpAllowanceToRouter: bigint;
  totalStaked: bigint;
  pairTokenReserve: bigint;
  pairQuoteReserve: bigint;
  liquidityTokenInput: string;
  liquidityQuoteInput: string;
  removeLiquidityInput: string;
  stakeInput: string;
  withdrawInput: string;
  hasApproval: boolean;
  hasLiquidityTokenApproval: boolean;
  hasLiquidityQuoteApproval: boolean;
  hasRemoveLiquidityApproval: boolean;
  setLiquidityTokenInput: (value: string) => void;
  setLiquidityQuoteInput: (value: string) => void;
  setRemoveLiquidityInput: (value: string) => void;
  setStakeInput: (value: string) => void;
  setWithdrawInput: (value: string) => void;
  refreshData: () => Promise<void>;
  approveTokenForRouter: () => Promise<void>;
  approveQuoteTokenForRouter: () => Promise<void>;
  approveLpForRouter: () => Promise<void>;
  addLiquidity: () => Promise<void>;
  removeLiquidity: () => Promise<void>;
  approveLp: () => Promise<void>;
  stakeLp: () => Promise<void>;
  withdrawLp: () => Promise<void>;
  claimRewards: () => Promise<void>;
  exitFarm: () => Promise<void>;
  fillMaxLiquidityToken: () => void;
  fillMaxLiquidityQuote: () => void;
  fillMaxRemoveLiquidity: () => void;
  fillMaxStake: () => void;
  fillMaxWithdraw: () => void;
};

function formatStatusError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  if (!message) {
    return fallback;
  }

  if (message.includes("missing revert data")) {
    return `${fallback} The router rejected the transaction. Check the router address, pool address, pool type, and entered amounts.`;
  }

  if (message.includes("execution reverted")) {
    return `${fallback} The router reverted the transaction. Refresh balances, confirm approvals, and try a smaller amount near the current pool ratio.`;
  }

  return message.length > 220 ? `${message.slice(0, 217)}...` : message;
}

async function waitForConfirmedTransaction(
  tx: { hash?: string | null; wait: () => Promise<unknown> },
  provider: BrowserProvider | null,
) {
  try {
    await tx.wait();
    return;
  } catch (error) {
    if (provider && tx.hash) {
      const receipt = await provider.waitForTransaction(tx.hash, 1, 15_000);

      if (receipt?.status === 1) {
        return;
      }
    }

    throw error;
  }
}

export function useFarm(): FarmState {
  const farmConfig = useFarmConfig();
  const { address, connector, chain, isConnected } = useAccount();
  const rewardsContractReady = isAddress(farmConfig.rewardsContractAddress);
  const {
    data: publicProgramInfoData,
  } = useReadContracts({
    contracts: rewardsContractReady
      ? [
          {
            address: farmConfig.rewardsContractAddress as `0x${string}`,
            chainId: farmConfig.chainId,
            abi: REWARDS_ABI,
            functionName: "rewardRate",
          },
          {
            address: farmConfig.rewardsContractAddress as `0x${string}`,
            chainId: farmConfig.chainId,
            abi: REWARDS_ABI,
            functionName: "periodFinish",
          },
          {
            address: farmConfig.rewardsContractAddress as `0x${string}`,
            chainId: farmConfig.chainId,
            abi: REWARDS_ABI,
            functionName: "totalSupply",
          },
        ]
      : [],
    allowFailure: true,
    query: {
      enabled: rewardsContractReady,
      refetchInterval: 10000,
    },
  });
  const { data: walletTokenBalanceData } = useBalance({
    address,
    chainId: farmConfig.chainId,
    token: farmConfig.tokenAddress as `0x${string}`,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10000,
    },
  });
  const { data: walletQuoteTokenBalanceData } = useBalance({
    address,
    chainId: farmConfig.chainId,
    token: farmConfig.quoteTokenAddress as `0x${string}`,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10000,
    },
  });
  const { data: walletLpBalanceData } = useBalance({
    address,
    chainId: farmConfig.chainId,
    token: farmConfig.lpTokenAddress as `0x${string}`,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10000,
    },
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState("");
  const [status, setStatus] = useState("Connect your wallet to begin.");
  const [busy, setBusy] = useState(false);

  const [walletLpBalance, setWalletLpBalance] = useState(0n);
  const [walletTokenBalance, setWalletTokenBalance] = useState(0n);
  const [walletQuoteTokenBalance, setWalletQuoteTokenBalance] = useState(0n);
  const [stakedBalance, setStakedBalance] = useState(0n);
  const [earnedRewards, setEarnedRewards] = useState(0n);
  const [rewardRate, setRewardRate] = useState(0n);
  const [periodFinish, setPeriodFinish] = useState(0n);
  const [allowance, setAllowance] = useState(0n);
  const [tokenAllowanceToRouter, setTokenAllowanceToRouter] = useState(0n);
  const [quoteTokenAllowanceToRouter, setQuoteTokenAllowanceToRouter] = useState(0n);
  const [lpAllowanceToRouter, setLpAllowanceToRouter] = useState(0n);
  const [totalStaked, setTotalStaked] = useState(0n);
  const [pairLiquiditySupply, setPairLiquiditySupply] = useState(0n);
  const [pairTokenReserve, setPairTokenReserve] = useState(0n);
  const [pairQuoteReserve, setPairQuoteReserve] = useState(0n);

  const [liquidityTokenInput, setLiquidityTokenInput] = useState("");
  const [liquidityQuoteInput, setLiquidityQuoteInput] = useState("");
  const [removeLiquidityInput, setRemoveLiquidityInput] = useState("");
  const [stakeInput, setStakeInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");

  const rewardsRead = useMemo(
    () => (provider ? getRewardsReadContract(provider, farmConfig) : null),
    [farmConfig, provider],
  );
  const lpRead = useMemo(
    () => (provider ? getLpReadContract(provider, farmConfig) : null),
    [farmConfig, provider],
  );
  const tokenRead = useMemo(
    () => (provider ? getTokenReadContract(farmConfig.tokenAddress, provider) : null),
    [farmConfig.tokenAddress, provider],
  );
  const quoteTokenRead = useMemo(
    () => (provider ? getTokenReadContract(farmConfig.quoteTokenAddress, provider) : null),
    [farmConfig.quoteTokenAddress, provider],
  );
  const pairRead = useMemo(
    () => (provider ? getV2PairReadContract(provider, farmConfig) : null),
    [farmConfig, provider],
  );
  const rewardsWrite = useMemo(
    () => (signer ? getRewardsWriteContract(signer, farmConfig) : null),
    [farmConfig, signer],
  );
  const lpWrite = useMemo(
    () => (signer ? getLpWriteContract(signer, farmConfig) : null),
    [farmConfig, signer],
  );
  const tokenWrite = useMemo(
    () => (signer ? getTokenWriteContract(farmConfig.tokenAddress, signer) : null),
    [farmConfig.tokenAddress, signer],
  );
  const quoteTokenWrite = useMemo(
    () => (signer ? getTokenWriteContract(farmConfig.quoteTokenAddress, signer) : null),
    [farmConfig.quoteTokenAddress, signer],
  );
  const v2RouterWrite = useMemo(
    () => (signer ? getV2RouterWriteContract(signer, farmConfig) : null),
    [farmConfig, signer],
  );
  const isOnFarmChain = (chain?.id ?? farmConfig.chainId) === farmConfig.chainId;

  const refreshData = useCallback(async () => {
    if (!isOnFarmChain) {
      return;
    }

    if (!provider || !rewardsRead || !lpRead || !tokenRead || !quoteTokenRead || !pairRead || !account) {
      return;
    }

    try {
      const [
        walletLpBalanceResult,
        walletTokenBalanceResult,
        walletQuoteTokenBalanceResult,
        stakedBalanceResult,
        earnedResult,
        rewardRateResult,
        periodFinishResult,
        allowanceResult,
        tokenAllowanceToRouterResult,
        quoteTokenAllowanceToRouterResult,
        lpAllowanceToRouterResult,
        totalStakedResult,
        pairLiquiditySupplyResult,
        pairToken0Result,
        pairToken1Result,
        pairReservesResult,
      ] = await Promise.allSettled([
        lpRead.balanceOf(account),
        tokenRead.balanceOf(account),
        quoteTokenRead.balanceOf(account),
        rewardsRead.balanceOf(account),
        rewardsRead.earned(account),
        rewardsRead.rewardRate(),
        rewardsRead.periodFinish(),
        lpRead.allowance(account, farmConfig.rewardsContractAddress),
        tokenRead.allowance(account, farmConfig.v2RouterAddress),
        quoteTokenRead.allowance(account, farmConfig.v2RouterAddress),
        lpRead.allowance(account, farmConfig.v2RouterAddress),
        rewardsRead.totalSupply(),
        pairRead.totalSupply(),
        pairRead.token0(),
        pairRead.token1(),
        pairRead.getReserves(),
      ]);

      if (walletLpBalanceResult.status === "fulfilled" && !walletLpBalanceData) {
        setWalletLpBalance(walletLpBalanceResult.value as bigint);
      }

      if (walletTokenBalanceResult.status === "fulfilled" && !walletTokenBalanceData) {
        setWalletTokenBalance(walletTokenBalanceResult.value as bigint);
      }

      if (
        walletQuoteTokenBalanceResult.status === "fulfilled" &&
        !walletQuoteTokenBalanceData
      ) {
        setWalletQuoteTokenBalance(walletQuoteTokenBalanceResult.value as bigint);
      }

      if (stakedBalanceResult.status === "fulfilled") {
        setStakedBalance(stakedBalanceResult.value as bigint);
      }

      if (earnedResult.status === "fulfilled") {
        setEarnedRewards(earnedResult.value as bigint);
      }

      if (rewardRateResult.status === "fulfilled") {
        setRewardRate(rewardRateResult.value as bigint);
      }

      if (periodFinishResult.status === "fulfilled") {
        setPeriodFinish(periodFinishResult.value as bigint);
      }

      if (allowanceResult.status === "fulfilled") {
        setAllowance(allowanceResult.value as bigint);
      }

      if (tokenAllowanceToRouterResult.status === "fulfilled") {
        setTokenAllowanceToRouter(tokenAllowanceToRouterResult.value as bigint);
      }

      if (quoteTokenAllowanceToRouterResult.status === "fulfilled") {
        setQuoteTokenAllowanceToRouter(quoteTokenAllowanceToRouterResult.value as bigint);
      }

      if (lpAllowanceToRouterResult.status === "fulfilled") {
        setLpAllowanceToRouter(lpAllowanceToRouterResult.value as bigint);
      }

      if (totalStakedResult.status === "fulfilled") {
        setTotalStaked(totalStakedResult.value as bigint);
      }

      if (pairLiquiditySupplyResult.status === "fulfilled") {
        setPairLiquiditySupply(pairLiquiditySupplyResult.value as bigint);
      } else {
        setPairLiquiditySupply(0n);
      }

      if (
        pairToken0Result.status === "fulfilled" &&
        pairToken1Result.status === "fulfilled" &&
        pairReservesResult.status === "fulfilled"
      ) {
        const token0Address = String(pairToken0Result.value).toLowerCase();
        const token1Address = String(pairToken1Result.value).toLowerCase();
        const tokenAddress = farmConfig.tokenAddress.toLowerCase();
        const quoteTokenAddress = farmConfig.quoteTokenAddress.toLowerCase();
        const reserves = pairReservesResult.value as [bigint, bigint, number];

        if (token0Address === tokenAddress && token1Address === quoteTokenAddress) {
          setPairTokenReserve(reserves[0]);
          setPairQuoteReserve(reserves[1]);
        } else if (token0Address === quoteTokenAddress && token1Address === tokenAddress) {
          setPairTokenReserve(reserves[1]);
          setPairQuoteReserve(reserves[0]);
        } else {
          setPairTokenReserve(0n);
          setPairQuoteReserve(0n);
          setStatus(
            `Configured pair does not match the ${farmConfig.tokenSymbol}/${farmConfig.quoteTokenSymbol} token addresses.`,
          );
        }
      } else {
        setPairTokenReserve(0n);
        setPairQuoteReserve(0n);
      }
    } catch (error) {
      setStatus(formatStatusError(error, "Failed to refresh contract data."));
    }
  }, [
    account,
    lpRead,
    pairRead,
    provider,
    quoteTokenRead,
    rewardsRead,
    tokenRead,
    walletLpBalanceData,
    walletQuoteTokenBalanceData,
    walletTokenBalanceData,
    isOnFarmChain,
  ]);

  useEffect(() => {
    if (!publicProgramInfoData?.length) {
      return;
    }

    const [rewardRateResult, periodFinishResult, totalStakedResult] = publicProgramInfoData;

    if (rewardRateResult?.status === "success" && typeof rewardRateResult.result === "bigint") {
      setRewardRate(rewardRateResult.result);
    }

    if (
      periodFinishResult?.status === "success" &&
      typeof periodFinishResult.result === "bigint"
    ) {
      setPeriodFinish(periodFinishResult.result);
    }

    if (
      totalStakedResult?.status === "success" &&
      typeof totalStakedResult.result === "bigint"
    ) {
      setTotalStaked(totalStakedResult.result);
    }
  }, [publicProgramInfoData]);

  useEffect(() => {
    if (walletTokenBalanceData?.value != null) {
      setWalletTokenBalance(walletTokenBalanceData.value);
    }
  }, [walletTokenBalanceData?.value]);

  useEffect(() => {
    if (walletQuoteTokenBalanceData?.value != null) {
      setWalletQuoteTokenBalance(walletQuoteTokenBalanceData.value);
    }
  }, [walletQuoteTokenBalanceData?.value]);

  useEffect(() => {
    if (walletLpBalanceData?.value != null) {
      setWalletLpBalance(walletLpBalanceData.value);
    }
  }, [walletLpBalanceData?.value]);

  const quoteFromTokenInput = useCallback((value: string) => {
    const amountIn = parseInputToUnitsSafe(value, farmConfig.tokenDecimals);
    if (!value.trim() || amountIn <= 0n || pairTokenReserve <= 0n || pairQuoteReserve <= 0n) {
      return "";
    }

    const quotedAmount = (amountIn * pairQuoteReserve) / pairTokenReserve;
    return formatUnitsSafe(quotedAmount, farmConfig.quoteTokenDecimals, 8);
  }, [pairQuoteReserve, pairTokenReserve]);

  const tokenFromQuoteInput = useCallback((value: string) => {
    const amountIn = parseInputToUnitsSafe(value, farmConfig.quoteTokenDecimals);
    if (!value.trim() || amountIn <= 0n || pairTokenReserve <= 0n || pairQuoteReserve <= 0n) {
      return "";
    }

    const quotedAmount = (amountIn * pairTokenReserve) / pairQuoteReserve;
    return formatUnitsSafe(quotedAmount, farmConfig.tokenDecimals, 8);
  }, [pairQuoteReserve, pairTokenReserve]);

  const handleLiquidityTokenInput = useCallback((value: string) => {
    setLiquidityTokenInput(value);
    setLiquidityQuoteInput(quoteFromTokenInput(value));
  }, [quoteFromTokenInput]);

  const handleLiquidityQuoteInput = useCallback((value: string) => {
    setLiquidityQuoteInput(value);
    setLiquidityTokenInput(tokenFromQuoteInput(value));
  }, [tokenFromQuoteInput]);

  const hasApproval = allowance > 0n;
  const requiredTokenApproval = parseInputToUnitsSafe(
    liquidityTokenInput || "0",
    farmConfig.tokenDecimals,
  );
  const requiredQuoteApproval = parseInputToUnitsSafe(
    liquidityQuoteInput || "0",
    farmConfig.quoteTokenDecimals,
  );
  const requiredRemoveLiquidityApproval = parseInputToUnitsSafe(
    removeLiquidityInput || "0",
    farmConfig.lpDecimals,
  );
  const hasLiquidityTokenApproval =
    requiredTokenApproval === 0n || tokenAllowanceToRouter >= requiredTokenApproval;
  const hasLiquidityQuoteApproval =
    requiredQuoteApproval === 0n || quoteTokenAllowanceToRouter >= requiredQuoteApproval;
  const hasLpRouterApproval = lpAllowanceToRouter > 0n;
  const hasRemoveLiquidityApproval =
    hasLpRouterApproval &&
    (requiredRemoveLiquidityApproval === 0n || lpAllowanceToRouter >= requiredRemoveLiquidityApproval);

  const approveLp = useCallback(async () => {
    if (!lpWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus("Sending LP approval...");
      const tx = await lpWrite.approve(farmConfig.rewardsContractAddress, MaxUint256);
      await waitForConfirmedTransaction(tx, provider);
      setStatus("LP approval confirmed.");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "LP approval failed."));
    } finally {
      setBusy(false);
    }
  }, [lpWrite, refreshData]);

  const approveTokenForRouter = useCallback(async () => {
    if (!tokenWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus(`Approving ${farmConfig.tokenSymbol} for the V2 router...`);
      const tx = await tokenWrite.approve(farmConfig.v2RouterAddress, MaxUint256);
      await waitForConfirmedTransaction(tx, provider);
      setStatus(`${farmConfig.tokenSymbol} approval confirmed.`);
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, `${farmConfig.tokenSymbol} approval failed.`));
    } finally {
      setBusy(false);
    }
  }, [refreshData, tokenWrite]);

  const approveQuoteTokenForRouter = useCallback(async () => {
    if (!quoteTokenWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus(`Approving ${farmConfig.quoteTokenSymbol} for the V2 router...`);
      const tx = await quoteTokenWrite.approve(farmConfig.v2RouterAddress, MaxUint256);
      await waitForConfirmedTransaction(tx, provider);
      setStatus(`${farmConfig.quoteTokenSymbol} approval confirmed.`);
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, `${farmConfig.quoteTokenSymbol} approval failed.`));
    } finally {
      setBusy(false);
    }
  }, [quoteTokenWrite, refreshData]);

  const approveLpForRouter = useCallback(async () => {
    if (!lpWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus(`Approving ${farmConfig.lpSymbol} for the V2 router...`);
      const tx = await lpWrite.approve(farmConfig.v2RouterAddress, MaxUint256);
      await waitForConfirmedTransaction(tx, provider);
      setStatus(`${farmConfig.lpSymbol} router approval confirmed.`);
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "LP router approval failed."));
    } finally {
      setBusy(false);
    }
  }, [lpWrite, refreshData]);

  const addLiquidity = useCallback(async () => {
    if (!v2RouterWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      const amountTokenDesired = parseInputToUnits(
        liquidityTokenInput,
        farmConfig.tokenDecimals,
      );
      const amountQuoteDesired = parseInputToUnits(
        liquidityQuoteInput,
        farmConfig.quoteTokenDecimals,
      );

      if (amountTokenDesired <= 0n || amountQuoteDesired <= 0n) {
        setStatus(
          `Enter valid ${farmConfig.tokenSymbol} and ${farmConfig.quoteTokenSymbol} amounts.`,
        );
        return;
      }

      if (!hasLiquidityTokenApproval || !hasLiquidityQuoteApproval) {
        setStatus(`Approve both ${farmConfig.tokenSymbol} and ${farmConfig.quoteTokenSymbol} before adding liquidity.`);
        return;
      }

      if (amountTokenDesired > walletTokenBalance) {
        setStatus(`Insufficient ${farmConfig.tokenSymbol} balance for this liquidity add.`);
        return;
      }

      if (amountQuoteDesired > walletQuoteTokenBalance) {
        setStatus(`Insufficient ${farmConfig.quoteTokenSymbol} balance for this liquidity add.`);
        return;
      }

      if (pairTokenReserve <= 0n || pairQuoteReserve <= 0n) {
        setStatus("Pool reserves are unavailable right now. Refresh and try again.");
        return;
      }

      const slippageBps = BigInt(farmConfig.liquiditySlippageBps);
      const amountTokenMin = (amountTokenDesired * (10000n - slippageBps)) / 10000n;
      const amountQuoteMin = (amountQuoteDesired * (10000n - slippageBps)) / 10000n;
      const deadline =
        BigInt(Math.floor(Date.now() / 1000)) +
        BigInt(farmConfig.liquidityDeadlineMinutes * 60);

      setBusy(true);
      setStatus(
        `Adding ${farmConfig.tokenSymbol}/${farmConfig.quoteTokenSymbol} liquidity...`,
      );

      const tx = await v2RouterWrite.addLiquidity(
        ...(farmConfig.routerKind === "aerodromeV2"
          ? [
              farmConfig.tokenAddress,
              farmConfig.quoteTokenAddress,
              farmConfig.poolStable,
              amountTokenDesired,
              amountQuoteDesired,
              amountTokenMin,
              amountQuoteMin,
              account,
              deadline,
            ]
          : [
              farmConfig.tokenAddress,
              farmConfig.quoteTokenAddress,
              amountTokenDesired,
              amountQuoteDesired,
              amountTokenMin,
              amountQuoteMin,
              account,
              deadline,
            ]),
      );

      await waitForConfirmedTransaction(tx, provider);
      setStatus("Liquidity added. Your LP tokens are ready to stake.");
      setLiquidityTokenInput("");
      setLiquidityQuoteInput("");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Add liquidity failed."));
    } finally {
      setBusy(false);
    }
  }, [
    account,
    hasLiquidityQuoteApproval,
    hasLiquidityTokenApproval,
    liquidityQuoteInput,
    liquidityTokenInput,
    pairQuoteReserve,
    pairTokenReserve,
    refreshData,
    v2RouterWrite,
    walletQuoteTokenBalance,
    walletTokenBalance,
  ]);

  const removeLiquidity = useCallback(async () => {
    if (!v2RouterWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      const liquidity = parseInputToUnits(removeLiquidityInput, farmConfig.lpDecimals);

      if (liquidity <= 0n) {
        setStatus("Enter a valid LP amount to remove.");
        return;
      }

      if (!hasRemoveLiquidityApproval) {
        setStatus("Approve your LP tokens for the router before removing liquidity.");
        return;
      }

      if (liquidity > walletLpBalance) {
        setStatus(`Insufficient ${farmConfig.lpSymbol} balance in your wallet to remove that amount.`);
        return;
      }

      const slippageBps = BigInt(farmConfig.liquiditySlippageBps);
      let amountTokenMin = 0n;
      let amountQuoteMin = 0n;

      if (pairLiquiditySupply > 0n && pairTokenReserve > 0n && pairQuoteReserve > 0n) {
        const expectedTokenOut = (liquidity * pairTokenReserve) / pairLiquiditySupply;
        const expectedQuoteOut = (liquidity * pairQuoteReserve) / pairLiquiditySupply;
        amountTokenMin = (expectedTokenOut * (10000n - slippageBps)) / 10000n;
        amountQuoteMin = (expectedQuoteOut * (10000n - slippageBps)) / 10000n;
      }

      const deadline =
        BigInt(Math.floor(Date.now() / 1000)) +
        BigInt(farmConfig.liquidityDeadlineMinutes * 60);

      setBusy(true);
      setStatus(`Removing ${farmConfig.lpSymbol} liquidity...`);

      const tx = await v2RouterWrite.removeLiquidity(
        ...(farmConfig.routerKind === "aerodromeV2"
          ? [
              farmConfig.tokenAddress,
              farmConfig.quoteTokenAddress,
              farmConfig.poolStable,
              liquidity,
              amountTokenMin,
              amountQuoteMin,
              account,
              deadline,
            ]
          : [
              farmConfig.tokenAddress,
              farmConfig.quoteTokenAddress,
              liquidity,
              amountTokenMin,
              amountQuoteMin,
              account,
              deadline,
            ]),
      );

      await waitForConfirmedTransaction(tx, provider);
      setStatus(`Liquidity removed. ${farmConfig.tokenSymbol} and ${farmConfig.quoteTokenSymbol} returned to your wallet.`);
      setRemoveLiquidityInput("");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Remove liquidity failed."));
    } finally {
      setBusy(false);
    }
  }, [
    account,
    pairQuoteReserve,
    pairLiquiditySupply,
    pairTokenReserve,
    refreshData,
    removeLiquidityInput,
    v2RouterWrite,
    hasRemoveLiquidityApproval,
    walletLpBalance,
  ]);

  const stakeLp = useCallback(async () => {
    if (!rewardsWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      const amount = parseInputToUnits(stakeInput, farmConfig.lpDecimals);

      if (amount <= 0n) {
        setStatus("Enter a valid LP amount to stake.");
        return;
      }

      setBusy(true);
      setStatus("Submitting stake transaction...");
      const tx = await rewardsWrite.stake(amount);
      await waitForConfirmedTransaction(tx, provider);
      setStatus("Stake confirmed.");
      setStakeInput("");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Stake failed."));
    } finally {
      setBusy(false);
    }
  }, [refreshData, rewardsWrite, stakeInput]);

  const withdrawLp = useCallback(async () => {
    if (!rewardsWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      const amount = parseInputToUnits(withdrawInput, farmConfig.lpDecimals);

      if (amount <= 0n) {
        setStatus("Enter a valid LP amount to withdraw.");
        return;
      }

      setBusy(true);
      setStatus("Submitting withdraw transaction...");
      const tx = await rewardsWrite.withdraw(amount);
      await waitForConfirmedTransaction(tx, provider);
      setStatus("Withdraw confirmed.");
      setWithdrawInput("");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Withdraw failed."));
    } finally {
      setBusy(false);
    }
  }, [refreshData, rewardsWrite, withdrawInput]);

  const claimRewards = useCallback(async () => {
    if (!rewardsWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus(`Claiming ${farmConfig.tokenSymbol} rewards...`);
      const tx = await rewardsWrite.getReward();
      await waitForConfirmedTransaction(tx, provider);
      setStatus("Rewards claimed.");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Claim failed."));
    } finally {
      setBusy(false);
    }
  }, [refreshData, rewardsWrite]);

  const exitFarm = useCallback(async () => {
    if (!rewardsWrite) {
      setStatus("Connect wallet first.");
      return;
    }

    try {
      setBusy(true);
      setStatus("Exiting farm: withdrawing LP and claiming rewards...");
      const tx = await rewardsWrite.exit();
      await waitForConfirmedTransaction(tx, provider);
      setStatus("Exit confirmed.");
      await refreshData();
    } catch (error) {
      setStatus(formatStatusError(error, "Exit failed."));
    } finally {
      setBusy(false);
    }
  }, [refreshData, rewardsWrite]);

  const fillMaxStake = useCallback(() => {
    setStakeInput(formatUnitsSafe(walletLpBalance, farmConfig.lpDecimals, 8));
  }, [walletLpBalance]);

  const fillMaxWithdraw = useCallback(() => {
    setWithdrawInput(formatUnitsSafe(stakedBalance, farmConfig.lpDecimals, 8));
  }, [stakedBalance]);

  const fillMaxLiquidityToken = useCallback(() => {
    const nextValue = formatUnitsSafe(walletTokenBalance, farmConfig.tokenDecimals, 8);
    setLiquidityTokenInput(nextValue);
    setLiquidityQuoteInput(quoteFromTokenInput(nextValue));
  }, [quoteFromTokenInput, walletTokenBalance]);

  const fillMaxLiquidityQuote = useCallback(() => {
    const nextValue = formatUnitsSafe(walletQuoteTokenBalance, farmConfig.quoteTokenDecimals, 8);
    setLiquidityQuoteInput(nextValue);
    setLiquidityTokenInput(tokenFromQuoteInput(nextValue));
  }, [tokenFromQuoteInput, walletQuoteTokenBalance]);

  const fillMaxRemoveLiquidity = useCallback(() => {
    setRemoveLiquidityInput(formatUnitsSafe(walletLpBalance, farmConfig.lpDecimals, 8));
  }, [walletLpBalance]);

  useEffect(() => {
    if (isOnFarmChain) {
      return;
    }

    setAllowance(0n);
    setTokenAllowanceToRouter(0n);
    setQuoteTokenAllowanceToRouter(0n);
    setLpAllowanceToRouter(0n);
    setWalletLpBalance(0n);
    setWalletTokenBalance(0n);
    setWalletQuoteTokenBalance(0n);
    setStakedBalance(0n);
    setEarnedRewards(0n);
    setPairTokenReserve(0n);
    setPairQuoteReserve(0n);
  }, [isOnFarmChain]);

  useEffect(() => {
    if (!account) {
      return;
    }

    void refreshData();

    const interval = window.setInterval(() => {
      void refreshData();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [account, refreshData]);

  useEffect(() => {
    if (!account) {
      return;
    }

    const nextValue = formatUnitsSafe(walletTokenBalance, farmConfig.tokenDecimals, 8);
    setLiquidityTokenInput(nextValue);
    setLiquidityQuoteInput(quoteFromTokenInput(nextValue));
  }, [account, quoteFromTokenInput, walletTokenBalance]);

  useEffect(() => {
    if (!isConnected || !connector || !address) {
      setAccount("");
      setSigner(null);
      setProvider(null);
      setStatus("Connect your wallet to begin.");
      return;
    }

    let cancelled = false;
    const activeConnector = connector;
    const activeAddress = address;

    async function syncWallet() {
      try {
        const walletProvider = (await activeConnector.getProvider()) as
          | Eip1193Provider
          | undefined;

        if (!walletProvider) {
          if (!cancelled) {
            setStatus("Wallet provider unavailable.");
          }
          return;
        }

        const browserProvider = new BrowserProvider(walletProvider);
        const nextSigner = await browserProvider.getSigner(activeAddress);

        if (cancelled) {
          return;
        }

        setProvider(browserProvider);
        setSigner(nextSigner);
        setAccount(activeAddress);

        if ((chain?.id ?? farmConfig.chainId) !== farmConfig.chainId) {
          setStatus(`Wrong network. Please switch to ${farmConfig.chainName}.`);
        } else {
          setStatus("Wallet connected.");
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : "Failed to initialize wallet.";
          setStatus(message);
        }
      }
    }

    void syncWallet();

    return () => {
      cancelled = true;
    };
  }, [address, chain?.id, connector, farmConfig.chainId, farmConfig.chainName, isConnected]);

  return {
    provider,
    signer,
    account,
    status,
    busy,
    walletLpBalance,
    walletTokenBalance,
    walletQuoteTokenBalance,
    stakedBalance,
    earnedRewards,
    rewardRate,
    periodFinish,
    allowance,
    tokenAllowanceToRouter,
    quoteTokenAllowanceToRouter,
    lpAllowanceToRouter,
    totalStaked,
    pairTokenReserve,
    pairQuoteReserve,
    liquidityTokenInput,
    liquidityQuoteInput,
    removeLiquidityInput,
    stakeInput,
    withdrawInput,
    hasApproval,
    hasLiquidityTokenApproval,
    hasLiquidityQuoteApproval,
    hasRemoveLiquidityApproval,
    setLiquidityTokenInput: handleLiquidityTokenInput,
    setLiquidityQuoteInput: handleLiquidityQuoteInput,
    setRemoveLiquidityInput,
    setStakeInput,
    setWithdrawInput,
    refreshData,
    approveTokenForRouter,
    approveQuoteTokenForRouter,
    approveLpForRouter,
    addLiquidity,
    removeLiquidity,
    approveLp,
    stakeLp,
    withdrawLp,
    claimRewards,
    exitFarm,
    fillMaxLiquidityToken,
    fillMaxLiquidityQuote,
    fillMaxRemoveLiquidity,
    fillMaxStake,
    fillMaxWithdraw,
  };
}
