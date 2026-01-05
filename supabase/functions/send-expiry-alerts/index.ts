import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';

declare const Deno: any;

interface ExpiryItem {
  name: string;
  added_by: string;
  profiles: { push_token: string | null } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: expiringItems, error } = await supabase
      .from('pantry_items')
      .select(`name, added_by, profiles:added_by (push_token)`)
      .eq('expiry_date', tomorrowStr)
      .not('status', 'in', '("consumed","wasted")');

    if (error) throw error;

    const items = expiringItems as unknown as ExpiryItem[];
    const notifications = items
      .filter((item) => item.profiles?.push_token)
      .map((item) => ({
        to: item.profiles?.push_token,
        sound: 'default',
        title: '🥬 Expiration Alert',
        body: `Your "${item.name}" expires tomorrow! Cook it today to avoid waste.`,
        data: { screen: 'Inventory' },
      }));

    if (notifications.length > 0) {
      await fetch('https://exp.host/--npm i crypto-js/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });
    }

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal Error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
