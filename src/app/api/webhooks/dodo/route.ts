// app/api/webhooks/dodo/route.ts   ← register this exact path in the Dodo dashboard
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { planFromProductId, type PlanId } from "@/lib/dodo";

export const runtime = "nodejs";

const wh = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_SECRET!);

export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Standard Webhooks verification: three webhook-* headers, raw body.
  let evt: any;
  try {
    evt = wh.verify(raw, {
      "webhook-id": req.headers.get("webhook-id") ?? "",
      "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
      "webhook-signature": req.headers.get("webhook-signature") ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  // Keep this while validating with your first real events, then remove.
  console.log("DODO EVENT:", evt.type, JSON.stringify(evt.data, null, 2));

  const supabase = createAdminClient();
  const data = evt.data ?? {};
  const userId = data.metadata?.supabase_user_id;
  const plan = (data.metadata?.plan as PlanId | undefined) ??
    planFromProductId(data.product_id) ?? undefined;

  try {
    switch (evt.type) {
      case "subscription.active":
      case "subscription.renewed":
      case "subscription.updated": {
        if (!userId) { console.error("dodo event without supabase_user_id"); break; }

        const { data: current } = await supabase
          .from("profiles").select("plan").eq("id", userId).single();
        const planChanged = plan !== undefined && plan !== current?.plan;

        await supabase.from("profiles").update({
          plan,
          dodo_customer_id: data.customer?.customer_id,
          dodo_subscription_id: data.subscription_id,
          subscription_status: "active",
          ...(planChanged ? { plan_started_at: new Date().toISOString() } : {}),
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        break;
      }

      // Access ended: on_hold (failed renewals), cancelled, or expired → free.
      case "subscription.on_hold":
      case "subscription.cancelled":
      case "subscription.expired":
      case "subscription.failed": {
        if (!userId) break;
        await supabase.from("profiles").update({
          plan: "free",
          subscription_status: "canceled",
          plan_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        break;
      }

      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error handling dodo event ${evt.type}:`, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}