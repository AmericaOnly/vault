import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RemoveLiquidityPanelProps = {
  busy: boolean;
  connected: boolean;
  hasApproval: boolean;
  onWithdraw: () => Promise<void>;
  onApprove: () => Promise<void>;
  onRemove: () => Promise<void>;
};

export function RemoveLiquidityPanel({
  busy,
  connected,
  hasApproval,
  onWithdraw,
  onApprove,
  onRemove,
}: RemoveLiquidityPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Withdraw All Your Assets from the Vault
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Button
              onClick={onWithdraw}
              disabled={busy || !connected}
              variant="secondary"
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              Withdraw Entire Vault Step 1
            </Button>
            <Button
              onClick={onApprove}
              disabled={busy || !connected || hasApproval}
              variant={hasApproval ? "secondary" : "default"}
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              {hasApproval ? "Withdraw Entire Vault Step 2 Complete" : "Withdraw Entire Vault Step 2"}
            </Button>
            <Button
              onClick={onRemove}
              disabled={busy || !connected || !hasApproval}
              variant="outline"
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              Withdraw Entire Vault Step 3
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
