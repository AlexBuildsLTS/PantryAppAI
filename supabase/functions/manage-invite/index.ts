import { createClient } from '@supabase/supabase-js';
import { corsHeaders as _corsHeaders } from '../_shared/cors.ts';
import { decryptMessage as _decryptMessage } from '../_shared/crypto.ts';

declare const Deno: any;

// Helper to generate high-entropy token
function generateToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  try {
    // 1. Init Super-Admin Client (Bypass RLS for secure linking)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Get User Auth Context
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Unauthorized access to sync protocol.');

    const { action, tokenToAccept } = await req.json();

    // --- ACTION: GENERATE INVITE ---
    if (action === 'GENERATE') {
      const newToken = generateToken();
      // Expires in 24 hours
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabaseAdmin
        .from('invitations')
        .insert({
          created_by: user.id,
          token: newToken,
          expires_at: expiresAt
        });

      if (insertError) throw insertError;
      return new Response(JSON.stringify({ token: newToken, expiresAt }), { headers: { 'Content-Type': 'application/json' } });
    }

    // --- ACTION: ACCEPT INVITE (Scanning QR) ---
    if (action === 'ACCEPT') {
      if (!tokenToAccept) throw new Error("Missing sync token.");

      // Find valid, unexpired invitation
      const { data: invite, error: fetchError } = await supabaseAdmin
        .from('invitations')
        .select('*')
        .eq('token', tokenToAccept)
        .is('used_by', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (fetchError || !invite) throw new Error("Invalid or expired sync token.");

      // LINKING LOGIC:
      // In this simplified architecture, we update the scanner's profile role to SECONDARY_CAREGIVER.
      // A full enterprise solution would use a many-to-many `baby_caregivers` table.
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'SECONDARY_CAREGIVER', metadata: { linked_to: invite.created_by } })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mark token as used
      await supabaseAdmin.from('invitations').update({ used_by: user.id }).eq('id', invite.id);

      return new Response(JSON.stringify({ success: true, linkedTo: invite.created_by }), { headers: { 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid sync action defined.");

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
})
function serve(arg0: (req: Request) => Promise<Response>) {
  throw new Error('Function not implemented.');
}