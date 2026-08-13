/**
 * Answer Generator
 * Generates tailored answers for open-ended application questions using candidate facts.
 */

import { requestAICompletion } from './ai-client.js';
import { ANSWER_GENERATOR_PROMPT } from './prompts.js';
import { validateAnswerFacts } from './fact-validator.js';

export async function generateQuestionAnswer(questionText, candidateProfile) {
  if (!questionText || !candidateProfile) {
    return { answer: "", confidence: 0, requiresReview: true, reason: "Missing inputs" };
  }

  const profileSummary = `
  Name: ${candidateProfile.personal?.fullName || ''}
  Title: ${candidateProfile.professional?.currentTitle || ''}
  Company: ${candidateProfile.professional?.currentCompany || ''}
  Total Experience: ${candidateProfile.professional?.totalExperience || ''}
  Skills: ${(candidateProfile.professional?.skills || []).join(', ')}
  Education: ${JSON.stringify(candidateProfile.education || [])}
  `.trim();

  const userPrompt = `
  Application Question: "${questionText}"
  Candidate Profile Facts:
  ${profileSummary}
  `.trim();

  const aiRes = await requestAICompletion({
    systemPrompt: ANSWER_GENERATOR_PROMPT,
    userPrompt,
    maxTokens: 500
  });

  if (aiRes.ok && aiRes.data && aiRes.data.answer) {
    const answer = aiRes.data.answer;
    const confidence = parseFloat(aiRes.data.confidence) || 0.85;
    const factsUsed = aiRes.data.factsUsed || [];

    // Fact Validation Check
    const validation = validateAnswerFacts(answer, candidateProfile);
    if (!validation.valid) {
      return {
        answer,
        confidence: 0.70,
        factsUsed,
        requiresReview: true,
        reason: `⚠ Fact check warning: ${validation.reason}`
      };
    }

    return {
      answer,
      confidence,
      factsUsed,
      requiresReview: confidence < 0.90,
      reason: "Answer generated successfully from candidate profile facts"
    };
  }

  return {
    answer: "",
    confidence: 0,
    requiresReview: true,
    reason: aiRes.error || "Failed to generate answer"
  };
}
