/**
 * @module pantry-ai-scanner
 * Enterprise-grade vision processing using Gemini 1.5 Flash.
 * Strictly typed and lint-compliant for Deno production environments.
 */
import { corsHeaders } from '../_shared/cors.ts';

declare const Deno: any;

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

Deno.serve(async (req: Request) => {
  // Handle Preflight for Cross-Origin Resource Sharing
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      throw new Error('Missing image payload');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Edge configuration missing: GEMINI_API_KEY');
    }

    // High-precision prompt for food recognition
    const systemPrompt = `Analyze food image. Return ONLY a JSON array: [{"name": string, "expiry_days": number, "location": "fridge"|"pantry"|"freezer"}]`;
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { inline_data: { mime_type: 'image/jpeg', data: cleanBase64 } },
            ],
          },
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini API failure: ${errorBody}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error('AI failed to return structured content');
    }

    const items = JSON.parse(resultText);

    return new Response(JSON.stringify({ items }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    // Type-safe error handling for Deno
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown server error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});