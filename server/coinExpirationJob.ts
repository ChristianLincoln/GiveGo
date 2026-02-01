import { storage } from "./storage";

// Coin expiration job - runs every minute
export async function startCoinExpirationJob() {
  console.log("Starting coin expiration job...");
  
  const runExpirationCheck = async () => {
    try {
      const expiredCoins = await storage.getExpiredCoins();
      
      for (const coin of expiredCoins) {
        console.log(`Expiring coin ${coin.id}, returning to inventory`);
        
        // Mark coin as expired
        await storage.updateCoinStatus(coin.id, "expired");
        
        // Return coin to inventory
        await storage.addToInventory(coin.sponsorId, coin.coinValue, 1);
        
        // Refund escrow
        await storage.refundEscrow(coin.id);
      }
      
      if (expiredCoins.length > 0) {
        console.log(`Expired ${expiredCoins.length} coins`);
      }
    } catch (error) {
      console.error("Error in coin expiration job:", error);
    }
  };
  
  // Run immediately
  await runExpirationCheck();
  
  // Then run every minute
  setInterval(runExpirationCheck, 60 * 1000);
}
