import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PLANS, PlanId } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You need to be signed in to upgrade." }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: PlanId };
    const planConfig = PLANS[plan];

    if (!planConfig || !planConfig.priceId) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    // Reuse an existing Stripe customer if this user already has one
    // (e.g. they downgraded to free and are now upgrading again) instead
    // of creating duplicate customer records in Stripe for the same person.
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: profile?.stripe_customer_id ?? undefined,
      customer_email: profile?.stripe_customer_id ? undefined : user.email,
      // Stash the Supabase user id + intended plan on the session so the
      // webhook can identify who to update without guessing from email
      // (emails can theoretically not match between Supabase and Stripe
      // if someone signed up with a different address than they pay with).
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: { metadata: { supabase_user_id: user.id, plan } },
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Couldn't start checkout: ${message}` }, { status: 500 });
  }
}