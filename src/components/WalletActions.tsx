import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WalletConnectTrigger } from "@/components/WalletConnectTrigger";

type WalletActionsProps = {
  busy: boolean;
  connected: boolean;
  onRefresh: () => Promise<void>;
};

export function WalletActions({
  busy,
  connected,
  onRefresh,
}: WalletActionsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="relative overflow-hidden before:pointer-events-none before:absolute before:inset-[1px] before:rounded-[26px] before:border before:border-white/5 before:content-['']">
        <div className="pointer-events-none absolute inset-0 bg-[var(--farm-card-sheen)]" />
        <div className="pointer-events-none absolute -left-12 top-8 h-40 w-40 rounded-full bg-[var(--farm-orb-left)] blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-[var(--farm-orb-right)] blur-3xl" />
        <CardContent className="relative grid gap-3 p-6 sm:flex sm:flex-wrap">
          <WalletConnectTrigger />
          <Button
            onClick={onRefresh}
            disabled={busy || !connected}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
