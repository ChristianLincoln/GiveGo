import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart, MapPin, Users, Trophy, ArrowRight, Sparkles } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img 
              src="/icons/heart-logo.png" 
              alt="Give Go Logo" 
              className="w-9 h-9 rounded-lg object-cover"
            />
            <span className="font-display font-bold text-xl">Give Go</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="button-login">
              <a href="/api/login">Sign In</a>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
            {/* Left Column */}
            <div className="space-y-8">
              <Badge variant="secondary" className="gap-2">
                <Sparkles className="w-3.5 h-3.5" />
                Supporting British Heart Foundation
              </Badge>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Walk. Collect.{" "}
                <span className="text-primary">Give.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg">
                Give Go is a GPS-based game that turns your daily walks into donations. 
                Collect virtual hearts placed by sponsors and help fund life-saving research.
              </p>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button size="lg" asChild className="gap-2" data-testid="button-get-started">
                  <a href="/api/login">
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-learn-more">
                  <a href="#how-it-works">Learn More</a>
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-primary">100%</p>
                  <p className="text-sm text-muted-foreground">Goes to charity</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-primary">Free</p>
                  <p className="text-sm text-muted-foreground">For players</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-primary">GPS</p>
                  <p className="text-sm text-muted-foreground">Powered</p>
                </div>
              </div>
            </div>
            
            {/* Right Column - Hero Visual */}
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                {/* Decorative circles */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
                
                {/* Phone mockup */}
                <div className="relative bg-card border border-card-border rounded-3xl p-4 shadow-xl">
                  {/* Map preview */}
                  <div className="bg-muted rounded-2xl aspect-[3/4] flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
                    
                    {/* Heart markers */}
                    <div className="absolute top-1/4 left-1/3 w-10 h-10 bg-accent rounded-full flex items-center justify-center gold-glow">
                      <Heart className="w-5 h-5 text-accent-foreground" />
                    </div>
                    <div className="absolute top-1/2 right-1/4 w-10 h-10 bg-primary rounded-full flex items-center justify-center coin-glow">
                      <Heart className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-1/3 left-1/2 w-10 h-10 bg-accent rounded-full flex items-center justify-center gold-glow">
                      <Heart className="w-5 h-5 text-accent-foreground" />
                    </div>
                    
                    {/* Center user marker */}
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center border-4 border-background marker-bounce">
                      <MapPin className="w-6 h-6 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
              Simple. Fun. Impactful.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Whether you're a player looking to make a difference or a sponsor wanting to give back, 
              Give Go makes charitable giving fun and engaging.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Players */}
            <Card className="p-8 space-y-6 hover-elevate">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold mb-2">For Players</h3>
                <p className="text-muted-foreground mb-6">
                  Explore your city, collect hearts, and watch your donations grow.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Start a Session</p>
                    <p className="text-sm text-muted-foreground">Open the app and begin collecting hearts near you</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Walk & Collect</p>
                    <p className="text-sm text-muted-foreground">Navigate to heart locations within 10 meters to collect</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Make a Difference</p>
                    <p className="text-sm text-muted-foreground">Each heart triggers a donation to the British Heart Foundation</p>
                  </div>
                </div>
              </div>
            </Card>
            
            {/* For Sponsors */}
            <Card className="p-8 space-y-6 hover-elevate">
              <div className="w-14 h-14 bg-accent/20 rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold mb-2">For Sponsors</h3>
                <p className="text-muted-foreground mb-6">
                  Fund hearts, track impact, and engage with your community.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Purchase Hearts</p>
                    <p className="text-sm text-muted-foreground">Choose your heart value and quantity</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Funds Held in Escrow</p>
                    <p className="text-sm text-muted-foreground">Money is secure until hearts are collected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Track Your Impact</p>
                    <p className="text-sm text-muted-foreground">Watch hearts get collected in real-time</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Everything you need
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover-elevate">
              <MapPin className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">GPS Tracking</h3>
              <p className="text-muted-foreground text-sm">
                Real-time location tracking to find and collect hearts near you.
              </p>
            </Card>
            
            <Card className="p-6 hover-elevate">
              <Trophy className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Leaderboard</h3>
              <p className="text-muted-foreground text-sm">
                Compete with other players and climb the global rankings.
              </p>
            </Card>
            
            <Card className="p-6 hover-elevate">
              <Heart className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">British Heart Foundation</h3>
              <p className="text-muted-foreground text-sm">
                100% of heart value goes to funding life-saving heart research.
              </p>
            </Card>
            
            <Card className="p-6 hover-elevate">
              <Heart className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Secure Escrow</h3>
              <p className="text-muted-foreground text-sm">
                Sponsor funds are held securely until hearts are collected.
              </p>
            </Card>
            
            <Card className="p-6 hover-elevate">
              <Users className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Dual Roles</h3>
              <p className="text-muted-foreground text-sm">
                Switch between Player and Sponsor modes anytime.
              </p>
            </Card>
            
            <Card className="p-6 hover-elevate">
              <Sparkles className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-semibold text-lg mb-2">Real-time Updates</h3>
              <p className="text-muted-foreground text-sm">
                Live updates on heart collections and donations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            Ready to help save lives?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Join thousands of players and sponsors supporting the British Heart Foundation's life-saving research.
          </p>
          <Button size="lg" asChild className="gap-2" data-testid="button-cta-join">
            <a href="/api/login">
              <Heart className="w-4 h-4" />
              Join Give Go
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Give Go</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Heart className="w-4 h-4 text-primary" />
            <span>Proudly supporting the British Heart Foundation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
