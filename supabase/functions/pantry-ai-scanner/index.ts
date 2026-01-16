/**
 * @module pantry-ai-scanner
 * @description AAA+ Tier Vision Processing for Deno Edge Runtime.
 * NO React Native aliases. Strictly Deno compliant.
 */

// Constants
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GEMINI_ENDPOINT = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent`;

const AI_PROMPT = "Identify all food items in this image. Return JSON: { \"detected_items\": [ { \"name\": \"item name\", \"category\": \"Produce|Dairy|Protein|Pantry|Frozen\", \"confidence\": 0.95, \"expiry_days\": 7, \"nutritional_data\": { \"calories\": 100 } } ] }";

interface GeminiResponse {
  "detected_items": {
    name: string;
    category: string;
    confidence: number;
    expiry_days: number;
    nutritional_data: Record<string, number>;
  }[];
}

interface RequestBody {
  imageBase64: string;
}

// Custom error class for better error handling
class ScannerError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'ScannerError';
  }
}

// Utility function to check if a string is valid base64
function isValidBase64(str: string): boolean {
  try {
    atob(str);
    return true;
  } catch {
    return false;
  }
}

// Handle CORS preflight requests
function handleCORS(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

// Validate and extract input from request
async function validateInput(req: Request): Promise<RequestBody> {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object') {
      throw new ScannerError('Invalid request body', 400);
    }
    const { imageBase64 } = body as RequestBody;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      throw new ScannerError('Missing or invalid image payload', 400);
    }
    // Strip data URL prefix if present and validate base64
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    if (!isValidBase64(cleanBase64)) {
      throw new ScannerError('Invalid base64 image data', 400);
    }
    return { imageBase64: cleanBase64 };
  } catch (error) {
    if (error instanceof ScannerError) throw error;
    throw new ScannerError('Failed to parse request body', 400);
  }
}

// Call Gemini API and return raw result text
async function callGeminiAPI(imageBase64: string, apiKey: string): Promise<string> {
  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: AI_PROMPT },
          { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
        ]
      }],
      generationConfig: {
        response_mime_type: "application/json",
        temperature: 0.1
      }
    })
  });

  if (!response.ok) {
    throw new ScannerError(`AI API Error: ${response.status}`, 502);
  }

  const aiResult = await response.json();
  const resultText = aiResult.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!resultText) {
    throw new ScannerError('No detection result from AI', 502);
  }

  return resultText;
}

// Process and validate AI result
function processAIResult(resultText: string): GeminiResponse {
  try {
    const items: GeminiResponse = JSON.parse(resultText);
    // Optional: Add schema validation here if needed
    if (!items.detected_items || !Array.isArray(items.detected_items)) {
      throw new ScannerError('Invalid AI response structure', 502);
    }
    return items;
  } catch (error) {
    if (error instanceof ScannerError) throw error;
    // console.error('[SCANNER_PARSE_ERROR]', error);
    throw new ScannerError('Failed to parse AI response', 502);
  }
}

// Main handler
Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  try {
    // Validate input
    const { imageBase64 } = await validateInput(req);

    // Get API key
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      throw new ScannerError('GEMINI_API_KEY not set', 500);
    }

    // Call AI API
    const resultText = await callGeminiAPI(imageBase64, apiKey);

    // Process result
    const items = processAIResult(resultText);

    // Return success response
    return new Response(JSON.stringify(items), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    // Log error with context
    // console.error("[SCANNER_CRITICAL]", error.message, error.stack);

    // Return error response
    const status = (error instanceof ScannerError) ? error.status : 500;
    const errorMessage = error.message || 'Internal server error';

    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
