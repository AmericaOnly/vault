import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarmConfig } from "@/lib/farm-context";

type RemoveLiquidityPanelProps = {
  busy: boolean;
  connected: boolean;
  hasApproval: boolean;
  onApprove: () => Promise<void>;
  onRemove: () => Promise<void>;
};

export function RemoveLiquidityPanel({
  busy,
  connected,
  hasApproval,
  onApprove,
  onRemove,
}: RemoveLiquidityPanelProps) {
  const farmConfig = useFarmConfig();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Claim Initial {farmConfig.quoteTokenSymbol}/{farmConfig.tokenSymbol}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
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
