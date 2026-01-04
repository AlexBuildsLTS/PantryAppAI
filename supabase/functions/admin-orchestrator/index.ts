import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"

/**
 * PROJECT CRADLE: ADMIN ORCHESTRATOR
 * Handles high-level system analytics for the Admin/Support pages.
 */

serve(async (req: Request) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { action } = await req.json();

    if (action === 'GET_SYSTEM_STATS') {
      const { data: userCount } = await supabaseAdmin.from('profiles').select('id', { count: 'exact' });
      const { data: ticketCount } = await supabaseAdmin.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'OPEN');
      
      return new Response(JSON.stringify({ 
        totalUsers: userCount?.length, 
        openTickets: ticketCount 
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response("Invalid Action", { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "System Failure";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});