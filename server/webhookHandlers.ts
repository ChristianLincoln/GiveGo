import { getStripeSync, getUncachableStripeClient, getStripeWebhookSecret } from './stripeClient';
import { storage } from './storage';

// Track processed event IDs for idempotency (in-memory, could be persisted to DB)
const processedEvents = new Set<string>();

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    
    // Verify and process checkout.session.completed for coin purchases
    try {
      const stripe = await getUncachableStripeClient();
      let event;
      
      try {
        // Try to get webhook secret for signature verification
        const webhookSecret = await getStripeWebhookSecret();
        if (webhookSecret) {
          event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } else {
          // Fallback to parsing without verification (development only)
          console.warn('Webhook secret not available, parsing without verification');
          event = JSON.parse(payload.toString('utf8'));
        }
      } catch (verifyError) {
        console.warn('Webhook verification failed, falling back to basic parsing:', verifyError);
        event = JSON.parse(payload.toString('utf8'));
      }
      
      // Idempotency check - skip if already processed
      if (processedEvents.has(event.id)) {
        console.log(`Webhook event ${event.id} already processed, skipping`);
        return;
      }
      
      if (event.type === 'checkout.session.completed') {
        await WebhookHandlers.handleCheckoutCompleted(event.data.object, event.id);
      }
      
      // Mark as processed (keep only last 1000 events to prevent memory bloat)
      processedEvents.add(event.id);
      if (processedEvents.size > 1000) {
        const firstId = processedEvents.values().next().value;
        processedEvents.delete(firstId);
      }
    } catch (error) {
      console.error('Error processing checkout webhook:', error);
    }
  }
  
  static async handleCheckoutCompleted(session: any, eventId: string): Promise<void> {
    const metadata = session.metadata;
    if (!metadata?.sponsorId || !metadata?.coinValue || !metadata?.quantity) {
      console.log('Checkout session missing required metadata for coin purchase');
      return;
    }
    
    const sponsorId = metadata.sponsorId;
    const coinValue = parseInt(metadata.coinValue);
    const quantity = parseInt(metadata.quantity);
    
    console.log(`Processing coin purchase (event ${eventId}): ${quantity}x £${(coinValue / 100).toFixed(2)} for sponsor ${sponsorId}`);
    
    try {
      // Add coins to inventory
      await storage.addToInventory(sponsorId, coinValue, quantity);
      
      // Update sponsor purchased count
      const sponsorProfile = await storage.getSponsorProfileById(sponsorId);
      if (sponsorProfile) {
        await storage.updateSponsorPurchasedCount(sponsorProfile.userId, quantity);
      }
      
      console.log(`Added ${quantity} coins to sponsor ${sponsorId} inventory`);
    } catch (error) {
      console.error(`Failed to process coin purchase for sponsor ${sponsorId}:`, error);
      throw error;
    }
  }
}
