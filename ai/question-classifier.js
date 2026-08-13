/**
 * Question Classifier
 * Detects and classifies open-ended job application questions.
 */

import { requestAICompletion } from './ai-client.js';
import { QUESTION_CLASSIFIER_PROMPT } from './prompts.js';

export function classifyQuestionDeterministic(questionText = '') {
  const text = questionText.toLowerCase();

  if (/why (are you|do you want|interested)|why should we hire|why work here/i.test(text)) {
    return { questionType: 'MOTIVATION', confidence: 0.92 };
  }

  if (/project|describe a challenge|recent work|portfolio/i.test(text)) {
    return { questionType: 'PROJECT_EXPERIENCE', confidence: 0.90 };
  }

  if (/strengths|weaknesses|superpower|greatest achievement/i.test(text)) {
    return { questionType: 'STRENGTHS', confidence: 0.88 };
  }

  if (/tell us about yourself|background|summary|bio/i.test(text)) {
    return { questionType: 'PROFESSIONAL_BACKGROUND', confidence: 0.94 };
  }

  if (/visa|sponsorship|disability|gender|race|convicted|crime/i.test(text)) {
    return { questionType: 'SENSITIVE_DECLARATION', confidence: 0.95 };
  }

  return { questionType: 'UNKNOWN', confidence: 0.30 };
}

export async function classifyQuestion(questionText) {
  const deterministic = classifyQuestionDeterministic(questionText);
  if (deterministic.confidence >= 0.85) {
    return deterministic;
  }

  const aiRes = await requestAICompletion({
    systemPrompt: QUESTION_CLASSIFIER_PROMPT,
    userPrompt: `Question: "${questionText}"`
  });

  if (aiRes.ok && aiRes.data && aiRes.data.questionType) {
    return {
      questionType: aiRes.data.questionType,
      confidence: parseFloat(aiRes.data.confidence) || 0.80
    };
  }

  return deterministic;
}
