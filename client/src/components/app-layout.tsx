import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Coins, 
  Home, 
  MapPin, 
  History, 
  Settings as SettingsIcon,
  Package,
  Map as MapIcon,
  ShoppingCart
} from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  currentRole: "player" | "sponsor";
}

export function AppLayout({ children, currentRole }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const playerNavItems = [
    { href: "/player", label: "Dashboard", icon: Home },
    { href: "/player/session", label: "Collect", icon: MapPin },
    { href: "/player/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const sponsorNavItems = [
    { href: "/sponsor", label: "Dashboard", icon: Home },
    { href: "/sponsor/purchase", label: "Purchase", icon: ShoppingCart },
    { href: "/sponsor/tracking", label: "Tracking", icon: MapIcon },
    { href: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  const navItems = currentRole === "player" ? playerNavItems : sponsorNavItems;

  const isActive = (href: string) => {
    if (href === "/player" || href === "/sponsor") {
      return location === href;
    }
    return location.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between p-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Coins className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">Give Go</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {currentRole === "player" ? "Player Mode" : "Sponsor Mode"}
            </span>
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>
                {user?.firstName?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="flex items-center justify-around max-w-md mx-auto py-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-lg transition-colors ${
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
