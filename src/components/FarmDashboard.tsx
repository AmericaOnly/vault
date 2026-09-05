import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDown, Gift, Lock, LockOpen } from "lucide-react";
import { LiquidityPanel } from "@/components/LiquidityPanel";
import { MetricCard } from "@/components/MetricCard";
import { ProgramInfoCard } from "@/components/ProgramInfoCard";
import { RemoveLiquidityPanel } from "@/components/RemoveLiquidityPanel";
import { StakePanel } from "@/components/StakePanel";
import { StatusAlert } from "@/components/StatusAlert";
import { VaultChecklist } from "@/components/VaultChecklist";
import { WalletActions } from "@/components/WalletActions";
import { useFarm } from "@/hooks/useFarm";
import { useFarmConfig } from "@/lib/farm-context";
import {
  formatDateTime,
  formatPerDay,
  formatUnitsSafe,
} from "@/lib/format";

export function FarmDashboard() {
  const farmConfig = useFarmConfig();
  const farm = useFarm();
  const totalUserLpBalance = farm.walletLpBalance + farm.stakedBalance;
  const vaultTokenAmount =
    farm.pairLiquiditySupply > 0n
      ? (totalUserLpBalance * farm.pairTokenReserve) / farm.pairLiquiditySupply
      : 0n;
  const vaultQuoteAmount =
    farm.pairLiquiditySupply > 0n
      ? (totalUserLpBalance * farm.pairQuoteReserve) / farm.pairLiquiditySupply
      : 0n;

  useEffect(() => {
    if (farm.liquidityAddedCount === 0) {
      return;
    }

    document.getElementById("stake-lp")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [farm.liquidityAddedCount]);

  return (
    <div className={`farm-dashboard-shell min-h-screen min-h-[calc(var(--app-height,1vh)*100)] overflow-x-hidden px-4 pb-6 pt-28 text-slate-100 sm:px-6 sm:pb-8 sm:pt-32 md:px-10 md:pb-10 ${farmConfig.theme.backgroundClassName}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[var(--farm-page-top-glow)]" />
      <div className="pointer-events-none absolute inset-x-0 top-24 h-px bg-[linear-gradient(90deg,transparent,var(--farm-grid-line-strong),transparent)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-32 h-64 w-64 rounded-full bg-[var(--farm-orb-left)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-80 h-72 w-72 rounded-full bg-[var(--farm-orb-right)] blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-4 sm:gap-6">
        <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
          <WalletActions
            busy={farm.busy}
            connected={Boolean(farm.account)}
            onRefresh={farm.refreshData}
          />
          <div className="grid gap-4">
            <VaultChecklist
              connected={Boolean(farm.account)}
              items={[
                {
                  label: `Approve ${farmConfig.tokenSymbol} Deposit for Vault`,
                  complete: farm.tokenAllowanceToRouter > 0n,
                },
                {
                  label: `Approve ${farmConfig.quoteTokenSymbol} Deposit for Vault`,
                  complete: farm.quoteTokenAllowanceToRouter > 0n,
                },
                {
                  label: `Place ${farmConfig.tokenSymbol}/${farmConfig.quoteTokenSymbol} into Vault`,
                  complete: farm.walletLpBalance > 0n || farm.stakedBalance > 0n,
                },
                {
                  label: "Seal the Vault",
                  complete: farm.hasApproval,
                },
                {
                  label: "Start Earning Rewards",
                  complete: farm.stakedBalance > 0n,
                },
              ]}
            />
            <ProgramInfoCard
              rewardRate={`${formatPerDay(farm.rewardRate, farmConfig.tokenDecimals)} ${farmConfig.tokenSymbol}/day`}
              totalStaked={`${formatUnitsSafe(farm.totalStaked, farmConfig.lpDecimals)} ${farmConfig.lpSymbol}`}
              programEnds={formatDateTime(farm.periodFinish)}
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            icon={farm.stakedBalance > 0n ? (
              <Lock className="h-5 w-5 text-emerald-400" aria-label="Funds staked in vault" />
            ) : (
              <LockOpen className="h-5 w-5 text-red-400" aria-label="LP tokens not staked" />
            )}
            title="In Your Vault"
            value={(
              <div className="grid gap-2">
                <div>
                  {formatUnitsSafe(vaultTokenAmount, farmConfig.tokenDecimals)}{" "}
                  <span className="text-base text-slate-300">{farmConfig.tokenSymbol}</span>
                </div>
                <div>
                  {formatUnitsSafe(vaultQuoteAmount, farmConfig.quoteTokenDecimals)}{" "}
                  <span className="text-base text-slate-300">{farmConfig.quoteTokenSymbol}</span>
                </div>
              </div>
            )}
            subtitle="Estimated from current pool reserves • Updates every 15 seconds"
            delay={0}
          />
          <MetricCard
            icon={<Gift className="h-5 w-5" />}
            title="Earned Rewards"
            value={formatUnitsSafe(farm.earnedRewards, farmConfig.tokenDecimals)}
            subtitle={`${farmConfig.tokenSymbol} balance updates every 15 seconds`}
            delay={0.05}
          />
        </div>

        <div id="add-liquidity">
          <LiquidityPanel
            tokenSymbol={farmConfig.tokenSymbol}
            quoteTokenSymbol={farmConfig.quoteTokenSymbol}
            tokenBalance={formatUnitsSafe(farm.walletTokenBalance, farmConfig.tokenDecimals)}
            quoteTokenBalance={formatUnitsSafe(
              farm.walletQuoteTokenBalance,
              farmConfig.quoteTokenDecimals,
            )}
            tokenValue={farm.liquidityTokenInput}
            quoteValue={farm.liquidityQuoteInput}
            hasTokenApproval={farm.hasLiquidityTokenApproval}
            hasQuoteApproval={farm.hasLiquidityQuoteApproval}
            busy={farm.busy}
            connected={Boolean(farm.account)}
            poolAddress={farmConfig.v2PoolAddress}
            onTokenValueChange={farm.setLiquidityTokenInput}
            onApproveToken={farm.approveTokenForRouter}
            onApproveQuoteToken={farm.approveQuoteTokenForRouter}
            onAddLiquidity={farm.addLiquidity}
          />
        </div>

        <div id="stake-lp" className="scroll-mt-28">
          {farm.liquidityAddedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center justify-center gap-2 rounded-[24px] border border-blue-200/25 bg-blue-300/10 px-4 py-4 text-center text-sm font-semibold text-blue-50"
            >
              <ArrowDown className="h-4 w-4 shrink-0" />
              Liquidity added successfully. Please continue below to stake your LP tokens.
            </motion.div>
          )}
          <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <StakePanel
              title="Part 2 - Seal Vault and Start Earning"
              primaryActionLabel="Step 2. Start Earning Rewards"
              secondaryActionLabel={farm.hasApproval ? "Step 1. Vault Sealed" : "Step 1. Seal the Vault"}
              onPrimaryAction={farm.stakeLp}
              onSecondaryAction={farm.approveLp}
              primaryDisabled={farm.busy || !farm.account}
              secondaryDisabled={farm.busy || !farm.account || farm.hasApproval}
              secondaryVariant={farm.hasApproval ? "secondary" : "default"}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          >
            <StakePanel
              title="Withdraw / Claim"
              primaryActionLabel={`Claim ${farmConfig.tokenSymbol} Rewards only`}
              secondaryActionLabel="Withdraw Entire Vault Step 1"
              onPrimaryAction={farm.claimRewards}
              onSecondaryAction={farm.withdrawLp}
              primaryDisabled={farm.busy || !farm.account}
              secondaryDisabled={farm.busy || !farm.account}
              primaryVariant="default"
              secondaryVariant="secondary"
            />
          </motion.div>
          </div>
        </div>

        <StatusAlert status={farm.status} />

        <RemoveLiquidityPanel
          busy={farm.busy}
          connected={Boolean(farm.account)}
          hasApproval={farm.hasRemoveLiquidityApproval}
          onApprove={farm.approveLpForRouter}
          onRemove={farm.removeLiquidity}
        />

        <div className="pb-2 pt-4 text-center text-xs text-slate-300/70">
          Copyright BuyTAOT.com 2026
        </div>
      </div>
    </div>
  );
}
