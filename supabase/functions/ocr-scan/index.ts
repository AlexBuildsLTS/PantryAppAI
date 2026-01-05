import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';
import { decryptMessage } from '../_shared/crypto';

declare const Deno: any;

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const { imageBase64, userId } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let apiKey = Deno.env.get('GEMINI_API_KEY');
    if (userId) {
      const { data: secret } = await supabase
        .from('user_secrets')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('service', 'gemini')
        .maybeSingle();
      if (secret?.api_key_encrypted)
        apiKey = decryptMessage(secret.api_key_encrypted);
    }

    if (!apiKey) throw new Error('No API Key configured.');

    const prompt = `Analyze this receipt. Return JSON ONLY: {"merchant": string, "date": YYYY-MM-DD, "total": number, "currency": string, "category": string}`;
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const result = JSON.parse(
      data.candidates?.[0]?.content?.parts?.[0]?.text
        .replace(/```json|```/g, '')
        .trim()
    );

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
