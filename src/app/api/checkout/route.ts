// app/api/checkout/route.ts  (or wherever your current file lives)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { polar, PLANS, PlanId } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "You need to be signed in to upgrade." }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: PlanId };
    const planConfig = PLANS[plan];

    if (!planConfig || !planConfig.productId) {
      return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

    const checkout = await polar.checkouts.create({
      products: [planConfig.productId],
      // Your Supabase user id. Polar creates/reuses a Customer keyed on this,
      // so no stripe_customer_id-style lookup or de-dupe is needed. On webhooks
      // it comes back as customer.externalId.
      externalCustomerId: user.id,
      customerEmail: user.email ?? undefined,
      // Same as your Stripe metadata — the webhook reads supabase_user_id to know
      // whose plan to flip, rather than matching on email.
      metadata: { supabase_user_id: user.id, plan },
      successUrl: `${origin}/billing/success?checkout_id={CHECKOUT_ID}`,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Couldn't start checkout: ${message}` }, { status: 500 });
  }
}