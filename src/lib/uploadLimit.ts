// src/lib/uploadLimit.ts
//
// Upload limits come from the user's plan (profiles table, kept in sync
// by the Stripe webhook). The count is scoped to uploads made SINCE
// plan_started_at, not a lifetime count -- this means upgrading plans
// always gives a fresh quota rather than carrying over uploads used on a
// previous (e.g. Free) plan. plan_started_at is set by the webhook every
// time the plan changes (upgrade, downgrade, or cancellation back to
// free), so this naturally resets on any plan transition.
//
// Note: this is still not a rolling monthly reset for Starter -- it's
// "since you started this specific plan." A true monthly cycle (resets
// every 30 days even without a plan change) would need to track Stripe's
// current_period_start instead. Flagged here as a reasonable future
// improvement, not silently shipped as something it isn't.

import { createClient } from "@/lib/supabase/server";
import { PLANS, PlanId } from "@/lib/stripe";

export interface UploadLimitCheck {
  allowed: boolean;
  count: number;
  limit: number | null; // null = unlimited
  plan: PlanId;
}

export async function checkUploadLimit(userId: string): Promise<UploadLimitCheck> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("plan, plan_started_at")
    .eq("id", userId)
    .single();

  if (profileError) {
    console.error("Failed to load profile for upload limit check:", profileError);
  }

  const plan: PlanId = (profile?.plan as PlanId) ?? "free";
  const planConfig = PLANS[plan];
  const planStartedAt = profile?.plan_started_at ?? null;

  // Unlimited plans skip the count query entirely -- no point counting
  // rows just to immediately ignore the number.
  if (planConfig.uploadLimit === null) {
    return { allowed: true, count: 0, limit: null, plan };
  }

  let query = supabase
    .from("uploads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  // Only count uploads made since this plan started, so upgrading always
  // grants a fresh quota instead of inheriting usage from a prior plan.
  if (planStartedAt) {
    query = query.gte("created_at", planStartedAt);
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to check upload count:", error);
    // Fail open on a transient DB error rather than blocking a paying-
    // adjacent user over a hiccup we caused, not them.
    return { allowed: true, count: 0, limit: planConfig.uploadLimit, plan };
  }

  const used = count ?? 0;
  return {
    allowed: used < planConfig.uploadLimit,
    count: used,
    limit: planConfig.uploadLimit,
    plan,
  };
}