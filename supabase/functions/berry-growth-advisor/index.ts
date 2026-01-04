import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { GoogleGenerativeAI } from "@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    const { data: logs } = await supabaseClient
      .from('care_events')
      .select('*')
      .eq('user_id', user?.id)
      .order('timestamp', { ascending: false })
      .limit(10)

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

    const prompt = `Analyze these baby care logs: ${JSON.stringify(logs)}. Provide a brief 2-sentence insight about trends. Keep it encouraging.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    return new Response(JSON.stringify({ insight: text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    // FIX: Type guard to safely access .message
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Growth Advisor Error:", errorMessage);

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})