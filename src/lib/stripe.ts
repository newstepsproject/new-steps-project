import Stripe from 'stripe';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('Stripe secret key is not defined. Payment functionality will not work.');
}

// Create Stripe instance
const stripe = new Stripe(stripeSecretKey || 'dummy_key_for_typescript', {
  apiVersion: '2025-04-30.basil', // Use the latest supported API version
});

/**
 * Create a payment intent for shipping fees
 * @param amount - Amount in dollars
 * @param orderId - Order ID for metadata
 * @param customerEmail - Customer email for receipt
 * @returns The created payment intent
 */
export async function createPaymentIntent(
  amount: number,
  orderId: string,
  customerEmail: string
) {
  // Convert amount to cents as Stripe requires
  const amountInCents = Math.round(amount * 100);

  return await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    metadata: {
      orderId,
      type: 'shipping_fee',
    },
    receipt_email: customerEmail,
    description: `Shipping fee for order ${orderId}`,
  });
}

/**
 * Create a Stripe Checkout Session for shipping fees
 * @param amount - Amount in dollars
 * @param orderId - Order ID for reference
 * @param customerEmail - Customer email
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl - URL to redirect after cancelled payment
 * @returns The created checkout session
 */
export async function createCheckoutSession(
  amount: number,
  orderId: string,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  // Convert amount to cents
  const amountInCents = Math.round(amount * 100);

  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Shipping Fee',
            description: `Shipping fee for order ${orderId}`,
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      orderId,
      type: 'shipping_fee',
    },
  });
}

/**
 * Verify a Stripe webhook signature
 * @param payload - Request body as string
 * @param signature - Stripe signature header
 * @returns Whether the signature is valid
 */
export function verifyWebhookSignature(payload: string, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret is not defined');
    return false;
  }

  try {
    stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return true;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return false;
  }
}

export default stripe; 