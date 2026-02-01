import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  Heart, 
  Package, 
  MapPin, 
  Plus,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import type { SponsorProfile, CoinInventory, GeneratedCoin } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface SponsorStats {
  profile: SponsorProfile;
  inventory: CoinInventory[];
  recentCoins: GeneratedCoin[];
  stats: {
    totalInInventory: number;
    totalPlaced: number;
    totalCollected: number;
    totalExpired: number;
  };
}

export default function SponsorDashboard() {
  const { data: stats, isLoading } = useQuery<SponsorStats>({
    queryKey: ["/api/sponsor/stats"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Failed to load dashboard</p>
      </div>
    );
  }

  const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const pieData = [
    { name: "In Inventory", value: stats.stats.totalInInventory, color: "hsl(var(--primary))" },
    { name: "Active", value: stats.stats.totalPlaced, color: "hsl(var(--accent))" },
    { name: "Collected", value: stats.stats.totalCollected, color: "hsl(var(--chart-3))" },
    { name: "Expired", value: stats.stats.totalExpired, color: "hsl(var(--muted))" },
  ].filter((d) => d.value > 0);

  const totalCoins = stats.profile.totalCoinsPurchased;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">In Inventory</p>
              <p className="font-display text-2xl font-bold">{stats.stats.totalInInventory}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Active</p>
              <p className="font-display text-2xl font-bold">{stats.stats.totalPlaced}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-chart-3/20 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-chart-3" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Collected</p>
              <p className="font-display text-2xl font-bold">{stats.stats.totalCollected}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Total Donated</p>
              <p className="font-display text-2xl font-bold">
                {formatCurrency(stats.profile.totalDonated)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coin Distribution Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Coin Distribution</h3>
          {totalCoins > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {data.value} coins ({((data.value / totalCoins) * 100).toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Purchase coins to see your distribution</p>
              </div>
            </div>
          )}
        </Card>

        {/* Inventory Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Inventory</h3>
            <Button size="sm" asChild data-testid="button-buy-coins">
              <Link href="/sponsor/purchase">
                <Plus className="w-4 h-4 mr-1" />
                Buy Coins
              </Link>
            </Button>
          </div>
          
          {stats.inventory.length > 0 ? (
            <div className="space-y-3">
              {stats.inventory.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center">
                      <Coins className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{formatCurrency(inv.coinValue)} coins</p>
                      <p className="text-xs text-muted-foreground">Per coin value</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{inv.quantity} available</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No coins in inventory</p>
              <p className="text-xs">Purchase coins to get started</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Coin Activity</h3>
        {stats.recentCoins.length > 0 ? (
          <div className="space-y-3">
            {stats.recentCoins.slice(0, 5).map((coin) => (
              <div
                key={coin.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      coin.status === "collected"
                        ? "bg-chart-3/20"
                        : coin.status === "placed"
                        ? "bg-accent/20"
                        : "bg-muted"
                    }`}
                  >
                    {coin.status === "collected" ? (
                      <CheckCircle className="w-5 h-5 text-chart-3" />
                    ) : coin.status === "placed" ? (
                      <MapPin className="w-5 h-5 text-accent" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{formatCurrency(coin.coinValue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {coin.status === "collected"
                        ? `Collected ${new Date(coin.collectedAt!).toLocaleDateString()}`
                        : coin.status === "placed"
                        ? `Active - expires ${new Date(coin.expiresAt).toLocaleTimeString()}`
                        : "Expired - returned to inventory"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    coin.status === "collected"
                      ? "default"
                      : coin.status === "placed"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {coin.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No coin activity yet</p>
          </div>
        )}
      </Card>

      {/* CTA */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-display text-xl font-bold mb-1">Help Hearts Today</h3>
              <p className="text-muted-foreground">
                Every coin you purchase helps fund life-saving research at the British Heart Foundation.
              </p>
            </div>
          </div>
          <Button size="lg" asChild className="gap-2" data-testid="button-purchase-coins">
            <Link href="/sponsor/purchase">
              <Heart className="w-5 h-5" />
              Fund Heart Research
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <Skeleton className="h-64" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-64" />
        </Card>
      </div>
    </div>
  );
}
