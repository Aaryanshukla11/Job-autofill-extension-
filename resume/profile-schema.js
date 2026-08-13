/**
 * Authoritative Candidate Profile Schema Definition & Helpers
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

  schema.personal = { ...schema.personal, ...(input.personal || {}) };
  schema.contact = { ...schema.contact, ...(input.contact || {}) };
  schema.professional = { 
    ...schema.professional, 
    ...(input.professional || {}),
    skills: Array.isArray(input.professional?.skills) ? input.professional.skills.map(s => String(s).trim()).filter(Boolean) : []
  };

  schema.education = Array.isArray(input.education) ? input.education : [];
  schema.experience = Array.isArray(input.experience) ? input.experience : [];
  schema.projects = Array.isArray(input.projects) ? input.projects : [];
  schema.certifications = Array.isArray(input.certifications) ? input.certifications : [];

  schema.links = { ...schema.links, ...(input.links || {}) };
  schema.preferences = {
    ...schema.preferences,
    ...(input.preferences || {}),
    preferredLocations: Array.isArray(input.preferences?.preferredLocations) ? input.preferences.preferredLocations : [],
    preferredRoles: Array.isArray(input.preferences?.preferredRoles) ? input.preferences.preferredRoles : []
  };

  schema.documents = { ...schema.documents, ...(input.documents || {}) };
  schema.customFields = typeof input.customFields === 'object' && input.customFields !== null ? { ...input.customFields } : {};

  // Ensure fullName derived if missing
  if (!schema.personal.fullName && (schema.personal.firstName || schema.personal.lastName)) {
    schema.personal.fullName = [schema.personal.firstName, schema.personal.middleName, schema.personal.lastName]
      .filter(Boolean)
      .join(' ');
  }

  return schema;
}
