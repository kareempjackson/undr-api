/**
 * Script to check webhook configuration
 * Run with: node scripts/check-webhooks.js
 */

require("dotenv").config();

console.log("Checking Stripe configuration...");
console.log("-------------------------------");

// Check if .env variables are loaded
console.log("STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
console.log(
  "STRIPE_PUBLISHABLE_KEY exists:",
  !!process.env.STRIPE_PUBLISHABLE_KEY
);
console.log(
  "STRIPE_WEBHOOK_SECRET exists:",
  !!process.env.STRIPE_WEBHOOK_SECRET
);

// Display actual values safely (partial)
if (process.env.STRIPE_SECRET_KEY) {
  const key = process.env.STRIPE_SECRET_KEY;
  console.log("STRIPE_SECRET_KEY starts with:", key.substring(0, 7) + "...");
}

if (process.env.STRIPE_WEBHOOK_SECRET) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  console.log(
    "STRIPE_WEBHOOK_SECRET starts with:",
    webhookSecret.substring(0, 7) + "..."
  );
}

console.log("\nWebhook Endpoints:");
console.log("-------------------------------");
console.log("Local endpoint: http://localhost:3001/payments/stripe/webhook");
console.log(
  "Make sure Stripe is configured to send webhooks to your publicly accessible URL"
);
console.log("For development, use ngrok: npx ngrok http 3001");

console.log("\nTo setup webhook in Stripe Dashboard:");
console.log("1. Go to https://dashboard.stripe.com/webhooks");
console.log('2. Click "Add endpoint"');
console.log("3. Enter your ngrok URL + /payments/stripe/webhook");
console.log(
  "4. Select events: payment_intent.succeeded, payment_intent.payment_failed"
);
console.log(
  "5. Copy the webhook secret to your .env file as STRIPE_WEBHOOK_SECRET"
);
