import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { getUncachableStripeClient } from "./stripeClient";
import { generateRandomPointInRadius, calculateDistance } from "./utils/distance";
import { z } from "zod";

// Validation schemas
const createProfileSchema = z.object({
  role: z.enum(["player", "sponsor"]),
  username: z.string().min(3).max(30).optional(),
  companyName: z.string().max(100).optional(),
});

const switchRoleSchema = z.object({
  role: z.enum(["player", "sponsor"]),
});

const startSessionSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const collectCoinSchema = z.object({
  coinId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const checkoutSchema = z.object({
  coinValue: z.number().min(50).max(500),
  quantity: z.number().min(1).max(1000),
});

const COLLECTION_RADIUS_METERS = 10;
const COIN_TTL_MINUTES = 30;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ==================== User Role Routes ====================
  
  // Get user role
  app.get("/api/user/role", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const role = await storage.getUserRole(userId);
      
      if (!role) {
        return res.json({
          currentRole: null,
          hasPlayerProfile: false,
          hasSponsorProfile: false,
        });
      }

      const playerProfile = await storage.getPlayerProfile(userId);
      const sponsorProfile = await storage.getSponsorProfile(userId);

      res.json({
        currentRole: role.currentRole,
        hasPlayerProfile: !!playerProfile,
        hasSponsorProfile: !!sponsorProfile,
      });
    } catch (error) {
      console.error("Error getting user role:", error);
      res.status(500).json({ message: "Failed to get user role" });
    }
  });

  // Create profile and set initial role
  app.post("/api/profile/create", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const data = createProfileSchema.parse(req.body);

      // Create or update user role
      let userRole = await storage.getUserRole(userId);
      if (!userRole) {
        userRole = await storage.createUserRole({
          userId,
          currentRole: data.role,
          hasPlayerProfile: data.role === "player",
          hasSponsorProfile: data.role === "sponsor",
        });
      } else {
        // Update profile flags when creating profile for existing role
        await storage.updateUserRoleProfileFlags(
          userId,
          data.role === "player",
          data.role === "sponsor"
        );
        await storage.updateUserRole(userId, data.role);
      }

      // Create profile based on role
      if (data.role === "player") {
        const existingProfile = await storage.getPlayerProfile(userId);
        if (!existingProfile) {
          if (!data.username) {
            return res.status(400).json({ message: "Username required for player profile" });
          }
          await storage.createPlayerProfile({
            userId,
            username: data.username,
          });
        }
      } else {
        const existingProfile = await storage.getSponsorProfile(userId);
        if (!existingProfile) {
          await storage.createSponsorProfile({
            userId,
            companyName: data.companyName || null,
          });
        }
      }

      res.json({ success: true, role: data.role });
    } catch (error: any) {
      console.error("Error creating profile:", error);
      if (error.code === "23505") {
        return res.status(400).json({ message: "Username already taken" });
      }
      res.status(500).json({ message: error.message || "Failed to create profile" });
    }
  });

  // Switch role
  app.post("/api/user/role/switch", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { role } = switchRoleSchema.parse(req.body);

      // Check if user has the required profile
      if (role === "player") {
        const profile = await storage.getPlayerProfile(userId);
        if (!profile) {
          return res.status(400).json({ message: "Create a player profile first" });
        }
      } else {
        const profile = await storage.getSponsorProfile(userId);
        if (!profile) {
          // Auto-create sponsor profile and update role flags
          await storage.createSponsorProfile({ userId, companyName: null });
          await storage.updateUserRoleProfileFlags(userId, false, true);
        }
      }

      await storage.updateUserRole(userId, role);
      res.json({ success: true, role });
    } catch (error) {
      console.error("Error switching role:", error);
      res.status(500).json({ message: "Failed to switch role" });
    }
  });

  // ==================== Player Routes ====================

  // Get player stats
  app.get("/api/player/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getPlayerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      const leaderboard = await storage.getLeaderboard(20);
      const rank = await storage.getPlayerRank(userId);
      const activeSession = await storage.getActiveSession(profile.id);
      const totalCoins = await storage.getTotalAvailableCoins();

      // Build leaderboard with context (4 above, current, 4 below)
      const playerIndex = leaderboard.findIndex(p => p.userId === userId);
      let contextLeaderboard = [];

      if (playerIndex === -1 && leaderboard.length > 0) {
        // Player not in top 20, show top and player's position
        contextLeaderboard = leaderboard.slice(0, 4).map((p, i) => ({
          rank: i + 1,
          username: p.username,
          totalCoinsCollected: p.totalCoinsCollected,
          totalDonated: p.totalDonated,
          isCurrentUser: p.userId === userId,
        }));
        contextLeaderboard.push({
          rank,
          username: profile.username,
          totalCoinsCollected: profile.totalCoinsCollected,
          totalDonated: profile.totalDonated,
          isCurrentUser: true,
        });
      } else {
        const start = Math.max(0, playerIndex - 4);
        const end = Math.min(leaderboard.length, playerIndex + 5);
        contextLeaderboard = leaderboard.slice(start, end).map((p, i) => ({
          rank: start + i + 1,
          username: p.username,
          totalCoinsCollected: p.totalCoinsCollected,
          totalDonated: p.totalDonated,
          isCurrentUser: p.userId === userId,
        }));
      }

      // Mock history data for now (would come from collection_history aggregation)
      const history = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        history.push({
          date: date.toISOString().split("T")[0],
          coins: Math.round(profile.totalCoinsCollected * (7 - i) / 7),
          donated: Math.round(profile.totalDonated * (7 - i) / 7),
        });
      }

      res.json({
        profile,
        leaderboard: contextLeaderboard,
        history,
        activeSession,
        coinsAvailable: totalCoins > 0,
      });
    } catch (error) {
      console.error("Error getting player stats:", error);
      res.status(500).json({ message: "Failed to get player stats" });
    }
  });

  // Get active session
  app.get("/api/player/session/active", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getPlayerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      const session = await storage.getActiveSession(profile.id);
      if (!session) {
        return res.json({ session: null, coins: [] });
      }

      const coins = await storage.getActiveCoinsForSession(session.id);
      res.json({ session, coins });
    } catch (error) {
      console.error("Error getting active session:", error);
      res.status(500).json({ message: "Failed to get active session" });
    }
  });

  // Start session
  app.post("/api/player/session/start", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { latitude, longitude } = startSessionSchema.parse(req.body);

      const profile = await storage.getPlayerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      // Check for existing active session
      const existingSession = await storage.getActiveSession(profile.id);
      if (existingSession) {
        return res.status(400).json({ message: "You already have an active session" });
      }

      // Get random coins from inventory (1-10 coins)
      const coinCount = Math.floor(Math.random() * 10) + 1;
      const coinsToPlace = await storage.getRandomAvailableCoinsFromInventory(coinCount);

      if (coinsToPlace.length === 0) {
        return res.status(400).json({ message: "No coins available right now" });
      }

      // Create session
      const session = await storage.createSession({
        playerId: profile.id,
        status: "active",
        startLatitude: latitude,
        startLongitude: longitude,
        coinsCollected: 0,
        totalValue: 0,
      });

      // Place coins and create escrow records
      const expiresAt = new Date(Date.now() + COIN_TTL_MINUTES * 60 * 1000);

      for (const coinData of coinsToPlace) {
        // Generate random location 1-2km away
        const coinLocation = generateRandomPointInRadius(latitude, longitude, 1, 2);

        // Decrement inventory
        const decremented = await storage.decrementInventory(
          coinData.sponsorId,
          coinData.coinValue,
          1
        );

        if (!decremented) continue;

        // Create placed coin
        const coin = await storage.createGeneratedCoin({
          sponsorId: coinData.sponsorId,
          sessionId: session.id,
          coinValue: coinData.coinValue,
          latitude: coinLocation.latitude,
          longitude: coinLocation.longitude,
          status: "placed",
          expiresAt,
        });

        // Create escrow record
        await storage.createEscrow({
          coinId: coin.id,
          sponsorId: coinData.sponsorId,
          amount: coinData.coinValue,
          status: "held",
        });
      }

      const coins = await storage.getActiveCoinsForSession(session.id);
      res.json({ session, coins });
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  // End session
  app.post("/api/player/session/end", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getPlayerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      const session = await storage.getActiveSession(profile.id);
      if (!session) {
        return res.status(400).json({ message: "No active session found" });
      }

      // Mark remaining coins as expired and return to inventory
      const remainingCoins = await storage.getActiveCoinsForSession(session.id);
      for (const coin of remainingCoins) {
        await storage.updateCoinStatus(coin.id, "expired");
        await storage.addToInventory(coin.sponsorId, coin.coinValue, 1);
        await storage.refundEscrow(coin.id);
      }

      // End session
      const status = session.coinsCollected > 0 ? "completed" : "abandoned";
      await storage.endSession(session.id, status);

      res.json({ success: true, status });
    } catch (error) {
      console.error("Error ending session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });

  // Collect coin
  app.post("/api/player/coin/collect", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { coinId, latitude, longitude } = collectCoinSchema.parse(req.body);

      const profile = await storage.getPlayerProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      const session = await storage.getActiveSession(profile.id);
      if (!session) {
        return res.status(400).json({ message: "No active session" });
      }

      const coin = await storage.getGeneratedCoin(coinId);
      if (!coin) {
        return res.status(404).json({ message: "Coin not found" });
      }

      if (coin.status !== "placed") {
        return res.status(400).json({ message: "Coin is no longer available" });
      }

      if (coin.sessionId !== session.id) {
        return res.status(400).json({ message: "Coin not in your session" });
      }

      // Check distance
      const distance = calculateDistance(latitude, longitude, coin.latitude, coin.longitude);
      if (distance > COLLECTION_RADIUS_METERS) {
        return res.status(400).json({ 
          message: `Too far from coin. Get within ${COLLECTION_RADIUS_METERS}m (currently ${Math.round(distance)}m away)` 
        });
      }

      // Check if expired
      if (new Date(coin.expiresAt) < new Date()) {
        await storage.updateCoinStatus(coin.id, "expired");
        await storage.addToInventory(coin.sponsorId, coin.coinValue, 1);
        await storage.refundEscrow(coin.id);
        return res.status(400).json({ message: "Coin has expired" });
      }

      // Collect the coin!
      await storage.updateCoinStatus(coin.id, "collected", profile.id);
      await storage.releaseEscrow(coin.id);
      
      // Update player stats
      await storage.updatePlayerStats(userId, 1, coin.coinValue);
      
      // Update sponsor stats
      await storage.updateSponsorStats(coin.sponsorId, 0, coin.coinValue);

      // Update session
      await storage.updateSession(session.id, {
        coinsCollected: session.coinsCollected + 1,
        totalValue: session.totalValue + coin.coinValue,
      });

      // Add to history
      await storage.addCollectionHistory({
        playerId: profile.id,
        coinId: coin.id,
        sessionId: session.id,
        coinValue: coin.coinValue,
      });

      res.json({ 
        success: true, 
        coinValue: coin.coinValue,
        message: `£${(coin.coinValue / 100).toFixed(2)} donated to British Heart Foundation!`
      });
    } catch (error) {
      console.error("Error collecting coin:", error);
      res.status(500).json({ message: "Failed to collect coin" });
    }
  });

  // Get player history
  app.get("/api/player/history", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getPlayerProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Player profile not found" });
      }

      const history = await storage.getPlayerHistory(profile.id);
      const stats = await storage.getPlayerHistoryStats(profile.id);

      res.json({
        history: history.map(h => ({
          ...h,
          sessionDate: h.collectedAt,
        })),
        totalCoins: stats.totalCoins,
        totalDonated: stats.totalDonated,
      });
    } catch (error) {
      console.error("Error getting player history:", error);
      res.status(500).json({ message: "Failed to get history" });
    }
  });

  // ==================== Sponsor Routes ====================

  // Get sponsor stats
  app.get("/api/sponsor/stats", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getSponsorProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Sponsor profile not found" });
      }

      const inventory = await storage.getCoinInventory(profile.id);
      const coins = await storage.getCoinsForSponsor(profile.id);

      const stats = {
        totalInInventory: inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        totalPlaced: coins.filter(c => c.status === "placed").length,
        totalCollected: coins.filter(c => c.status === "collected").length,
        totalExpired: coins.filter(c => c.status === "expired").length,
      };

      res.json({
        profile,
        inventory,
        recentCoins: coins.slice(0, 10),
        stats,
      });
    } catch (error) {
      console.error("Error getting sponsor stats:", error);
      res.status(500).json({ message: "Failed to get sponsor stats" });
    }
  });

  // Get sponsor coins
  app.get("/api/sponsor/coins", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const profile = await storage.getSponsorProfile(userId);
      
      if (!profile) {
        return res.status(404).json({ message: "Sponsor profile not found" });
      }

      const coins = await storage.getCoinsForSponsor(profile.id);
      res.json(coins);
    } catch (error) {
      console.error("Error getting sponsor coins:", error);
      res.status(500).json({ message: "Failed to get coins" });
    }
  });

  // Create checkout session
  app.post("/api/sponsor/checkout", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { coinValue, quantity } = checkoutSchema.parse(req.body);

      const profile = await storage.getSponsorProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Sponsor profile not found" });
      }

      const stripe = await getUncachableStripeClient();
      const totalAmount = coinValue * quantity;

      // Create or get Stripe customer
      let customerId = profile.stripeCustomerId;
      if (!customerId) {
        const user = req.user?.claims;
        const customer = await stripe.customers.create({
          email: user?.email,
          metadata: { userId, profileId: profile.id },
        });
        customerId = customer.id;
        await storage.updateSponsorStripeCustomerId(userId, customerId);
      }

      // Create checkout session
      const host = req.get("host");
      const protocol = req.protocol;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `Give Go Coins (${quantity}x £${(coinValue / 100).toFixed(2)})`,
                description: `${quantity} coins worth £${(coinValue / 100).toFixed(2)} each for British Heart Foundation`,
              },
              unit_amount: coinValue,
            },
            quantity,
          },
        ],
        mode: "payment",
        success_url: `${protocol}://${host}/sponsor?success=true&coins=${quantity}&value=${coinValue}`,
        cancel_url: `${protocol}://${host}/sponsor/purchase?cancelled=true`,
        metadata: {
          sponsorId: profile.id,
          coinValue: coinValue.toString(),
          quantity: quantity.toString(),
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating checkout:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  // Handle successful payment (called after Stripe redirect)
  app.get("/api/sponsor/payment-success", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      const { coins, value } = req.query;

      if (!coins || !value) {
        return res.status(400).json({ message: "Missing parameters" });
      }

      const profile = await storage.getSponsorProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Sponsor profile not found" });
      }

      const quantity = parseInt(coins as string);
      const coinValue = parseInt(value as string);

      // Add coins to inventory
      await storage.addToInventory(profile.id, coinValue, quantity);

      res.json({ success: true, quantity, coinValue });
    } catch (error) {
      console.error("Error processing payment success:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  return httpServer;
}
