import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, TrendingUp, DollarSign } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CurrencyConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oldCurrency: string;
  newCurrency: string;
  itemCount: number;
  onConfirm: (convertPrices: boolean) => void;
}

export function CurrencyConversionDialog({
  open,
  onOpenChange,
  oldCurrency,
  newCurrency,
  itemCount,
  onConfirm,
}: CurrencyConversionDialogProps) {
  const [conversionChoice, setConversionChoice] = useState<"convert" | "keep">("convert");

  const handleConfirm = () => {
    onConfirm(conversionChoice === "convert");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Currency Change Detected
          </DialogTitle>
          <DialogDescription>
            You're changing the currency from <span className="font-semibold">{oldCurrency}</span> to{" "}
            <span className="font-semibold">{newCurrency}</span>. This affects <span className="font-semibold">{itemCount}</span> menu item{itemCount !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Choose how to handle the price values for existing menu items.
          </AlertDescription>
        </Alert>

        <RadioGroup
          value={conversionChoice}
          onValueChange={(value) => setConversionChoice(value as "convert" | "keep")}
          className="space-y-4 my-4"
        >
          <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
            <RadioGroupItem value="convert" id="convert" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="convert" className="cursor-pointer font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Convert prices automatically
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Prices will be converted using current exchange rates. For example, 1,000 {oldCurrency} might become 1.20 {newCurrency}.
              </p>
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>Example:</strong> 5,000 {oldCurrency} → ~6 {newCurrency} (approximate)
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent transition-colors">
            <RadioGroupItem value="keep" id="keep" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="keep" className="cursor-pointer font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-orange-500" />
                Keep current amounts as-is
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Only the currency symbol changes. Numbers stay the same. For example, 1,000 {oldCurrency} becomes 1,000 {newCurrency}.
              </p>
              <div className="mt-2 p-2 bg-muted rounded text-xs">
                <strong>Example:</strong> 5,000 {oldCurrency} → 5,000 {newCurrency} (same number)
              </div>
            </div>
          </div>
        </RadioGroup>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Update Currency
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
