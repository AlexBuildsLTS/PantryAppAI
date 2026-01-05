import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: any;

// Constants
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXCLUDED_STATUSES = '("consumed","wasted")';

/**
 * Interface for pantry items with expiry information and associated profile push token.
 */
interface ExpiryItem {
  name: string;
  addedBy: string;
  profiles: { push_token: string | null } | null;
}

/**
 * Interface for Expo push notification payload.
 */
interface PushNotification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: { screen: string };
}

/**
 * Creates a Supabase client using environment variables.
 * @throws {Error} If required environment variables are missing.
 * @returns {SupabaseClient} The configured Supabase client.
 */
function createSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Calculates tomorrow's date in YYYY-MM-DD format (UTC).
 * @returns {string} Tomorrow's date string.
 */
function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // Use UTC to avoid timezone issues
  const dateStr = tomorrow.toISOString().split('T')[0];
  return dateStr!;
}

/**
 * Fetches pantry items expiring tomorrow and not consumed or wasted.
 * @param {SupabaseClient} supabase - The Supabase client instance.
 * @param {string} tomorrowStr - Date string for tomorrow.
 * @returns {Promise<ExpiryItem[]>} List of expiring items.
 * @throws {Error} If the query fails.
 */
async function fetchExpiringItems(supabase: SupabaseClient, tomorrowStr: string): Promise<ExpiryItem[]> {
    const { data, error } = await supabase
    .from('pantry_items')
    .select('name, added_by, profiles:added_by (push_token)')
    .eq('expiry_date', tomorrowStr)
    .not('status', 'in', EXCLUDED_STATUSES);

  if (error) {
    throw new Error(`Failed to fetch expiring items: ${error.message}`);
  }

  return (data as unknown as ExpiryItem[]) || [];
}

/**
 * Creates push notification payloads for items with valid push tokens.
 * @param {ExpiryItem[]} items - List of expiring items.
 * @returns {PushNotification[]} List of notifications.
 */
function createNotifications(items: ExpiryItem[]): PushNotification[] {
  return items
    .filter((item) => item.profiles?.push_token)
    .map((item) => ({
      to: item.profiles!.push_token!, // Safe due to filter
      sound: 'default',
      title: '🥬 Expiration Alert',
      body: `Your "${item.name}" expires tomorrow! Cook it today to avoid waste.`,
      data: { screen: 'Inventory' },
    }));
}

/**
 * Sends push notifications to Expo's push service.
 * @param {PushNotification[]} notifications - List of notifications to send.
 * @throws {Error} If the fetch request fails.
 */
async function sendNotifications(notifications: PushNotification[]): Promise<void> {
  if (notifications.length === 0) {
    return; // No notifications to send
  }

  const response = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notifications),
  });

  if (!response.ok) {
    throw new Error(`Failed to send notifications: ${response.status} ${response.statusText}`);
  }
}

/**
 * Main handler for the expiry alerts function.
 * @param {Request} req - The incoming request.
 * @returns {Promise<Response>} The HTTP response.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createSupabaseClient();
    const tomorrowStr = getTomorrowDateString();

    const expiringItems = await fetchExpiringItems(supabase, tomorrowStr);
    const notifications = createNotifications(expiringItems);

    await sendNotifications(notifications);

    return new Response(JSON.stringify({ sent: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});