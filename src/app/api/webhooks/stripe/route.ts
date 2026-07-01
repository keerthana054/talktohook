import { NextRequest, NextResponse } from "next/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Stripe webhooks must receive the raw, unparsed request body to verify
// the signature -- Next.js's default body parsing would break this, so
// we explicitly opt the route out of it.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // Fires once, right after a successful Checkout. This is where we
      // learn the Stripe customer ID for the first time and link it to
      // the Supabase user via the metadata we set in /api/checkout.
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;

        if (!userId || !plan) {
          console.error("checkout.session.completed missing userId or plan in metadata", session.id);
          break;
        }

        const subscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

        await supabase.from("profiles").update({
          plan,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          // Mark when this paid plan started so checkUploadLimit() only
          // counts uploads made AFTER the upgrade -- otherwise uploads
          // used while on Free would eat into the new paid quota.
          plan_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", userId);

        break;
      }

      // Fires on renewals, plan changes, and cancellations-at-period-end.
      // This is the long-term source of truth for subscription status --
      // checkout.session.completed only covers the initial purchase.
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (!userId) {
          // Fall back to looking up by customer ID if metadata wasn't
          // carried over (e.g. subscription updated outside our flow,
          // like directly in the Stripe dashboard).
          const customerId = typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();

          if (!profile) {
            console.error("Could not resolve user for subscription update", subscription.id);
            break;
          }

          await updateProfileFromSubscription(supabase, profile.id, subscription);
          break;
        }

        await updateProfileFromSubscription(supabase, userId, subscription);
        break;
      }

      // Subscription fully ends (canceled, payment failed too many times,
      // etc). Drop them back to the free plan rather than leaving stale
      // paid-plan access.
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

        await supabase.from("profiles").update({
          plan: "free",
          subscription_status: "canceled",
          plan_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("stripe_customer_id", customerId);

        break;
      }

      default:
        // Unhandled event types are expected and fine to ignore -- Stripe
        // sends many event types we don't need to act on.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    // Return 500 so Stripe retries this event later rather than silently
    // dropping a plan change.
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}

async function updateProfileFromSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;
  const plan = priceId ? planFromPriceId(priceId) : null;

  await supabase.from("profiles").update({
    plan: plan ?? undefined, // don't overwrite plan if we can't resolve it
    subscription_status: subscription.status,
    current_period_end: new Date(subscription.items.data[0].current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", userId);
}