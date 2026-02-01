import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Heart } from "lucide-react";
import type { CollectionHistory } from "@shared/schema";

interface HistoryResponse {
  history: (CollectionHistory & { sessionDate: string })[];
  totalCoins: number;
  totalDonated: number;
}

export default function PlayerHistory() {
  const { data, isLoading } = useQuery<HistoryResponse>({
    queryKey: ["/api/player/history"],
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16" />
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (pence: number) => `£${(pence / 100).toFixed(2)}`;
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group history by date
  const groupedHistory = (data?.history || []).reduce((acc, item) => {
    const date = new Date(item.collectedAt).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, (CollectionHistory & { sessionDate: string })[]>);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold mb-2">Collection History</h1>
        <p className="text-muted-foreground">
          Your heart collection journey
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="font-display text-xl font-bold">{data?.totalCoins || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Donated</p>
              <p className="font-display text-xl font-bold">
                {formatCurrency(data?.totalDonated || 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* History List */}
      {Object.keys(groupedHistory).length === 0 ? (
        <Card className="p-8 text-center">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No collections yet</h3>
          <p className="text-muted-foreground">
            Start a session to collect hearts and make donations!
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-muted-foreground">{date}</h3>
              </div>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium">Heart Collected</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.collectedAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {formatCurrency(item.coinValue)}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
