// lib/polar.ts
import { Polar } from "@polar-sh/sdk";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "production",
});

export type PlanId = "free" | "starter" | "pro" | "early_bird";

export interface PlanConfig {
  id: PlanId;
  name: string;
  uploadLimit: number | null;     // null = unlimited
  productId: string | undefined;  // undefined for free (no Polar product)
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free:       { id: "free",       name: "Free",       uploadLimit: 3,    productId: undefined },
  starter:    { id: "starter",    name: "Starter",    uploadLimit: 20,   productId: process.env.POLAR_PRODUCT_STARTER },
  pro:        { id: "pro",        name: "Pro",        uploadLimit: null, productId: process.env.POLAR_PRODUCT_PRO },
  early_bird: { id: "early_bird", name: "Early-bird", uploadLimit: null, productId: process.env.POLAR_PRODUCT_EARLY_BIRD },
};

/** Reverse lookup: given a Polar product ID, find which plan it maps to. */
export function planFromProductId(productId: string | null | undefined): PlanId | null {
  if (!productId) return null;
  for (const plan of Object.values(PLANS)) {
    if (plan.productId && plan.productId === productId) return plan.id;
  }
  return null;
}