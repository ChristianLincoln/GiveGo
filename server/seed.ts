import { db } from "./db";
import { 
  sponsorProfiles, 
  coinInventory, 
  users,
  userRoles 
} from "@shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  console.log("Seeding mock data...");

  try {
    // Create a demo sponsor user
    const demoSponsorId = "demo-sponsor-001";
    
    // Check if demo sponsor exists
    const existingUser = await db.select().from(users).where(sql`id = ${demoSponsorId}`);
    
    if (existingUser.length === 0) {
      // Create demo user
      await db.insert(users).values({
        id: demoSponsorId,
        email: "demo-sponsor@givego.app",
        firstName: "Demo",
        lastName: "Sponsor",
      });
      console.log("Created demo sponsor user");
    }

    // Check if sponsor profile exists
    const existingProfile = await db.select().from(sponsorProfiles).where(sql`user_id = ${demoSponsorId}`);
    
    let sponsorProfileId: string;
    
    if (existingProfile.length === 0) {
      // Create sponsor profile
      const [profile] = await db.insert(sponsorProfiles).values({
        userId: demoSponsorId,
        companyName: "Give Go Demo Sponsor",
        totalCoinsPurchased: 100,
        totalCoinsPlaced: 0,
        totalDonated: 0,
      }).returning();
      sponsorProfileId = profile.id;
      console.log("Created demo sponsor profile");
    } else {
      sponsorProfileId = existingProfile[0].id;
      console.log("Demo sponsor profile already exists");
    }

    // Check if user role exists
    const existingRole = await db.select().from(userRoles).where(sql`user_id = ${demoSponsorId}`);
    
    if (existingRole.length === 0) {
      await db.insert(userRoles).values({
        userId: demoSponsorId,
        currentRole: "sponsor",
        hasPlayerProfile: false,
        hasSponsorProfile: true,
      });
      console.log("Created user role entry");
    }

    // Add coins to inventory (various denominations)
    const coinValues = [
      { value: 100, quantity: 20 },  // £1 coins
      { value: 200, quantity: 15 },  // £2 coins  
      { value: 500, quantity: 10 },  // £5 coins
      { value: 1000, quantity: 5 },  // £10 coins
    ];

    for (const coin of coinValues) {
      // Check if inventory entry exists
      const existing = await db.select().from(coinInventory)
        .where(sql`sponsor_id = ${sponsorProfileId} AND coin_value = ${coin.value}`);
      
      if (existing.length === 0) {
        await db.insert(coinInventory).values({
          sponsorId: sponsorProfileId,
          coinValue: coin.value,
          quantity: coin.quantity,
        });
        console.log(`Added ${coin.quantity}x £${(coin.value / 100).toFixed(2)} coins`);
      } else {
        // Update quantity
        await db.execute(sql`
          UPDATE coin_inventory 
          SET quantity = ${coin.quantity} 
          WHERE sponsor_id = ${sponsorProfileId} AND coin_value = ${coin.value}
        `);
        console.log(`Updated ${coin.quantity}x £${(coin.value / 100).toFixed(2)} coins`);
      }
    }

    console.log("\nMock data seeded successfully!");
    console.log("Demo sponsor has 50 coins worth £85 total");
    console.log("Players can now start sessions and find coins to collect.");
    
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
