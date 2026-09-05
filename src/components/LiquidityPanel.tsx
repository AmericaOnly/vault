import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type LiquidityPanelProps = {
  tokenSymbol: string;
  quoteTokenSymbol: string;
  tokenBalance: string;
  quoteTokenBalance: string;
  tokenValue: string;
  quoteValue: string;
  hasTokenApproval: boolean;
  hasQuoteApproval: boolean;
  hasInsufficientQuoteBalance: boolean;
  busy: boolean;
  connected: boolean;
  poolAddress: string;
  onTokenValueChange: (value: string) => void;
  onApproveToken: () => Promise<void>;
  onApproveQuoteToken: () => Promise<void>;
  onAddLiquidity: () => Promise<void>;
};

export function LiquidityPanel({
  tokenSymbol,
  quoteTokenSymbol,
  tokenBalance,
  quoteTokenBalance,
  tokenValue,
  quoteValue,
  hasTokenApproval,
  hasQuoteApproval,
  hasInsufficientQuoteBalance,
  busy,
  connected,
  poolAddress,
  onTokenValueChange,
  onApproveToken,
  onApproveQuoteToken,
  onAddLiquidity,
}: LiquidityPanelProps) {
  const [hasEditedTokenAmount, setHasEditedTokenAmount] = useState(false);
  const [showInsufficientQuoteDialog, setShowInsufficientQuoteDialog] = useState(false);

  useEffect(() => {
    if (!hasEditedTokenAmount) {
      return;
    }

    setShowInsufficientQuoteDialog(hasInsufficientQuoteBalance);
  }, [hasEditedTokenAmount, hasInsufficientQuoteBalance]);

  function handleTokenValueChange(value: string) {
    setHasEditedTokenAmount(true);
    onTokenValueChange(value);
  }

  return (
    <motion.div id="add-liquidity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {showInsufficientQuoteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="insufficient-usdc-title"
        >
          <Card className="w-full max-w-md border-red-300/25">
            <CardHeader>
              <CardTitle id="insufficient-usdc-title" className="text-xl">
                Not Enough {quoteTokenSymbol}
              </CardTitle>
              <p className="text-sm leading-6 text-slate-200">
                This {tokenSymbol} amount requires approximately {quoteValue} {quoteTokenSymbol},
                but your wallet has {quoteTokenBalance} {quoteTokenSymbol}. Enter a smaller {tokenSymbol} amount.
              </p>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => setShowInsufficientQuoteDialog(false)}>
                Got It
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-blue-200/8 blur-3xl" />
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Part 1 - Secure the Bag and Open the Vault</CardTitle>
          <p className="break-all text-xs text-slate-300">Pool: {poolAddress}</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 rounded-[24px] border border-blue-100/12 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-1 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <label>{tokenSymbol} amount</label>
              <span>Wallet: {tokenBalance} {tokenSymbol}</span>
            </div>
            <div className="grid gap-2">
              <Input value={tokenValue} onChange={(event) => handleTokenValueChange(event.target.value)} placeholder="0.0" />
            </div>
          </div>

          <div className="grid gap-2 rounded-[24px] border border-blue-100/12 bg-white/[0.03] p-4">
            <div className="flex flex-col gap-1 text-sm text-slate-200 sm:flex-row sm:items-center sm:justify-between">
              <label>Estimated {quoteTokenSymbol} required</label>
              <span>Wallet: {quoteTokenBalance} {quoteTokenSymbol}</span>
            </div>
            <div className="rounded-xl border border-blue-100/10 bg-slate-950/35 px-3 py-2 text-base text-slate-100">
              {quoteValue || "Enter a TAOT amount above"}
            </div>
            <p className="text-xs text-slate-300/75">
              Automatically calculated from the pool&apos;s current TAOT/{quoteTokenSymbol} ratio.
            </p>
          </div>

          <div className="grid gap-2 rounded-[24px] border border-blue-100/12 bg-white/[0.03] p-4 sm:grid-cols-2 lg:grid-cols-3">
            <Button
              onClick={onApproveToken}
              disabled={busy || !connected || hasTokenApproval}
              variant={hasTokenApproval ? "secondary" : "default"}
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              {hasTokenApproval ? (
                <>
                  <strong>Step 1.</strong>&nbsp;{tokenSymbol} Deposit Approved
                </>
              ) : (
                <>
                  <strong>Step 1.</strong>&nbsp;Approve {tokenSymbol} Deposit for Vault
                </>
              )}
            </Button>
            <Button
              onClick={onApproveQuoteToken}
              disabled={busy || !connected || hasQuoteApproval}
              variant={hasQuoteApproval ? "secondary" : "default"}
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              {hasQuoteApproval ? (
                <>
                  <strong>Step 2.</strong>&nbsp;{quoteTokenSymbol} Deposit Approved
                </>
              ) : (
                <>
                  <strong>Step 2.</strong>&nbsp;Approve {quoteTokenSymbol} Deposit for Vault
                </>
              )}
            </Button>
            <Button
              onClick={onAddLiquidity}
              disabled={busy || !connected || !hasTokenApproval || !hasQuoteApproval}
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center sm:col-span-2 lg:col-span-1"
            >
              <strong>Step 3.</strong>&nbsp;Place {tokenSymbol}/{quoteTokenSymbol} into Vault
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
