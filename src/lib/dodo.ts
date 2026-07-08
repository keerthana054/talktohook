// lib/dodo.ts  (replaces lib/polar.ts — same shape your code already expects)
import DodoPayments from "dodopayments";

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
  environment: (process.env.DODO_ENVIRONMENT as "test_mode" | "live_mode") ?? "live_mode",
});

export type PlanId = "free" | "starter" | "pro" | "early_bird";

export interface PlanConfig {
  id: PlanId;
  name: string;
  uploadLimit: number | null;      // null = unlimited
  productId: string | undefined;   // Dodo product id (pdt_...), undefined for free
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free:       { id: "free",       name: "Free",       uploadLimit: 3,    productId: undefined },
  starter:    { id: "starter",    name: "Starter",    uploadLimit: 20,   productId: process.env.DODO_PRODUCT_STARTER },
  pro:        { id: "pro",        name: "Pro",        uploadLimit: null, productId: process.env.DODO_PRODUCT_PRO },
  early_bird: { id: "early_bird", name: "Early-bird", uploadLimit: null, productId: process.env.DODO_PRODUCT_EARLY_BIRD },
};

export function planFromProductId(productId: string | null | undefined): PlanId | null {
  if (!productId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.productId && plan.productId === productId) return plan.id;
  }
  return null;
}