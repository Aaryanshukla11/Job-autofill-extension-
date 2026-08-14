/**
 * AI Semantic Form Analyzer & Multi-Field Reasoning Engine
 * Model: openai/gpt-oss-120b (fallback: llama-3.3-70b-versatile via Groq)
 * Enforces structured JSON output, schema validation, and zero-fact-invention safety rules.
 */

import { callGroqApi } from './groq-provider.js';
import { isSensitiveOrForbiddenField, isValidProfilePath } from '../storage/learning-schema.js';
import { resolveProfileValue } from '../autofill/value-resolver.js';

/**
 * Analyzes unknown or ambiguous form fields in batch using Groq AI.
 */
export async function analyzeUnknownFields(unknownFields = [], candidateProfile = {}, settings = {}) {
  if (!unknownFields || unknownFields.length === 0) {
    return { ok: true, suggestions: [] };
  }

  const apiKey = settings.groqApiKey || '';
  if (!apiKey) {
    return { ok: false, error: 'Groq API Key missing in settings', suggestions: [] };
  }

  // 1. Filter out sensitive fields for privacy & safety
  const safeFields = unknownFields.filter(f => {
    const context = `${f.name || ''} ${f.id || ''} ${f.label || ''} ${f.placeholder || ''}`;
    return !isSensitiveOrForbiddenField(context);
  });

  if (safeFields.length === 0) {
    return { ok: true, suggestions: [] };
  }

  // 2. Prepare compact field batch payload (up to 10 fields)
  const fieldBatch = safeFields.slice(0, 10).map(f => ({
    fieldId: f.index !== undefined ? f.index : f.fieldId,
    tag: f.tagName || f.tag || 'input',
    type: f.type || 'text',
    name: f.name || '',
    id: f.id || '',
    placeholder: f.placeholder || '',
    label: f.label || '',
    nearbyText: f.nearbyText || f.contextStr || '',
    section: f.section || '',
    options: Array.isArray(f.options) ? f.options.slice(0, 8) : []
  }));

  // 3. Prepare compact Candidate Profile facts (exclude sensitive credentials)
  const profileFacts = extractSafeProfileFacts(candidateProfile);

  // 4. Construct System & User Prompts
  const systemPrompt = `You are an AI Semantic Form Mapping Engine for Job Applications.
Analyze unknown form fields and determine their semantic meaning based on available signals (label, name, placeholder, nearby text, section, and neighboring fields).

CRITICAL SAFETY INVARIANTS:
1. Output MUST be valid JSON matching the specified JSON Schema.
2. 'sourcePath' MUST be an authoritative Candidate Profile path (e.g., 'personal.firstName', 'personal.lastName', 'personal.fullName', 'contact.email', 'contact.phone', 'contact.address', 'professional.currentTitle', 'professional.currentCompany', 'professional.totalExperience', 'professional.skills', 'professional.summary', 'links.linkedin', 'links.github', 'links.portfolio', 'preferences.workMode', 'customFields.Notice Period').
3. NEVER INVENT CANDIDATE FACTS. If a required fact is missing from candidate facts, return 'semanticField': null, 'sourcePath': null, 'value': null, 'confidence': 0.15.
4. For Name variations:
   - First Name / Given Name -> personal.firstName
   - Last Name / Surname -> personal.lastName
   - Full Name -> personal.fullName
   - Middle Name -> personal.middleName (do NOT invent if empty)
5. Group related fields (e.g. First/Last Name, City/State, Company/Title) to disambiguate meaning.
6. All suggestions require human approval ('requiresApproval': true).`;

  const userPrompt = JSON.stringify({
    fieldsToAnalyze: fieldBatch,
    candidateProfileFacts: profileFacts,
    allowedSchemaRoots: [
      'personal.firstName', 'personal.middleName', 'personal.lastName', 'personal.fullName',
      'contact.email', 'contact.phone', 'contact.address', 'contact.city', 'contact.state', 'contact.country', 'contact.postalCode',
      'professional.currentTitle', 'professional.currentCompany', 'professional.totalExperience', 'professional.skills', 'professional.summary',
      'links.linkedin', 'links.github', 'links.portfolio',
      'preferences.workMode', 'preferences.noticePeriod'
    ]
  }, null, 2);

  // 5. Invoke Groq API
  const modelToUse = settings.aiModel || 'openai/gpt-oss-120b';
  const apiRes = await callGroqApi({
    apiKey,
    systemPrompt,
    userPrompt,
    model: modelToUse,
    maxTokens: 1200
  });

  if (!apiRes.ok || !apiRes.data) {
    return { ok: false, error: apiRes.error || 'Groq API request failed', suggestions: [] };
  }

  // 6. Validate & Normalize AI Response Mappings
  const rawMappings = Array.isArray(apiRes.data.mappings) ? apiRes.data.mappings : [];
  const validatedSuggestions = [];

  for (const m of rawMappings) {
    if (m.fieldId === undefined || m.fieldId === null) continue;

    const sourcePath = m.sourcePath || m.semanticField;

    // Safety check: Ensure profile path is valid and not forbidden
    if (!sourcePath || !isValidProfilePath(sourcePath) || isSensitiveOrForbiddenField(sourcePath)) {
      continue;
    }

    // Verify resolved value from actual Candidate Profile facts (prevent invented claims)
    const actualProfileVal = resolveProfileValue(candidateProfile, sourcePath);

    if (actualProfileVal === null || actualProfileVal === undefined || String(actualProfileVal).trim() === '') {
      // Profile lacks this fact -> Reject AI fact invention
      validatedSuggestions.push({
        fieldId: m.fieldId,
        semanticField: null,
        sourcePath: null,
        value: null,
        confidence: 0.15,
        requiresApproval: false,
        reason: `Candidate profile lacks fact for ${sourcePath}.`
      });
      continue;
    }

    // Form value transformation handling (e.g. max length constraint)
    const targetFieldRef = safeFields.find(sf => (sf.index !== undefined ? sf.index : sf.fieldId) === m.fieldId);
    let finalVal = String(actualProfileVal).trim();

    if (targetFieldRef && targetFieldRef.maxLength && targetFieldRef.maxLength > 0) {
      if (finalVal.length > targetFieldRef.maxLength) {
        finalVal = finalVal.substring(0, targetFieldRef.maxLength);
      }
    }

    const confidence = typeof m.confidence === 'number' ? Math.min(1.0, Math.max(0.0, m.confidence)) : 0.90;

    validatedSuggestions.push({
      fieldId: m.fieldId,
      semanticField: sourcePath,
      sourcePath: sourcePath,
      value: finalVal,
      valueType: m.valueType || (targetFieldRef?.tagName === 'SELECT' ? 'select' : 'text'),
      confidence,
      requiresApproval: true, // Human approval MANDATORY
      reason: m.reason || `AI mapped field to ${sourcePath}.`,
      factsUsed: Array.isArray(m.factsUsed) ? m.factsUsed : [sourcePath]
    });
  }

  return {
    ok: true,
    modelUsed: apiRes.modelUsed || modelToUse,
    suggestions: validatedSuggestions
  };
}

/**
 * Extracts non-sensitive facts from candidate profile for AI context.
 */
function extractSafeProfileFacts(profile = {}) {
  const p = profile.personal || {};
  const c = profile.contact || {};
  const prof = profile.professional || {};
  const l = profile.links || {};

  return {
    personal: {
      firstName: p.firstName || '',
      middleName: p.middleName || '',
      lastName: p.lastName || '',
      fullName: p.fullName || ''
    },
    contact: {
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || '',
      postalCode: c.postalCode || ''
    },
    professional: {
      currentTitle: prof.currentTitle || '',
      currentCompany: prof.currentCompany || '',
      totalExperience: prof.totalExperience || '',
      noticePeriod: prof.noticePeriod || '',
      skills: Array.isArray(prof.skills) ? prof.skills : [],
      summary: prof.summary || prof.bio || ''
    },
    links: {
      linkedin: l.linkedin || '',
      github: l.github || '',
      portfolio: l.portfolio || ''
    },
    customFields: profile.customFields || {}
  };
}
