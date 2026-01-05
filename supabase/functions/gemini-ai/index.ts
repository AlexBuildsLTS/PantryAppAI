import { createClient } from '@supabase/supabase-js';
import { decryptMessage } from '../_shared/crypto';
import { corsHeaders } from '../_shared/cors';

declare const Deno: any;

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, image, userId } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    let apiKey = Deno.env.get('GEMINI_API_KEY');

    if (userId) {
      const { data: userSecret } = await supabaseAdmin
        .from('user_secrets')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('service', 'gemini')
        .maybeSingle();
      if (userSecret?.api_key_encrypted)
        apiKey = decryptMessage(userSecret.api_key_encrypted);
    }

    if (!apiKey) throw new Error('No API key available');

    const parts = [{ text: prompt }];
    if (image)
      parts.push({
        inline_data: { mime_type: 'image/jpeg', data: image },
      } as any);

    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
      }),
    });

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return new Response(
      JSON.stringify({ text: aiText || 'No response generated.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ text: `Edge Error: ${err.message}` }),
      { headers: corsHeaders }
    );
  }
});
