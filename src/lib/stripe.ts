// src/lib/stripe.ts
//
// Single source of truth for plan limits, Stripe Price IDs, and the
// Stripe client itself. Update PLANS here when prices change in the
// Stripe dashboard rather than hunting through route handlers.

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
});

export type PlanId = "free" | "starter" | "pro" | "early_bird";

export interface PlanConfig {
  id: PlanId;
  name: string;
  // null = unlimited uploads
  uploadLimit: number | null;
  // Stripe Price ID — null for the free plan, which has no Stripe price.
  // Read from env so the actual IDs live in .env.local, not committed code.
  priceId: string | null;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    uploadLimit: 3,
    priceId: null,
  },
  starter: {
    id: "starter",
    name: "Starter",
    uploadLimit: 20,
    priceId: process.env.STRIPE_PRICE_STARTER!,
  },
  pro: {
    id: "pro",
    name: "Pro",
    uploadLimit: null, // unlimited
    priceId: process.env.STRIPE_PRICE_PRO!,
  },
  early_bird: {
    id: "early_bird",
    name: "Early-bird",
    uploadLimit: null, // unlimited — same as Pro, different billing cadence
    priceId: process.env.STRIPE_PRICE_EARLY_BIRD!,
  },
};

/** Reverse lookup: given a Stripe Price ID, find which plan it maps to. */
export function planFromPriceId(priceId: string): PlanId | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.priceId === priceId) return plan.id;
  }
  return null;
}