/**
 * Authoritative Candidate Profile Schema Definition & Helpers
 * Supports both nested schema structures and flat JSON imports.
 */

export function createEmptyProfile() {
  return {
    personal: {
      firstName: "",
      middleName: "",
      lastName: "",
      fullName: "",
      dateOfBirth: ""
    },

    contact: {
      email: "",
      phone: "",
      alternatePhone: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: ""
    },

    professional: {
      currentTitle: "",
      currentCompany: "",
      totalExperience: "",
      noticePeriod: "",
      currentSalary: "",
      expectedSalary: "",
      skills: []
    },

    education: [],
    experience: [],
    projects: [],
    certifications: [],

    links: {
      linkedin: "",
      github: "",
      portfolio: ""
    },

    preferences: {
      preferredLocations: [],
      workMode: "",
      preferredRoles: []
    },

    documents: {
      resumeFileName: "",
      rawResumeText: "",
      coverLetter: ""
    },

    customFields: {}
  };
}

export function sanitizeProfile(input = {}) {
  const schema = createEmptyProfile();
  
  if (!input || typeof input !== 'object') return schema;

  // 1. Nested schema extraction
  schema.personal = { ...schema.personal, ...(input.personal || {}) };
  schema.contact = { ...schema.contact, ...(input.contact || {}) };
  schema.professional = { 
    ...schema.professional, 
    ...(input.professional || {})
  };

  schema.links = { ...schema.links, ...(input.links || {}) };
  schema.preferences = {
    ...schema.preferences,
    ...(input.preferences || {}),
    preferredLocations: Array.isArray(input.preferences?.preferredLocations) ? input.preferences.preferredLocations : [],
    preferredRoles: Array.isArray(input.preferences?.preferredRoles) ? input.preferences.preferredRoles : []
  };

  schema.education = Array.isArray(input.education) ? input.education : [];
  schema.experience = Array.isArray(input.experience) ? input.experience : [];
  schema.projects = Array.isArray(input.projects) ? input.projects : [];
  schema.certifications = Array.isArray(input.certifications) ? input.certifications : [];
  schema.documents = { ...schema.documents, ...(input.documents || {}) };
  schema.customFields = typeof input.customFields === 'object' && input.customFields !== null ? { ...input.customFields } : {};

  // 2. Flat JSON property normalization
  if (input.firstName && !schema.personal.firstName) schema.personal.firstName = String(input.firstName).trim();
  if (input.middleName && !schema.personal.middleName) schema.personal.middleName = String(input.middleName).trim();
  if (input.lastName && !schema.personal.lastName) schema.personal.lastName = String(input.lastName).trim();
  if ((input.fullName || input.name) && !schema.personal.fullName) {
    schema.personal.fullName = String(input.fullName || input.name).trim();
  }

  // Auto-split name into firstName/lastName if missing
  if (schema.personal.fullName && (!schema.personal.firstName || !schema.personal.lastName)) {
    const parts = schema.personal.fullName.split(/\s+/).filter(Boolean);
    if (parts.length === 1 && !schema.personal.firstName) {
      schema.personal.firstName = parts[0];
    } else if (parts.length >= 2) {
      if (!schema.personal.firstName) schema.personal.firstName = parts[0];
      if (!schema.personal.lastName) schema.personal.lastName = parts[parts.length - 1];
    }
  }

  if (input.email && !schema.contact.email) schema.contact.email = String(input.email).trim();
  if (input.phone && !schema.contact.phone) schema.contact.phone = String(input.phone).trim();
  if ((input.address || input.location) && !schema.contact.address) {
    schema.contact.address = String(input.address || input.location).trim();
  }
  if (input.city && !schema.contact.city) schema.contact.city = String(input.city).trim();
  if (input.state && !schema.contact.state) schema.contact.state = String(input.state).trim();
  if (input.country && !schema.contact.country) schema.contact.country = String(input.country).trim();
  if (input.postalCode && !schema.contact.postalCode) schema.contact.postalCode = String(input.postalCode).trim();

  if ((input.currentTitle || input.title || input.jobTitle || input.designation) && !schema.professional.currentTitle) {
    schema.professional.currentTitle = String(input.currentTitle || input.title || input.jobTitle || input.designation).trim();
  }
  if ((input.currentCompany || input.company || input.organization) && !schema.professional.currentCompany) {
    schema.professional.currentCompany = String(input.currentCompany || input.company || input.organization).trim();
  }
  if ((input.totalExperience || input.experience) && !schema.professional.totalExperience && typeof (input.totalExperience || input.experience) !== 'object') {
    schema.professional.totalExperience = String(input.totalExperience || input.experience).trim();
  }

  // Skills normalization (handles string or array)
  let rawSkills = input.professional?.skills || input.skills || [];
  if (typeof rawSkills === 'string') {
    rawSkills = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
  }
  schema.professional.skills = Array.isArray(rawSkills) ? rawSkills.map(s => String(s).trim()).filter(Boolean) : [];

  if (input.linkedin && !schema.links.linkedin) schema.links.linkedin = String(input.linkedin).trim();
  if (input.github && !schema.links.github) schema.links.github = String(input.github).trim();
  if ((input.portfolio || input.website) && !schema.links.portfolio) {
    schema.links.portfolio = String(input.portfolio || input.website).trim();
  }

  // Capture unmapped flat JSON properties as customFields
  const knownKeys = new Set([
    'personal', 'contact', 'professional', 'education', 'experience', 'projects', 'certifications',
    'links', 'preferences', 'documents', 'customFields',
    'firstName', 'middleName', 'lastName', 'fullName', 'name', 'email', 'phone', 'address', 'location', 'city', 'state',
    'country', 'postalCode', 'currentTitle', 'title', 'jobTitle', 'designation', 'currentCompany', 'company', 'organization',
    'totalExperience', 'experience', 'skills', 'linkedin', 'github', 'portfolio', 'website'
  ]);

  for (const [k, v] of Object.entries(input)) {
    if (!knownKeys.has(k) && v !== undefined && v !== null && typeof v !== 'object') {
      if (!schema.customFields[k]) {
        schema.customFields[k] = String(v).trim();
      }
    }
  }

  // Ensure fullName derived if missing
  if (!schema.personal.fullName && (schema.personal.firstName || schema.personal.lastName)) {
    schema.personal.fullName = [schema.personal.firstName, schema.personal.middleName, schema.personal.lastName]
      .filter(Boolean)
      .join(' ');
  }

  return schema;
}
