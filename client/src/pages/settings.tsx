import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  User, 
  MapPin, 
  Heart, 
  ArrowRightLeft,
  LogOut,
  Moon,
  Bell,
  Shield
} from "lucide-react";

interface SettingsProps {
  currentRole: "player" | "sponsor";
  onRoleSwitch: () => void;
}

export default function Settings({ currentRole, onRoleSwitch }: SettingsProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const switchRole = useMutation({
    mutationFn: async () => {
      const newRole = currentRole === "player" ? "sponsor" : "player";
      const response = await apiRequest("POST", "/api/user/role/switch", { role: newRole });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
      toast({
        title: "Role switched!",
        description: `You're now in ${currentRole === "player" ? "Sponsor" : "Player"} mode.`,
      });
      onRoleSwitch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to switch role",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h3>
        <div className="flex items-center gap-4">
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}
          <div>
            <p className="font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-1">
              {currentRole === "player" ? (
                <>
                  <MapPin className="w-3 h-3 mr-1" />
                  Player
                </>
              ) : (
                <>
                  <Heart className="w-3 h-3 mr-1" />
                  Sponsor
                </>
              )}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Role Switching */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Switch Role
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          You can switch between Player and Sponsor mode at any time.
        </p>
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {currentRole === "player" ? (
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-accent" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <p className="font-medium">
                Switch to {currentRole === "player" ? "Sponsor" : "Player"} Mode
              </p>
              <p className="text-xs text-muted-foreground">
                {currentRole === "player"
                  ? "Purchase hearts and track donations"
                  : "Collect hearts and earn points"}
              </p>
            </div>
          </div>
          <Button
            onClick={() => switchRole.mutate()}
            disabled={switchRole.isPending}
            data-testid="button-switch-role"
          >
            {switchRole.isPending ? "Switching..." : "Switch"}
          </Button>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">Toggle dark or light mode</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* About */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" />
          About Give Go
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Give Go is a GPS-based game that turns walking into giving. Every heart collected 
          triggers a donation to the British Heart Foundation.
        </p>
        <a 
          href="https://www.bhf.org.uk/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-4"
          data-testid="link-bhf-charity"
        >
          <Heart className="w-4 h-4" />
          Visit British Heart Foundation
        </a>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Version 1.1.0</span>
          <Separator orientation="vertical" className="h-4" />
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          <Separator orientation="vertical" className="h-4" />
          <a href="#" className="hover:text-foreground transition-colors">
            Terms of Service
          </a>
        </div>
      </Card>

      {/* Logout */}
      <Card className="p-6">
        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </Card>
    </div>
  );
}
