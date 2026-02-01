import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { Loader2 } from "lucide-react";

// Pages
import LandingPage from "@/pages/landing";
import RoleSelect from "@/pages/role-select";
import PlayerDashboard from "@/pages/player/dashboard";
import PlayerSession from "@/pages/player/session";
import PlayerHistory from "@/pages/player/history";
import SponsorDashboard from "@/pages/sponsor/dashboard";
import SponsorPurchase from "@/pages/sponsor/purchase";
import SponsorTracking from "@/pages/sponsor/tracking";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

interface UserRoleData {
  currentRole: "player" | "sponsor" | null;
  hasPlayerProfile: boolean;
  hasSponsorProfile: boolean;
}

function AuthenticatedApp() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { setUserRole } = useTheme();

  const { data: roleData, isLoading: roleLoading, refetch: refetchRole } = useQuery<UserRoleData>({
    queryKey: ["/api/user/role"],
    enabled: !!user,
  });

  // Set role in theme context whenever role changes
  useEffect(() => {
    if (roleData?.currentRole) {
      setUserRole(roleData.currentRole);
    } else {
      setUserRole(null);
    }
  }, [roleData?.currentRole, setUserRole]);

  // Handle role changes
  const handleRoleSwitch = () => {
    refetchRole();
  };

  const handleRoleSelectComplete = () => {
    refetchRole();
  };

  // Loading state
  if (authLoading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!user) {
    return <LandingPage />;
  }

  // No role selected - show role selector
  if (!roleData?.currentRole) {
    return <RoleSelect onComplete={handleRoleSelectComplete} />;
  }

  const currentRole = roleData.currentRole;

  // Player routes
  if (currentRole === "player") {
    return (
      <AppLayout currentRole="player">
        <Switch>
          <Route path="/" component={PlayerDashboard} />
          <Route path="/player" component={PlayerDashboard} />
          <Route path="/player/session" component={PlayerSession} />
          <Route path="/player/history" component={PlayerHistory} />
          <Route path="/settings">
            <Settings currentRole="player" onRoleSwitch={handleRoleSwitch} />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </AppLayout>
    );
  }

  // Sponsor routes
  return (
    <AppLayout currentRole="sponsor">
      <Switch>
        <Route path="/" component={SponsorDashboard} />
        <Route path="/sponsor" component={SponsorDashboard} />
        <Route path="/sponsor/purchase" component={SponsorPurchase} />
        <Route path="/sponsor/tracking" component={SponsorTracking} />
        <Route path="/settings">
          <Settings currentRole="sponsor" onRoleSwitch={handleRoleSwitch} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <AuthenticatedApp />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
