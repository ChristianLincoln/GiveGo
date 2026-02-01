import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SponsorMap } from "@/components/SponsorMap";
import { 
  MapPin, 
  CheckCircle, 
  Clock, 
  Package,
  Heart
} from "lucide-react";
import type { GeneratedCoin } from "@shared/schema";

type CoinFilter = "all" | "placed" | "collected" | "expired";

export default function SponsorTracking() {
  const [filter, setFilter] = useState<CoinFilter>("all");

  const { data: coins, isLoading } = useQuery<GeneratedCoin[]>({
    queryKey: ["/api/sponsor/coins"],
    refetchInterval: 10000, // Poll for updates
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
    );
  }

  const allCoins = coins || [];
  const filteredCoins = filter === "all" 
    ? allCoins 
    : allCoins.filter((c) => c.status === filter);

  const counts = {
    all: allCoins.length,
    placed: allCoins.filter((c) => c.status === "placed").length,
    collected: allCoins.filter((c) => c.status === "collected").length,
    expired: allCoins.filter((c) => c.status === "expired").length,
  };

  const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "placed":
        return <MapPin className="w-4 h-4 text-accent" />;
      case "collected":
        return <CheckCircle className="w-4 h-4 text-chart-3" />;
      case "expired":
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Package className="w-4 h-4 text-primary" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "placed":
        return <Badge variant="secondary">Active</Badge>;
      case "collected":
        return <Badge>Collected</Badge>;
      case "expired":
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="secondary">Available</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Heart Tracking</h1>
          <p className="text-muted-foreground text-sm">Track your donations to the British Heart Foundation</p>
        </div>
      </div>

      {/* Interactive Map */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium">Live Heart Map</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Collected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Expired</span>
            </div>
          </div>
        </div>
        {filteredCoins.length > 0 ? (
          <SponsorMap coins={filteredCoins} />
        ) : (
          <div className="bg-muted aspect-video relative flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hearts to display</p>
              <p className="text-xs">Purchase hearts and they'll appear here when placed</p>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as CoinFilter)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="all" data-testid="tab-all">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="placed" data-testid="tab-placed">
            Active ({counts.placed})
          </TabsTrigger>
          <TabsTrigger value="collected" data-testid="tab-collected">
            Collected ({counts.collected})
          </TabsTrigger>
          <TabsTrigger value="expired" data-testid="tab-expired">
            Expired ({counts.expired})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {filteredCoins.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">No hearts found</h3>
              <p className="text-muted-foreground text-sm">
                {filter === "all"
                  ? "You haven't placed any hearts yet."
                  : `No ${filter} hearts at the moment.`}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredCoins.map((coin) => (
                <Card key={coin.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          coin.status === "placed"
                            ? "bg-accent/20"
                            : coin.status === "collected"
                            ? "bg-chart-3/20"
                            : "bg-muted"
                        }`}
                      >
                        {getStatusIcon(coin.status)}
                      </div>
                      <div>
                        <p className="font-medium">{formatCurrency(coin.coinValue)}</p>
                        <p className="text-xs text-muted-foreground">
                          {coin.status === "placed" && (
                            <>Expires: {new Date(coin.expiresAt).toLocaleString()}</>
                          )}
                          {coin.status === "collected" && coin.collectedAt && (
                            <>Collected: {new Date(coin.collectedAt).toLocaleString()}</>
                          )}
                          {coin.status === "expired" && (
                            <>Expired: {new Date(coin.expiresAt).toLocaleString()}</>
                          )}
                          {coin.status === "available" && (
                            <>Available for placement</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(coin.status)}
                    </div>
                  </div>
                  {coin.status === "placed" && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Location: {coin.latitude.toFixed(4)}, {coin.longitude.toFixed(4)}
                      </p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
