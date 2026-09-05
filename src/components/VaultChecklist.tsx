import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChecklistItem = {
  label: string;
  complete: boolean;
};

type VaultChecklistProps = {
  connected: boolean;
  items: ChecklistItem[];
};

export function VaultChecklist({ connected, items }: VaultChecklistProps) {
  const completedCount = items.filter((item) => item.complete).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Vault Checklist</CardTitle>
          <span className="rounded-full border border-blue-100/15 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-200">
            {completedCount}/{items.length}
          </span>
        </div>
        <p className="text-xs text-slate-300/80">
          Complete every step to begin earning rewards.
        </p>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-2.5">
          {items.map((item, index) => (
            <li
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-blue-100/10 bg-white/[0.025] px-3 py-2.5 text-sm"
            >
              {item.complete ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-label="Complete" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-400" aria-label="Not complete" />
              )}
              <span className={item.complete ? "text-slate-100" : "text-slate-300"}>
                {index + 1}. {item.label}
              </span>
            </li>
          ))}
        </ol>
        {!connected && (
          <p className="mt-3 text-xs text-amber-200/90">
            Connect your wallet to check your progress.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
