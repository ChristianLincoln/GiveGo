import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Enums
export const userRoleEnum = pgEnum("user_role", ["player", "sponsor"]);
export const coinStatusEnum = pgEnum("coin_status", ["available", "placed", "collected", "expired"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "completed", "abandoned"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["held", "released", "refunded"]);

// Player Profile - extends user with player-specific data
export const playerProfiles = pgTable("player_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  username: text("username").notNull().unique(),
  totalCoinsCollected: integer("total_coins_collected").default(0).notNull(),
  totalDonated: integer("total_donated").default(0).notNull(), // in pence
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sponsor Profile - extends user with sponsor-specific data
export const sponsorProfiles = pgTable("sponsor_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  companyName: text("company_name"),
  totalCoinsPurchased: integer("total_coins_purchased").default(0).notNull(),
  totalCoinsPlaced: integer("total_coins_placed").default(0).notNull(),
  totalDonated: integer("total_donated").default(0).notNull(), // in pence
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Coin inventory owned by sponsors
export const coinInventory = pgTable("coin_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull(),
  coinValue: integer("coin_value").notNull(), // in pence (100 = £1)
  quantity: integer("quantity").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Generated coins placed in the world
export const generatedCoins = pgTable("generated_coins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull(),
  sessionId: varchar("session_id"),
  coinValue: integer("coin_value").notNull(), // in pence
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  status: coinStatusEnum("status").default("available").notNull(),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  collectedAt: timestamp("collected_at"),
  collectedBy: varchar("collected_by"),
});

// Player game sessions (renamed to avoid conflict with auth sessions)
export const playerSessions = pgTable("player_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  status: sessionStatusEnum("status").default("active").notNull(),
  startLatitude: real("start_latitude").notNull(),
  startLongitude: real("start_longitude").notNull(),
  coinsCollected: integer("coins_collected").default(0).notNull(),
  totalValue: integer("total_value").default(0).notNull(), // in pence
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Escrow for coin funds
export const escrow = pgTable("escrow", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinId: varchar("coin_id").notNull(),
  sponsorId: varchar("sponsor_id").notNull(),
  amount: integer("amount").notNull(), // in pence
  status: escrowStatusEnum("status").default("held").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"),
});

// Collection history for players
export const collectionHistory = pgTable("collection_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  coinId: varchar("coin_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  coinValue: integer("coin_value").notNull(),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
});

// User role preferences
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  currentRole: userRoleEnum("current_role").default("player").notNull(),
  hasPlayerProfile: boolean("has_player_profile").default(false).notNull(),
  hasSponsorProfile: boolean("has_sponsor_profile").default(false).notNull(),
});

// Insert schemas
export const insertPlayerProfileSchema = createInsertSchema(playerProfiles).omit({ id: true, createdAt: true });
export const insertSponsorProfileSchema = createInsertSchema(sponsorProfiles).omit({ id: true, createdAt: true });
export const insertCoinInventorySchema = createInsertSchema(coinInventory).omit({ id: true, createdAt: true });
export const insertGeneratedCoinSchema = createInsertSchema(generatedCoins).omit({ id: true, placedAt: true });
export const insertPlayerSessionSchema = createInsertSchema(playerSessions).omit({ id: true, startedAt: true });
export const insertEscrowSchema = createInsertSchema(escrow).omit({ id: true, createdAt: true });
export const insertCollectionHistorySchema = createInsertSchema(collectionHistory).omit({ id: true, collectedAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true });

// Types
export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = z.infer<typeof insertPlayerProfileSchema>;
export type SponsorProfile = typeof sponsorProfiles.$inferSelect;
export type InsertSponsorProfile = z.infer<typeof insertSponsorProfileSchema>;
export type CoinInventory = typeof coinInventory.$inferSelect;
export type InsertCoinInventory = z.infer<typeof insertCoinInventorySchema>;
export type GeneratedCoin = typeof generatedCoins.$inferSelect;
export type InsertGeneratedCoin = z.infer<typeof insertGeneratedCoinSchema>;
export type PlayerSession = typeof playerSessions.$inferSelect;
export type InsertPlayerSession = z.infer<typeof insertPlayerSessionSchema>;
export type Escrow = typeof escrow.$inferSelect;
export type InsertEscrow = z.infer<typeof insertEscrowSchema>;
export type CollectionHistory = typeof collectionHistory.$inferSelect;
export type InsertCollectionHistory = z.infer<typeof insertCollectionHistorySchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
