import process from 'node:process'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'
import { tierForStripeStatus, toDbSubscriptionStatus } from '../core/billing'
import { db } from '../db'
import { subscriptions, users } from '../db/schema'

// Thrown when a billing action is attempted before the STRIPE_* env is set, so
// the API can answer with a clean 503 instead of a raw crash. The integration
// is dormant-until-keyed: no key, no billing, but nothing else breaks.
export class BillingNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`Billing is not configured (${missing} is not set).`)
    this.name = 'BillingNotConfiguredError'
  }
}

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new BillingNotConfiguredError(name)
  return value
}

let client: Stripe | null = null
function stripe(): Stripe {
  if (!client) {
    // Fetch transport works on both Node and edge runtimes and matches the
    // rest of the app's fetch-based server code.
    client = new Stripe(env('STRIPE_SECRET_KEY'), {
      httpClient: Stripe.createFetchHttpClient(),
    })
  }
  return client
}

function appOrigin(): string {
  return process.env.RP_ORIGIN ?? 'http://localhost:5173'
}

type SubscriptionPatch = Partial<typeof subscriptions.$inferInsert>

// One subscription row per user; upsert by user id (no unique constraint needed
// so the stub table's schema is unchanged).
async function upsertSubscription(
  userId: string,
  patch: SubscriptionPatch,
): Promise<void> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  if (existing) {
    await db
      .update(subscriptions)
      .set(patch)
      .where(eq(subscriptions.id, existing.id))
  } else {
    await db.insert(subscriptions).values({ userId, ...patch })
  }
}

function customerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customer === 'string' ? customer : customer.id
}

// Start a hosted Checkout for the Pro plan; returns the redirect URL.
export async function createCheckoutUrl(userId: string): Promise<string> {
  const s = stripe()
  const price = env('STRIPE_PRICE_ID')

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
  if (!user) throw new Error('user not found')

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  let stripeCustomerId = existing?.stripeCustomerId ?? null
  if (!stripeCustomerId) {
    const customer = await s.customers.create({
      email: user.email,
      metadata: { userId },
    })
    stripeCustomerId = customer.id
    await upsertSubscription(userId, { stripeCustomerId })
  }

  const session = await s.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price, quantity: 1 }],
    client_reference_id: userId,
    subscription_data: { metadata: { userId } },
    allow_promotion_codes: true,
    success_url: `${appOrigin()}/app/settings?checkout=success`,
    cancel_url: `${appOrigin()}/app/settings?checkout=cancelled`,
  })
  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  return session.url
}

// Open the Stripe Billing Portal so the user can manage/cancel their plan.
export async function createBillingPortalUrl(userId: string): Promise<string> {
  const s = stripe()
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })
  if (!sub?.stripeCustomerId) {
    throw new Error('No subscription on file to manage.')
  }
  const session = await s.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appOrigin()}/app/settings`,
  })
  return session.url
}

// Reconcile a user's entitlement + subscription row from a Stripe subscription.
async function applySubscription(
  userId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const periodEnd = (sub as { current_period_end?: number }).current_period_end
  await db
    .update(users)
    .set({ tier: tierForStripeStatus(sub.status) })
    .where(eq(users.id, userId))
  await upsertSubscription(userId, {
    tier: 'pro',
    status: toDbSubscriptionStatus(sub.status),
    provider: 'stripe',
    stripeCustomerId: customerId(sub.customer),
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  })
}

async function userIdForCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer,
): Promise<string | null> {
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeCustomerId, customerId(customer)),
  })
  return row?.userId ?? null
}

// Verify the signature and reconcile entitlements. Throws on a bad signature
// (→ 400) so Stripe retries transient failures.
export async function handleStripeWebhook(
  rawBody: string,
  signature: string,
): Promise<void> {
  const s = stripe()
  const event = await s.webhooks.constructEventAsync(
    rawBody,
    signature,
    env('STRIPE_WEBHOOK_SECRET'),
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.userId
      if (!userId || !session.subscription) break
      const subId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id
      await applySubscription(userId, await s.subscriptions.retrieve(subId))
      break
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId =
        sub.metadata?.userId ?? (await userIdForCustomer(sub.customer))
      if (userId) await applySubscription(userId, sub)
      break
    }
    default:
      break
  }
}
