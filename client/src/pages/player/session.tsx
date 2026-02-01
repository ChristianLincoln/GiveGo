import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/use-geolocation";
import { calculateDistance } from "@/lib/geolocation";
import { apiRequest } from "@/lib/queryClient";
import { 
  Coins, 
  MapPin, 
  Navigation, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { CoinMap } from "@/components/CoinMap";
import type { PlayerSession, GeneratedCoin } from "@shared/schema";

interface SessionData {
  session: PlayerSession;
  coins: GeneratedCoin[];
  message?: string;
}

const COLLECTION_RADIUS_METERS = 10;

export default function PlayerSession() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [collectingCoinId, setCollectingCoinId] = useState<string | null>(null);
  const [sessionStartAttempted, setSessionStartAttempted] = useState(false);
  const [sessionStartError, setSessionStartError] = useState<string | null>(null);

  const { position, error: geoError, isLoading: geoLoading, isSupported } = useGeolocation({
    watch: true,
    enableHighAccuracy: true,
  });

  const { data: sessionData, isLoading: sessionLoading } = useQuery<SessionData>({
    queryKey: ["/api/player/session/active"],
    refetchInterval: 5000, // Poll every 5 seconds for coin updates
  });

  const startSession = useMutation({
    mutationFn: async () => {
      if (!position) throw new Error("Location required");
      const response = await apiRequest("POST", "/api/player/session/start", {
        latitude: position.latitude,
        longitude: position.longitude,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/session/active"] });
      setSessionStartAttempted(true);
      if (data.message) {
        toast({ title: "Session started", description: data.message });
      } else {
        toast({ title: "Session started!", description: "Find and collect coins near you." });
      }
    },
    onError: (error: Error) => {
      setSessionStartAttempted(true);
      setSessionStartError(error.message);
      if (error.message.includes("No coins available")) {
        toast({ 
          title: "No coins available right now", 
          description: "Sponsors haven't placed any coins yet. Check back later!", 
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const collectCoin = useMutation({
    mutationFn: async (coinId: string) => {
      if (!position) throw new Error("Location required");
      const response = await apiRequest("POST", "/api/player/coin/collect", {
        coinId,
        latitude: position.latitude,
        longitude: position.longitude,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/stats"] });
      toast({
        title: "Coin collected!",
        description: `£${(data.coinValue / 100).toFixed(2)} donated to British Heart Foundation!`,
      });
      setCollectingCoinId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Collection failed", description: error.message, variant: "destructive" });
      setCollectingCoinId(null);
    },
  });

  const endSession = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/player/session/end", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/player/session/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/player/stats"] });
      toast({ title: "Session ended", description: "Great job! Check your stats." });
      navigate("/player");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Auto-start session if none exists (only once)
  useEffect(() => {
    if (!sessionLoading && !sessionData?.session && position && !startSession.isPending && !sessionStartAttempted) {
      setSessionStartAttempted(true);
      startSession.mutate();
    }
  }, [sessionLoading, sessionData, position, startSession, sessionStartAttempted]);

  const handleCollectCoin = useCallback((coin: GeneratedCoin) => {
    if (!position) return;
    
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      coin.latitude,
      coin.longitude
    );

    if (distance > COLLECTION_RADIUS_METERS) {
      toast({
        title: "Too far away",
        description: `Get within ${COLLECTION_RADIUS_METERS}m to collect (currently ${Math.round(distance)}m away)`,
        variant: "destructive",
      });
      return;
    }

    setCollectingCoinId(coin.id);
    collectCoin.mutate(coin.id);
  }, [position, collectCoin, toast]);

  // Handle geolocation errors
  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Location Not Supported</h2>
          <p className="text-muted-foreground mb-6">
            Give Go requires location services to function. Please use a device that supports GPS.
          </p>
          <Button onClick={() => navigate("/player")} variant="outline">
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  if (geoError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Location Access Required</h2>
          <p className="text-muted-foreground mb-6">{geoError.message}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => navigate("/player")} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show error state if session start failed
  if (sessionStartError && !sessionData?.session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Session Couldn't Start</h2>
          <p className="text-muted-foreground mb-6">
            {sessionStartError.includes("No coins") || sessionStartError.includes("coins")
              ? "No coins are available right now. Sponsors haven't placed any coins yet."
              : sessionStartError}
          </p>
          <div className="space-y-2">
            <Button onClick={() => {
              setSessionStartAttempted(false);
              setSessionStartError(null);
            }} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => navigate("/player")} variant="outline" className="w-full">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (geoLoading || sessionLoading || startSession.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
          <h2 className="font-display text-xl font-bold mb-2">
            {geoLoading ? "Getting your location..." : "Starting session..."}
          </h2>
          <p className="text-muted-foreground">
            {geoLoading
              ? "Please allow location access when prompted."
              : "Finding coins near you..."}
          </p>
        </Card>
      </div>
    );
  }

  const session = sessionData?.session;
  const coins = sessionData?.coins || [];
  const activeCoinCount = coins.filter((c) => c.status === "placed").length;
  const collectedCount = session?.coinsCollected || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/player")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="font-display font-bold">Active Session</h1>
            <p className="text-xs text-muted-foreground">
              {activeCoinCount} coins remaining
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => endSession.mutate()}
            disabled={endSession.isPending}
            data-testid="button-end-session"
          >
            {endSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "End"}
          </Button>
        </div>
      </div>

      {/* Session Stats */}
      <div className="p-4 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Coins className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-display text-2xl font-bold">{collectedCount}</p>
            <p className="text-xs text-muted-foreground">Collected</p>
          </Card>
          <Card className="p-4 text-center">
            <MapPin className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="font-display text-2xl font-bold">{activeCoinCount}</p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </Card>
        </div>

        {/* Progress */}
        {coins.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Session Progress</span>
              <span className="text-sm text-muted-foreground">
                {collectedCount}/{coins.length} coins
              </span>
            </div>
            <Progress value={(collectedCount / coins.length) * 100} />
          </div>
        )}

        {/* Map Placeholder / Coin List */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Navigation className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Nearby Coins</h3>
          </div>

          {/* Interactive Map with User Location and Coins */}
          {position && (
            <CoinMap
              userPosition={{ latitude: position.latitude, longitude: position.longitude }}
              coins={coins}
              onCoinClick={(coinId) => {
                const coin = coins.find((c) => c.id === coinId);
                if (coin) handleCollectCoin(coin);
              }}
              collectionRadius={COLLECTION_RADIUS_METERS}
            />
          )}

          {/* Coin List */}
          <div className="space-y-3">
            {coins
              .filter((c) => c.status === "placed")
              .map((coin) => {
                const distance = position
                  ? calculateDistance(
                      position.latitude,
                      position.longitude,
                      coin.latitude,
                      coin.longitude
                    )
                  : 0;
                const canCollect = distance <= COLLECTION_RADIUS_METERS;
                const isCollecting = collectingCoinId === coin.id;
                const expiresIn = new Date(coin.expiresAt).getTime() - Date.now();
                const expiresMinutes = Math.max(0, Math.floor(expiresIn / 60000));

                return (
                  <div
                    key={coin.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      canCollect ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          canCollect ? "bg-primary" : "bg-accent"
                        }`}
                      >
                        <Coins
                          className={`w-5 h-5 ${
                            canCollect ? "text-primary-foreground" : "text-accent-foreground"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">£{(coin.coinValue / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(distance)}m away · Expires in {expiresMinutes}m
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canCollect || isCollecting}
                      onClick={() => handleCollectCoin(coin)}
                      data-testid={`button-collect-${coin.id}`}
                    >
                      {isCollecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : canCollect ? (
                        "Collect"
                      ) : (
                        "Too far"
                      )}
                    </Button>
                  </div>
                );
              })}

            {activeCoinCount === 0 && coins.length > 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="font-medium">All coins collected!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Great job! You've collected all available coins.
                </p>
                <Button onClick={() => endSession.mutate()} data-testid="button-finish-session">
                  Finish Session
                </Button>
              </div>
            )}

            {activeCoinCount === 0 && coins.length === 0 && (
              <div className="text-center py-8">
                <Coins className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">No coins available right now</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Sponsors haven't placed any coins in your area yet. Check back later or try a different location!
                </p>
                <Button onClick={() => endSession.mutate()} variant="outline" data-testid="button-end-empty-session">
                  End Session
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Location Info */}
        {position && (
          <div className="text-center text-xs text-muted-foreground">
            <p>
              Location: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
            </p>
            <p>Accuracy: {Math.round(position.accuracy)}m</p>
          </div>
        )}
      </div>
    </div>
  );
}
