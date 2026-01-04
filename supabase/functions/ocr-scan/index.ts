// deno-lint-ignore-file no-explicit-any
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { decryptMessage } from '../_shared/crypto.ts';

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, userId } = await req.json();
    if (!imageBase64) throw new Error("No image data provided.");

    // 1. Setup Client & Keys (Same logic as ai-chat)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    let apiKey = Deno.env.get("GEMINI_API_KEY");
    if (userId) {
      const { data: secret } = await supabase
        .from("user_secrets")
        .select("api_key_encrypted")
        .eq("user_id", userId)
        .eq("service", "gemini")
        .maybeSingle();
      if (secret?.api_key_encrypted) {
        const decrypted = decryptMessage(secret.api_key_encrypted);
        if (decrypted) apiKey = decrypted;
      }
    }
    
    if (!apiKey) throw new Error("No API Key configured.");

    // 2. Strict JSON Extraction Prompt
    const prompt = `
      Analyze this receipt. Extract data into this JSON format ONLY:
      {
        "merchant": "string",
        "date": "YYYY-MM-DD",
        "total": number,
        "currency": "USD" | "SEK" | "EUR",
        "category": "Food" | "Travel" | "Utilities" | "Other"
      }
      If fields are missing, make best guess or use null. No markdown.
    `;

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // 3. Call Gemini
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }
          ]
        }]
      }),
    });

    if (!response.ok) throw new Error(`Gemini Error: ${await response.text()}`);

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 4. Clean & Parse JSON
    const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(jsonStr);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
