/**
 * Profile Builder
 * Coordinates raw file processing (PDF/DOCX), resume text parsing, and profile assembly.
 */

import { extractTextFromPDF } from './pdf-extract.js';
import { extractTextFromDOCX } from './docx-extract.js';
import { parseResumeText } from './resume-parser.js';
import { sanitizeProfile } from './profile-schema.js';

export async function buildProfileFromResumeFile(file) {
  if (!file) throw new Error('No resume file provided');

  const fileName = file.name || 'resume';
  const fileExt = fileName.split('.').pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();

  let rawText = '';
  if (fileExt === 'pdf') {
    rawText = await extractTextFromPDF(arrayBuffer);
  } else if (fileExt === 'docx' || fileExt === 'doc') {
    rawText = await extractTextFromDOCX(arrayBuffer);
  } else if (fileExt === 'txt') {
    const textDecoder = new TextDecoder('utf-8');
    rawText = textDecoder.decode(arrayBuffer);
  } else {
    throw new Error(`Unsupported file extension: .${fileExt}. Please upload a PDF or DOCX resume.`);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new Error('Extracted resume text is empty. Please select a readable PDF or DOCX file.');
  }

  const parsedProfile = parseResumeText(rawText, fileName);
  return sanitizeProfile(parsedProfile);
}
