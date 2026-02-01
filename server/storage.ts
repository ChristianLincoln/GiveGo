import { db } from "./db";
import { eq, and, desc, sql, gte, lte, ne, inArray } from "drizzle-orm";
import {
  playerProfiles,
  sponsorProfiles,
  coinInventory,
  generatedCoins,
  playerSessions,
  escrow,
  collectionHistory,
  userRoles,
  type PlayerProfile,
  type InsertPlayerProfile,
  type SponsorProfile,
  type InsertSponsorProfile,
  type CoinInventory,
  type InsertCoinInventory,
  type GeneratedCoin,
  type InsertGeneratedCoin,
  type PlayerSession,
  type InsertPlayerSession,
  type Escrow,
  type InsertEscrow,
  type CollectionHistory,
  type InsertCollectionHistory,
  type UserRole,
  type InsertUserRole,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User Roles
  getUserRole(userId: string): Promise<UserRole | undefined>;
  createUserRole(data: InsertUserRole): Promise<UserRole>;
  updateUserRole(userId: string, role: "player" | "sponsor"): Promise<UserRole | undefined>;
  updateUserRoleProfileFlags(userId: string, hasPlayerProfile: boolean, hasSponsorProfile: boolean): Promise<void>;

  // Player Profiles
  getPlayerProfile(userId: string): Promise<PlayerProfile | undefined>;
  getPlayerProfileById(id: string): Promise<PlayerProfile | undefined>;
  createPlayerProfile(data: InsertPlayerProfile): Promise<PlayerProfile>;
  updatePlayerStats(userId: string, coinsCollected: number, donated: number): Promise<void>;
  getLeaderboard(limit?: number): Promise<PlayerProfile[]>;
  getPlayerRank(userId: string): Promise<number>;

  // Sponsor Profiles
  getSponsorProfile(userId: string): Promise<SponsorProfile | undefined>;
  getSponsorProfileById(id: string): Promise<SponsorProfile | undefined>;
  createSponsorProfile(data: InsertSponsorProfile): Promise<SponsorProfile>;
  updateSponsorStripeCustomerId(userId: string, customerId: string): Promise<void>;
  updateSponsorPurchasedCount(userId: string, quantity: number): Promise<void>;
  updateSponsorStats(userId: string, coinsPlaced: number, donated: number): Promise<void>;

  // Coin Inventory
  getCoinInventory(sponsorId: string): Promise<CoinInventory[]>;
  addToInventory(sponsorId: string, coinValue: number, quantity: number): Promise<CoinInventory>;
  decrementInventory(sponsorId: string, coinValue: number, quantity: number): Promise<boolean>;
  getTotalAvailableCoins(): Promise<number>;

  // Generated Coins
  getGeneratedCoin(id: string): Promise<GeneratedCoin | undefined>;
  createGeneratedCoin(data: InsertGeneratedCoin): Promise<GeneratedCoin>;
  getActiveCoinsForSession(sessionId: string): Promise<GeneratedCoin[]>;
  getCoinsForSponsor(sponsorId: string): Promise<GeneratedCoin[]>;
  updateCoinStatus(id: string, status: "available" | "placed" | "collected" | "expired", collectedBy?: string): Promise<void>;
  getExpiredCoins(): Promise<GeneratedCoin[]>;
  getRandomAvailableCoinsFromInventory(count: number): Promise<{ sponsorId: string; coinValue: number }[]>;

  // Player Sessions
  getActiveSession(playerId: string): Promise<PlayerSession | undefined>;
  createSession(data: InsertPlayerSession): Promise<PlayerSession>;
  updateSession(id: string, data: Partial<PlayerSession>): Promise<void>;
  endSession(id: string, status: "completed" | "abandoned"): Promise<void>;

  // Escrow
  createEscrow(data: InsertEscrow): Promise<Escrow>;
  releaseEscrow(coinId: string): Promise<void>;
  refundEscrow(coinId: string): Promise<void>;

  // Collection History
  addCollectionHistory(data: InsertCollectionHistory): Promise<CollectionHistory>;
  getPlayerHistory(playerId: string): Promise<CollectionHistory[]>;
  getPlayerHistoryStats(playerId: string): Promise<{ totalCoins: number; totalDonated: number }>;
}

