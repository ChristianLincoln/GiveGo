import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, Heart, ArrowRight, Check } from "lucide-react";

interface RoleSelectProps {
  onComplete: () => void;
}

export default function RoleSelect({ onComplete }: RoleSelectProps) {
  const [selectedRole, setSelectedRole] = useState<"player" | "sponsor" | null>(null);
  const [username, setUsername] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProfile = useMutation({
    mutationFn: async (data: { role: "player" | "sponsor"; username?: string; companyName?: string }) => {
      const response = await apiRequest("POST", "/api/profile/create", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/role"] });
      toast({
        title: "Profile created!",
        description: `You're now set up as a ${selectedRole}.`,
      });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedRole) return;
    
    if (selectedRole === "player" && !username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
        variant: "destructive",
      });
      return;
    }

    createProfile.mutate({
      role: selectedRole,
      username: selectedRole === "player" ? username.trim() : undefined,
      companyName: selectedRole === "sponsor" ? companyName.trim() : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <img 
            src="/icons/heart-logo.png" 
            alt="Give Go Logo" 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover"
          />
          <h1 className="font-display text-3xl font-bold">Choose Your Role</h1>
          <p className="text-muted-foreground">
            How would you like to use Give Go? You can switch roles anytime.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Player Card */}
          <Card
            className={`p-6 cursor-pointer transition-all hover-elevate ${
              selectedRole === "player"
                ? "border-primary border-2 bg-primary/5"
                : "border-border"
            }`}
            onClick={() => setSelectedRole("player")}
            data-testid="card-role-player"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              {selectedRole === "player" && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Player</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Explore your city, collect hearts, and make donations to charity through your walks.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Free to play</Badge>
              <Badge variant="secondary">GPS required</Badge>
            </div>
          </Card>

          {/* Sponsor Card */}
          <Card
            className={`p-6 cursor-pointer transition-all hover-elevate ${
              selectedRole === "sponsor"
                ? "border-primary border-2 bg-primary/5"
                : "border-border"
            }`}
            onClick={() => setSelectedRole("sponsor")}
            data-testid="card-role-sponsor"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6 text-accent" />
              </div>
              {selectedRole === "sponsor" && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Sponsor</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Purchase hearts to fund donations and track your charitable impact in real-time.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Fund donations</Badge>
              <Badge variant="secondary">Track impact</Badge>
            </div>
          </Card>
        </div>

        {/* Profile Details */}
        {selectedRole && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold">Complete Your Profile</h3>
            
            {selectedRole === "player" && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-username"
                />
                <p className="text-xs text-muted-foreground">
                  This will be displayed on the leaderboard
                </p>
              </div>
            )}
            
            {selectedRole === "sponsor" && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name (Optional)</Label>
                <Input
                  id="companyName"
                  placeholder="Your company or organization"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  data-testid="input-company-name"
                />
                <p className="text-xs text-muted-foreground">
                  Display your brand alongside your donations
                </p>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={createProfile.isPending || (selectedRole === "player" && !username.trim())}
              data-testid="button-continue"
            >
              {createProfile.isPending ? "Creating..." : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
