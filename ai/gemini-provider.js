/**
 * Google Gemini API Provider - Background execution only
 * Primary Model: models/gemini-3.7-flash
 * Fallback Model: models/gemini-2.0-flash
 *
 * API Docs: https://ai.google.dev/api/generate-content
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const PRIMARY_MODEL  = 'models/gemini-3.7-flash';
const FALLBACK_MODEL = 'models/gemini-3.7-flash';

export async function callGeminiApi({ apiKey, systemPrompt, userPrompt, model = PRIMARY_MODEL, maxTokens = 1000 }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, error: 'Gemini API Key is missing or invalid' };
  }

  const primaryModel = model || PRIMARY_MODEL;
  const fallbackModel = FALLBACK_MODEL;

  let res = await executeGeminiFetch({ apiKey, systemPrompt, userPrompt, model: primaryModel, maxTokens });

  // Retry with fallback if primary model failed and they differ
  if (!res.ok && primaryModel !== fallbackModel) {
    console.warn(`[Gemini Provider] Primary model "${primaryModel}" failed (${res.error}). Retrying with fallback "${fallbackModel}"…`);
    res = await executeGeminiFetch({ apiKey, systemPrompt, userPrompt, model: fallbackModel, maxTokens });
  }

  return res;
}

async function executeGeminiFetch({ apiKey, systemPrompt, userPrompt, model, maxTokens }) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  // Build contents array; Gemini uses a single "user" turn
  // If a system prompt exists, prepend it to the user message (Gemini Flash Lite supports systemInstruction)
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt || '' }]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json'
    }
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        error: `HTTP ${response.status}: ${errText.substring(0, 200)}`,
        modelUsed: model
      };
    }

    const data = await response.json();

    // Extract text from Gemini response structure
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Strip markdown code fences if present (shouldn't happen with responseMimeType json, but just in case)
    const cleanedJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    if (!cleanedJson) {
      return { ok: false, error: 'Empty response from Gemini', modelUsed: model };
    }

    try {
      const parsed = JSON.parse(cleanedJson);
      return { ok: true, data: parsed, rawContent, modelUsed: model };
    } catch (parseErr) {
      return {
        ok: false,
        error: `JSON parse error: ${parseErr.message}`,
        rawContent,
        modelUsed: model
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: `Network error: ${err.message}`,
      modelUsed: model
    };
  }
}
