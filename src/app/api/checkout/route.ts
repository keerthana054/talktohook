// app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dodo, PLANS, PlanId } from "@/lib/dodo";

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

    if (!user.email) {
      return NextResponse.json({ error: "Your account is missing an email." }, { status: 400 });
    }

    const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

    const session = await dodo.checkoutSessions.create({
      product_cart: [{ product_id: planConfig.productId, quantity: 1 }],
      customer: { email: user.email },   // now a plain string — error clears
      metadata: { supabase_user_id: user.id, plan },
      return_url: `${origin}/billing/success`,
    });

    // Dodo returns `checkout_url`; we keep the response key `url` so the
    // existing UpgradeButton (which reads data.url) works unchanged.
    return NextResponse.json({ url: session.checkout_url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Couldn't start checkout: ${message}` }, { status: 500 });
  }
}