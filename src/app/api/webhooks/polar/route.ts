// app/api/webhooks/polar/route.ts   ← this exact path must match the endpoint you register in Polar
import { Webhooks } from "@polar-sh/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { planFromProductId, type PlanId } from "@/lib/polar";

// Best-effort shape of the subscription payload (Polar's SDK types shift
// between versions; this keeps us honest without fighting the compiler).
type PolarSub = {
  id: string;
  productId?: string;
  currentPeriodEnd?: string | Date | null;
  customer?: { id?: string; externalId?: string | null; email?: string | null };
  metadata?: Record<string, string | undefined>;
};

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,

  onPayload: async (payload) => {
    const supabase = createAdminClient();

    switch (payload.type) {
      // Initial activation + renewals + plan changes.
      case "subscription.active":
      case "subscription.updated": {
        const sub = payload.data as unknown as PolarSub;
        const userId = sub.customer?.externalId ?? sub.metadata?.supabase_user_id;

        if (!userId) {
          console.error("polar subscription event: no resolvable user", sub.id);
          break;
        }

        const plan: PlanId | undefined =
          (sub.metadata?.plan as PlanId | undefined) ??
          planFromProductId(sub.productId) ??
          undefined;

        // Only reset the quota window when the plan ACTUALLY changes.
        // Your Stripe flow stamps plan_started_at on the initial purchase,
        // never on renewals — re-stamping every renewal would silently hand
        // Starter users a fresh 20 uploads each cycle. So compare first.
        const { data: current } = await supabase
          .from("profiles").select("plan").eq("id", userId).single();
        const planChanged = plan !== undefined && plan !== current?.plan;

        await supabase.from("profiles").update({
          plan,                                  // undefined key is dropped → leaves plan as-is
          polar_customer_id: sub.customer?.id,
          polar_subscription_id: sub.id,
          subscription_status: "active",
          ...(planChanged ? { plan_started_at: new Date().toISOString() } : {}),
          current_period_end: sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toISOString()
            : undefined,
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        break;
      }

      // Access has actually ended (revoked = gone, not "canceled at period end").
      // Mirrors your customer.subscription.deleted → drop to free.
      case "subscription.revoked": {
        const sub = payload.data as unknown as PolarSub;
        const userId = sub.customer?.externalId ?? sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase.from("profiles").update({
          plan: "free",
          subscription_status: "canceled",
          plan_started_at: new Date().toISOString(),  // fresh free-tier window
          updated_at: new Date().toISOString(),
        }).eq("id", userId);
        break;
      }

      default:
        break; // ignore the rest, same as your Stripe default
    }
  },
});