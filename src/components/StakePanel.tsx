import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type StakePanelProps = {
  title: string;
  label?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  onMax?: () => void;
  primaryActionLabel: string;
  secondaryActionLabel?: string;
  onPrimaryAction: () => Promise<void>;
  onSecondaryAction?: () => Promise<void>;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
  primaryVariant?: "default" | "secondary" | "outline";
  secondaryVariant?: "default" | "secondary" | "outline";
};

export function StakePanel({
  title,
  label,
  value,
  onValueChange,
  onMax,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  primaryDisabled,
  secondaryDisabled,
  primaryVariant = "default",
  secondaryVariant = "secondary",
}: StakePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {label && value !== undefined && onValueChange ? (
          <div className="grid gap-2">
            <label className="text-sm text-slate-200">{label}</label>
            <div className={onMax ? "grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]" : "grid gap-2"}>
              <Input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder="0.0" />
            {onMax ? (
              <Button variant="secondary" onClick={onMax} className="w-full sm:w-auto">
                Max
              </Button>
            ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2">
          {secondaryActionLabel && onSecondaryAction ? (
            <Button
              onClick={onSecondaryAction}
              disabled={secondaryDisabled}
              variant={secondaryVariant}
              className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
            >
              {secondaryActionLabel}
            </Button>
          ) : null}
          <Button
            onClick={onPrimaryAction}
            disabled={primaryDisabled}
            variant={primaryVariant}
            className="h-auto min-h-11 w-full whitespace-normal py-3 text-center"
          >
            {primaryActionLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
