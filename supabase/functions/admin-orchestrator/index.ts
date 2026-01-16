import { createClient } from "@supabase/supabase-js"

/**
 * PROJECT CRADLE: ADMIN ORCHESTRATOR
 * Handles high-level system analytics for the Admin/Support pages.
 */

import { corsHeaders } from "../_shared/cors.ts";
import { ensureAdmin, AdminAuthError } from "../_shared/auth.ts";

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await ensureAdmin(req);
    const { action } = await req.json();

    if (action === 'GET_SYSTEM_STATS') {
      const { count: userCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
      const { count: ticketCount } = await supabaseAdmin.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'OPEN');

      return new Response(JSON.stringify({
        totalUsers: userCount,
        openTickets: ticketCount
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response("Invalid Action", { status: 400, headers: corsHeaders });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "System Failure";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});