/**
 * Deterministic Resume Parser with Filename & Entity Fallbacks
 * Converts raw resume text & file metadata into structured Candidate Profile data.
 */

import { sanitizeProfile } from './profile-schema.js';

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
  'React', 'React Native', 'Angular', 'Vue.js', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind', 'TailwindCSS', 'Bootstrap', 'Sass',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Firebase', 'SQLite', 'Oracle',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'GitHub', 'GitLab', 'Linux', 'Bash',
  'REST API', 'REST APIs', 'GraphQL', 'Microservices', 'Machine Learning', 'AI', 'Data Analysis', 'Pandas', 'NumPy',
  'Unit Testing', 'Jest', 'Cypress', 'Webpack', 'Vite', 'Redux', 'Zustand'
];

const DEGREE_PATTERNS = [
  /bachelor\s*(of\s*technology|of\s*science|of\s*engineering|of\s*arts|'s|\.t?ech|\.s|\.e)?/i,
  /master\s*(of\s*technology|of\s*science|of\s*engineering|of\s*arts|'s|\.t?ech|\.s|\.e|of\s*business\s*administration)?/i,
  /b\.?tech/i, /m\.?tech/i, /b\.?s\.?/i, /m\.?s\.?/i, /b\.?a\.?/i, /m\.?a\.?/i, /ph\.?d/i, /diploma/i, /associate/i
];

export function parseResumeText(rawText = '', fileName = '') {
  const profile = sanitizeProfile();
  profile.documents.rawResumeText = rawText;
  profile.documents.resumeFileName = fileName;

  if (!rawText || typeof rawText !== 'string') rawText = '';

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Email Extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  if (emailMatch) {
    profile.contact.email = emailMatch[0].toLowerCase();
  }

  // 2. Phone Extraction (Indian & International Formats)
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[\s-]?)?\(?\d{2,5}\)?[\s-]?\d{3,5}[\s-]?\d{3,5}/);
  if (phoneMatch && phoneMatch[0].replace(/\D/g, '').length >= 7) {
    profile.contact.phone = phoneMatch[0].trim();
  }

  // 3. Links Extraction (LinkedIn, GitHub, Portfolio)
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  if (linkedinMatch) {
    profile.links.linkedin = linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : 'https://' + linkedinMatch[0];
  }

  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  if (githubMatch) {
    profile.links.github = githubMatch[0].startsWith('http') ? githubMatch[0] : 'https://' + githubMatch[0];
  }

  const websiteMatch = rawText.match(/(?:https?:\/\/)?([a-zA-Z0-9-]+\.)+(?:com|io|dev|me|org|net)(?:\/[^\s]*)?/i);
  if (websiteMatch && !websiteMatch[0].includes('linkedin.com') && !websiteMatch[0].includes('github.com')) {
    profile.links.portfolio = websiteMatch[0].startsWith('http') ? websiteMatch[0] : 'https://' + websiteMatch[0];
  }

  // 4. Candidate Name Extraction
  // First try parsing top 5 lines of raw text
  let extractedName = '';
  for (const line of lines.slice(0, 8)) {
    const cleanLine = line.replace(/resume|cv|curriculum vitae|page \d+/gi, '').trim();
    if (!cleanLine.includes('@') && !cleanLine.includes('http') && !/\d{5,}/.test(cleanLine) && cleanLine.length > 2 && cleanLine.length < 50) {
      const parts = cleanLine.split(/\s+/).filter(p => /^[a-zA-Z'.]+$/.test(p));
      if (parts.length >= 2 && parts.length <= 4) {
        extractedName = parts.join(' ');
        profile.personal.fullName = extractedName;
        profile.personal.firstName = parts[0];
        profile.personal.lastName = parts[parts.length - 1];
        if (parts.length === 3) profile.personal.middleName = parts[1];
        break;
      }
    }
  }

  // Fallback: If text name extraction returned empty, parse filename (e.g. "Aryan_Kumar_Resume.pdf" -> "Aryan Kumar")
  if (!profile.personal.firstName && fileName) {
    const cleanFileName = fileName.replace(/\.(pdf|docx|doc|txt)$/i, '')
      .replace(/_|-|\b(resume|cv|profile|final|updated|new)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const fnParts = cleanFileName.split(' ').filter(p => /^[a-zA-Z]+$/.test(p));
    if (fnParts.length >= 2) {
      profile.personal.firstName = fnParts[0];
      profile.personal.lastName = fnParts[fnParts.length - 1];
      profile.personal.fullName = fnParts.join(' ');
    } else if (fnParts.length === 1) {
      profile.personal.firstName = fnParts[0];
      profile.personal.fullName = fnParts[0];
    }
  }

  // 5. Skills Extraction
  const foundSkills = new Set();
  KNOWN_SKILLS.forEach(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(rawText)) {
      foundSkills.add(skill);
    }
  });
  profile.professional.skills = Array.from(foundSkills);

  // 6. Total Experience Extraction
  const expMatch = rawText.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i);
  if (expMatch) {
    profile.professional.totalExperience = `${expMatch[1]} years`;
  }

  // 7. Location (City / State / Country) Extraction
  const cities = ['Bengaluru', 'Bangalore', 'Kolkata', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Austin', 'New York', 'San Francisco', 'London'];
  for (const city of cities) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(rawText)) {
      profile.contact.city = city;
      if (!profile.contact.address) profile.contact.address = city;
      break;
    }
  }

  // 8. Education Extraction
  lines.forEach(line => {
    DEGREE_PATTERNS.forEach(pat => {
      if (pat.test(line)) {
        profile.education.push({
          degree: line.substring(0, 60),
          institution: "",
          fieldOfStudy: "",
          startYear: "",
          endYear: ""
        });
      }
    });
  });

  // 9. Current Title & Company Heuristics
  const titleKeywords = [/software engineer/i, /full stack/i, /frontend/i, /backend/i, /data scientist/i, /devops/i, /web developer/i, /lead engineer/i, /developer/i, /engineer/i];
  for (const line of lines) {
    for (const pat of titleKeywords) {
      if (pat.test(line) && line.length < 60) {
        profile.professional.currentTitle = line.trim();
        break;
      }
    }
    if (profile.professional.currentTitle) break;
  }

  return sanitizeProfile(profile);
}
