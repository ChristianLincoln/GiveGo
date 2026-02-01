import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Coins, 
  Heart, 
  Trophy, 
  MapPin, 
  Play,
  ChevronUp,
  ChevronDown,
  Minus
} from "lucide-react";
import type { PlayerProfile, PlayerSession } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalCoinsCollected: number;
  totalDonated: number;
  isCurrentUser: boolean;
}

interface PlayerStats {
  profile: PlayerProfile;
  leaderboard: LeaderboardEntry[];
  history: { date: string; coins: number; donated: number }[];
  activeSession: PlayerSession | null;
  coinsAvailable: boolean;
}

export default function PlayerDashboard() {
  const { data: stats, isLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/player/stats"],
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

  const formatCurrency = (pence: number) => {
    return `£${(pence / 100).toFixed(2)}`;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Coins Collected</p>
              <p className="font-display text-2xl font-bold">{stats.profile.totalCoinsCollected}</p>
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
              <p className="font-display text-2xl font-bold">{formatCurrency(stats.profile.totalDonated)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Global Rank</p>
              <p className="font-display text-2xl font-bold">
                #{stats.leaderboard.find((e) => e.isCurrentUser)?.rank || "-"}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground truncate">Status</p>
              <p className="font-display text-lg font-bold truncate">
                {stats.activeSession ? "In Session" : "Ready"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Progress Chart */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Your Progress</h3>
          {stats.history.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.history}>
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis yAxisId="coins" orientation="left" tick={{ fontSize: 12 }} />
                  <YAxis 
                    yAxisId="donated" 
                    orientation="right" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `£${(value / 100).toFixed(0)}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-popover-border rounded-lg p-3 shadow-lg">
                            <p className="text-sm font-medium">{payload[0]?.payload?.date}</p>
                            <p className="text-sm text-primary">
                              Coins: {payload[0]?.value}
                            </p>
                            <p className="text-sm text-destructive">
                              Donated: £{((payload[1]?.value as number) / 100).toFixed(2)}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    yAxisId="coins"
                    type="monotone"
                    dataKey="coins"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="donated"
                    type="monotone"
                    dataKey="donated"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Start collecting to see your progress</p>
              </div>
            </div>
          )}
        </Card>

        {/* Leaderboard */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Leaderboard</h3>
          <div className="space-y-2">
            {stats.leaderboard.map((entry, index) => {
              const currentUserIndex = stats.leaderboard.findIndex((e) => e.isCurrentUser);
              const showSeparatorBefore = index === currentUserIndex && currentUserIndex > 0;
              const showSeparatorAfter = index === currentUserIndex && currentUserIndex < stats.leaderboard.length - 1;

              return (
                <div key={entry.rank}>
                  {showSeparatorBefore && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="h-px flex-1 bg-border" />
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div
                    className={`flex items-center gap-3 p-2 rounded-lg ${
                      entry.isCurrentUser
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                      {entry.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.username}
                        {entry.isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.totalCoinsCollected} coins · {formatCurrency(entry.totalDonated)}
                      </p>
                    </div>
                  </div>
                  {showSeparatorAfter && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="h-px flex-1 bg-border" />
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Start Session CTA */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-destructive/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-display text-xl font-bold mb-1">Ready to Help Hearts?</h3>
              <p className="text-muted-foreground">
                {stats.coinsAvailable
                  ? "Heart coins are waiting! Each one you collect helps the British Heart Foundation."
                  : "No coins available right now. Please check back later."}
              </p>
            </div>
          </div>
          {stats.activeSession ? (
            <Button asChild size="lg" className="gap-2" data-testid="button-continue-session">
              <Link href="/player/session">
                <MapPin className="w-5 h-5" />
                Continue Session
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              className="gap-2"
              disabled={!stats.coinsAvailable}
              asChild
              data-testid="button-start-collecting"
            >
              <Link href="/player/session">
                <Play className="w-5 h-5" />
                Start Collecting
              </Link>
            </Button>
          )}
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
