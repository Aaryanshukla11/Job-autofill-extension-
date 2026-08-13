/**
 * Groq API Provider - Background execution only
 * Model default: llama-3.3-70b-versatile
 */

export async function callGroqApi({ apiKey, systemPrompt, userPrompt, model = 'llama-3.3-70b-versatile', maxTokens = 1000 }) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    return { ok: false, error: 'Groq API Key is missing or invalid' };
  }

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
        model: model || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.2,
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
      return { ok: true, data: parsed, rawContent };
    } catch (parseErr) {
      return {
        ok: false,
        error: `JSON Parse error: ${parseErr.message}`,
        rawContent
      };
    }
  } catch (err) {
    return {
      ok: false,
      error: `Network error: ${err.message}`
    };
  }
}
