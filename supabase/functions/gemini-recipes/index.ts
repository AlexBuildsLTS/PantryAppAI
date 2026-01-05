import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors';

declare const Deno: any;

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: items } = await supabaseClient
      .from('pantry_items')
      .select('name');
    const inventoryList = items?.map((i) => i.name).join(', ') || '';

    const prompt = `Based on these ingredients: [${inventoryList}], suggest 3 recipes. Return ONLY a JSON array.`;

    const response = await fetch(
      `${GEMINI_API_URL}?key=${Deno.env.get('GEMINI_API_KEY')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );

    const data = await response.json();
    const recipes = JSON.parse(data.candidates[0].content.parts[0].text);

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});
