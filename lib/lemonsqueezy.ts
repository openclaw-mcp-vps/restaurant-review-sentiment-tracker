// Legacy file name kept for compatibility with existing architecture docs.
// This app uses Stripe hosted payment links directly.

export function getStripeHostedCheckoutLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";
}

export function isStripeCheckoutConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.startsWith("https://buy.stripe.com/"));
}
