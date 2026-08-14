/**
 * Groq API Provider - Background execution only
 * Primary Model: openai/gpt-oss-120b
 * Fallback Model: llama-3.3-70b-versatile
 */

export async function callGroqApi({ apiKey, systemPrompt, userPrompt, model = 'openai/gpt-oss-120b', maxTokens = 1000 }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, error: 'Groq API Key is missing or invalid' };
  }

  const primaryModel = model || 'openai/gpt-oss-120b';
  const fallbackModel = 'llama-3.3-70b-versatile';

  let res = await executeGroqFetch({ apiKey, systemPrompt, userPrompt, model: primaryModel, maxTokens });
  
  // If primary model failed and was not already the fallback model, retry with fallback model
  if (!res.ok && primaryModel !== fallbackModel) {
    console.warn(`[Groq Provider] Primary model ${primaryModel} failed (${res.error}). Retrying with fallback model ${fallbackModel}...`);
    res = await executeGroqFetch({ apiKey, systemPrompt, userPrompt, model: fallbackModel, maxTokens });
  }

  return res;
}

async function executeGroqFetch({ apiKey, systemPrompt, userPrompt, model, maxTokens }) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (userPrompt) messages.push({ role: 'user', content: userPrompt });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.1,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        ok: false,
        error: `HTTP ${response.status}: ${errText.substring(0, 150)}`
      };
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim() || '';

    // Clean JSON wrappers if present
    const cleanedJson = rawContent
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    try {
      const parsed = JSON.parse(cleanedJson);
      return { ok: true, data: parsed, rawContent, modelUsed: model };
    } catch (parseErr) {
      return {
        ok: false,
        error: `JSON Parse error: ${parseErr.message}`,
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
