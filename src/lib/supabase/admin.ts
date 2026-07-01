// src/lib/supabase/admin.ts
//
// Service-role Supabase client. This BYPASSES Row Level Security, so it
// must only ever be used in trusted server-side contexts that aren't
// acting on behalf of a specific logged-in request — namely the Stripe
// webhook handler, which needs to update a user's plan based on a Stripe
// event, not based on who's currently making a request (there is no
// "current user" in a webhook).
//
// NEVER import this into anything that runs in the browser or that
// handles a normal user request — use src/lib/supabase/server.ts for that,
// which respects RLS and scopes queries to the authenticated user.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}