export class DatabaseStorage implements IStorage {
  // User Roles
  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [role] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return role;
  }

  async createUserRole(data: InsertUserRole): Promise<UserRole> {
    const [role] = await db.insert(userRoles).values(data).returning();
    return role;
  }

  async updateUserRole(userId: string, role: "player" | "sponsor"): Promise<UserRole | undefined> {
    const [updated] = await db
      .update(userRoles)
      .set({ currentRole: role })
      .where(eq(userRoles.userId, userId))
      .returning();
    return updated;
  }

  async updateUserRoleProfileFlags(
    userId: string,
    hasPlayerProfile: boolean,
    hasSponsorProfile: boolean
  ): Promise<void> {
    const currentRole = await this.getUserRole(userId);
    if (!currentRole) return;
    
    await db
      .update(userRoles)
      .set({
        hasPlayerProfile: currentRole.hasPlayerProfile || hasPlayerProfile,
        hasSponsorProfile: currentRole.hasSponsorProfile || hasSponsorProfile,
      })
      .where(eq(userRoles.userId, userId));
  }

  // Player Profiles
  async getPlayerProfile(userId: string): Promise<PlayerProfile | undefined> {
    const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId));
    return profile;
  }

  async getPlayerProfileById(id: string): Promise<PlayerProfile | undefined> {
    const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, id));
    return profile;
  }

  async createPlayerProfile(data: InsertPlayerProfile): Promise<PlayerProfile> {
    const [profile] = await db.insert(playerProfiles).values(data).returning();
    return profile;
  }

  async updatePlayerStats(userId: string, coinsCollected: number, donated: number): Promise<void> {
    await db
      .update(playerProfiles)
      .set({
        totalCoinsCollected: sql`${playerProfiles.totalCoinsCollected} + ${coinsCollected}`,
        totalDonated: sql`${playerProfiles.totalDonated} + ${donated}`,
      })
      .where(eq(playerProfiles.userId, userId));
  }

  async getLeaderboard(limit = 100): Promise<PlayerProfile[]> {
    return db
      .select()
      .from(playerProfiles)
      .orderBy(desc(playerProfiles.totalCoinsCollected))
      .limit(limit);
  }

  async getPlayerRank(userId: string): Promise<number> {
    const profile = await this.getPlayerProfile(userId);
    if (!profile) return 0;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(playerProfiles)
      .where(sql`${playerProfiles.totalCoinsCollected} > ${profile.totalCoinsCollected}`);
    
    return (result[0]?.count || 0) + 1;
  }

  // Sponsor Profiles
  async getSponsorProfile(userId: string): Promise<SponsorProfile | undefined> {
    const [profile] = await db.select().from(sponsorProfiles).where(eq(sponsorProfiles.userId, userId));
    return profile;
  }

  async getSponsorProfileById(id: string): Promise<SponsorProfile | undefined> {
    const [profile] = await db.select().from(sponsorProfiles).where(eq(sponsorProfiles.id, id));
    return profile;
  }

  async createSponsorProfile(data: InsertSponsorProfile): Promise<SponsorProfile> {
    const [profile] = await db.insert(sponsorProfiles).values(data).returning();
    return profile;
  }

  async updateSponsorStripeCustomerId(userId: string, customerId: string): Promise<void> {
    await db
      .update(sponsorProfiles)
      .set({ stripeCustomerId: customerId })
      .where(eq(sponsorProfiles.userId, userId));
  }

  async updateSponsorPurchasedCount(userId: string, quantity: number): Promise<void> {
    await db
      .update(sponsorProfiles)
      .set({
        totalCoinsPurchased: sql`${sponsorProfiles.totalCoinsPurchased} + ${quantity}`,
      })
      .where(eq(sponsorProfiles.userId, userId));
  }

  async updateSponsorStats(userId: string, coinsPlaced: number, donated: number): Promise<void> {
    await db
      .update(sponsorProfiles)
      .set({
        totalCoinsPlaced: sql`${sponsorProfiles.totalCoinsPlaced} + ${coinsPlaced}`,
        totalDonated: sql`${sponsorProfiles.totalDonated} + ${donated}`,
      })
      .where(eq(sponsorProfiles.userId, userId));
  }

  // Coin Inventory
  async getCoinInventory(sponsorId: string): Promise<CoinInventory[]> {
    return db.select().from(coinInventory).where(eq(coinInventory.sponsorId, sponsorId));
  }

  async addToInventory(sponsorId: string, coinValue: number, quantity: number): Promise<CoinInventory> {
    // Try to update existing inventory first
    const [existing] = await db
      .select()
      .from(coinInventory)
      .where(and(eq(coinInventory.sponsorId, sponsorId), eq(coinInventory.coinValue, coinValue)));

    if (existing) {
      const [updated] = await db
        .update(coinInventory)
        .set({ quantity: sql`${coinInventory.quantity} + ${quantity}` })
        .where(eq(coinInventory.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(coinInventory)
      .values({ sponsorId, coinValue, quantity })
      .returning();
    return created;
  }

  async decrementInventory(sponsorId: string, coinValue: number, quantity: number): Promise<boolean> {
    const [existing] = await db
      .select()
      .from(coinInventory)
      .where(and(eq(coinInventory.sponsorId, sponsorId), eq(coinInventory.coinValue, coinValue)));

    if (!existing || existing.quantity < quantity) return false;

    await db
      .update(coinInventory)
      .set({ quantity: sql`${coinInventory.quantity} - ${quantity}` })
      .where(eq(coinInventory.id, existing.id));

    return true;
  }

  async getTotalAvailableCoins(): Promise<number> {
    const result = await db
      .select({ total: sql<number>`COALESCE(SUM(${coinInventory.quantity}), 0)` })
      .from(coinInventory);
    return result[0]?.total || 0;
  }

  // Generated Coins
  async getGeneratedCoin(id: string): Promise<GeneratedCoin | undefined> {
    const [coin] = await db.select().from(generatedCoins).where(eq(generatedCoins.id, id));
    return coin;
  }

  async createGeneratedCoin(data: InsertGeneratedCoin): Promise<GeneratedCoin> {
    const [coin] = await db.insert(generatedCoins).values(data).returning();
    return coin;
  }

  async getActiveCoinsForSession(sessionId: string): Promise<GeneratedCoin[]> {
    return db
      .select()
      .from(generatedCoins)
      .where(and(eq(generatedCoins.sessionId, sessionId), eq(generatedCoins.status, "placed")));
  }

  async getCoinsForSponsor(sponsorId: string): Promise<GeneratedCoin[]> {
    return db
      .select()
      .from(generatedCoins)
      .where(eq(generatedCoins.sponsorId, sponsorId))
      .orderBy(desc(generatedCoins.placedAt));
  }

  async updateCoinStatus(
    id: string,
    status: "available" | "placed" | "collected" | "expired",
    collectedBy?: string
  ): Promise<void> {
    const updateData: Partial<GeneratedCoin> = { status };
    if (status === "collected") {
      updateData.collectedAt = new Date();
      if (collectedBy) updateData.collectedBy = collectedBy;
    }
    await db.update(generatedCoins).set(updateData).where(eq(generatedCoins.id, id));
  }

  async getExpiredCoins(): Promise<GeneratedCoin[]> {
    return db
      .select()
      .from(generatedCoins)
      .where(
        and(
          eq(generatedCoins.status, "placed"),
          lte(generatedCoins.expiresAt, new Date())
        )
      );
  }

  async getRandomAvailableCoinsFromInventory(count: number): Promise<{ sponsorId: string; coinValue: number }[]> {
    // Get all inventory items with available coins
    const inventory = await db
      .select()
      .from(coinInventory)
      .where(sql`${coinInventory.quantity} > 0`);

    if (inventory.length === 0) return [];

    // Flatten into individual coin records and shuffle
    const coins: { sponsorId: string; coinValue: number }[] = [];
    for (const inv of inventory) {
      for (let i = 0; i < inv.quantity && coins.length < count * 2; i++) {
        coins.push({ sponsorId: inv.sponsorId, coinValue: inv.coinValue });
      }
    }

    // Shuffle and take requested count
    const shuffled = coins.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // Player Sessions
  async getActiveSession(playerId: string): Promise<PlayerSession | undefined> {
    const [session] = await db
      .select()
      .from(playerSessions)
      .where(and(eq(playerSessions.playerId, playerId), eq(playerSessions.status, "active")));
    return session;
  }

  async createSession(data: InsertPlayerSession): Promise<PlayerSession> {
    const [session] = await db.insert(playerSessions).values(data).returning();
    return session;
  }

  async updateSession(id: string, data: Partial<PlayerSession>): Promise<void> {
    await db.update(playerSessions).set(data).where(eq(playerSessions.id, id));
  }

  async endSession(id: string, status: "completed" | "abandoned"): Promise<void> {
    await db
      .update(playerSessions)
      .set({ status, endedAt: new Date() })
      .where(eq(playerSessions.id, id));
  }

  // Escrow
  async createEscrow(data: InsertEscrow): Promise<Escrow> {
    const [row] = await db.insert(escrow).values(data).returning();
    return row;
  }

  async releaseEscrow(coinId: string): Promise<void> {
    await db
      .update(escrow)
      .set({ status: "released", releasedAt: new Date() })
      .where(eq(escrow.coinId, coinId));
  }

  async refundEscrow(coinId: string): Promise<void> {
    await db
      .update(escrow)
      .set({ status: "refunded", releasedAt: new Date() })
      .where(eq(escrow.coinId, coinId));
  }

  // Collection History
  async addCollectionHistory(data: InsertCollectionHistory): Promise<CollectionHistory> {
    const [history] = await db.insert(collectionHistory).values(data).returning();
    return history;
  }

  async getPlayerHistory(playerId: string): Promise<CollectionHistory[]> {
    return db
      .select()
      .from(collectionHistory)
      .where(eq(collectionHistory.playerId, playerId))
      .orderBy(desc(collectionHistory.collectedAt));
  }

  async getPlayerHistoryStats(playerId: string): Promise<{ totalCoins: number; totalDonated: number }> {
    const result = await db
      .select({
        totalCoins: sql<number>`COUNT(*)`,
        totalDonated: sql<number>`COALESCE(SUM(${collectionHistory.coinValue}), 0)`,
      })
      .from(collectionHistory)
      .where(eq(collectionHistory.playerId, playerId));
    
    return {
      totalCoins: result[0]?.totalCoins || 0,
      totalDonated: result[0]?.totalDonated || 0,
    };
  }
}

export const storage = new DatabaseStorage();
