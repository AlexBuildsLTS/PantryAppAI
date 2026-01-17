import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: any;

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS')
    return new Response('ok', { headers: corsHeaders });

  try {
    let body, householdId;
    try {
      body = await req.json();
      householdId = body.householdId;
    } catch (parseErr) {
      return new Response(JSON.stringify({
        error: 'Invalid or missing JSON body',
        received: await req.text()
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    if (!householdId) {
      return new Response(JSON.stringify({
        error: 'Missing householdId in request body',
        received: body
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Only fetch pantry items for the given household
    const { data: items, error: pantryError } = await supabaseClient
      .from('pantry_items')
      .select('name')
      .eq('household_id', householdId);
    if (pantryError) throw pantryError;

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
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 400,
      headers: corsHeaders,
    });
  }
});