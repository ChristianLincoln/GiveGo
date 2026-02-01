import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  ArrowLeft, 
  Check,
  Heart,
  ShieldCheck,
  Loader2
} from "lucide-react";

const COIN_OPTIONS = [
  { value: 50, label: "50p", popular: false },
  { value: 100, label: "£1", popular: true },
  { value: 200, label: "£2", popular: false },
  { value: 500, label: "£5", popular: false },
];

const QUANTITY_PRESETS = [10, 25, 50, 100];

export default function SponsorPurchase() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedValue, setSelectedValue] = useState(100);
  const [quantity, setQuantity] = useState(10);

  const totalAmount = selectedValue * quantity;
  const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const createCheckout = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/sponsor/checkout", {
        coinValue: selectedValue,
        quantity,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Purchase Successful",
          description: data.message,
        });
        navigate("/sponsor?success=true");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sponsor")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-display font-bold">Purchase Coins</h1>
            <p className="text-xs text-muted-foreground">Fund donations to charity</p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coin Value Selection */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Select Coin Value</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Each coin represents a donation amount when collected by a player.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COIN_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedValue(option.value)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedValue === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    data-testid={`button-value-${option.value}`}
                  >
                    {option.popular && (
                      <Badge className="absolute -top-2 -right-2 text-xs">Popular</Badge>
                    )}
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto mb-2">
                      <Coins className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <p className="font-display text-xl font-bold">{option.label}</p>
                    <p className="text-xs text-muted-foreground">per coin</p>
                    {selectedValue === option.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </Card>

            {/* Quantity Selection */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Select Quantity</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How many coins would you like to purchase?
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {QUANTITY_PRESETS.map((preset) => (
                  <Button
                    key={preset}
                    variant={quantity === preset ? "default" : "outline"}
                    onClick={() => setQuantity(preset)}
                    data-testid={`button-quantity-${preset}`}
                  >
                    {preset} coins
                  </Button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="custom-quantity" className="shrink-0">
                  Custom:
                </Label>
                <Input
                  id="custom-quantity"
                  type="number"
                  min={1}
                  max={1000}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24"
                  data-testid="input-custom-quantity"
                />
                <span className="text-muted-foreground">coins</span>
              </div>
            </Card>

            {/* How it works */}
            <Card className="p-6 bg-muted/50">
              <h3 className="font-semibold mb-4">How it works</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Purchase Coins</p>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely in escrow
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Coins are Placed</p>
                    <p className="text-sm text-muted-foreground">
                      When a player starts a session, your coins appear on their map
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shrink-0 text-primary-foreground font-bold text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Donation Released</p>
                    <p className="text-sm text-muted-foreground">
                      When collected, funds go to British Heart Foundation
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="p-6 space-y-6">
              <h3 className="font-semibold">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Coin value</span>
                  <span className="font-medium">{formatCurrency(selectedValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{quantity} coins</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-destructive" />
                <span>100% goes to British Heart Foundation</span>
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => createCheckout.mutate()}
                disabled={createCheckout.isPending}
                data-testid="button-checkout"
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Proceed to Checkout
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Sandbox Mode - No real payment required
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
