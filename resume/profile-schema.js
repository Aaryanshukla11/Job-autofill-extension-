/**
 * Authoritative Candidate Profile Schema Definition & Helpers
 * Supports nested schema structures, flat JSON imports, and deeply nested/wrapped JSON payloads.
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

  // 0. Unwrap "data" or "profile" wrappers if present
  let source = { ...input };
  if (source.data && typeof source.data === 'object') {
    source = { ...source, ...source.data };
  }

  // 1. Direct Nested schema extraction
  schema.personal = { ...schema.personal, ...(source.personal || {}) };
  schema.contact = { ...schema.contact, ...(source.contact || {}) };
  schema.professional = { 
    ...schema.professional, 
    ...(source.professional || {})
  };

  schema.links = { ...schema.links, ...(source.links || {}) };
  schema.preferences = {
    ...schema.preferences,
    ...(source.preferences || {}),
    preferredLocations: Array.isArray(source.preferences?.preferredLocations) ? source.preferences.preferredLocations : [],
    preferredRoles: Array.isArray(source.preferences?.preferredRoles) ? source.preferences.preferredRoles : []
  };

  schema.education = Array.isArray(source.education || source.Education) ? (source.education || source.Education) : [];
  schema.experience = Array.isArray(source.experience || source.Experience || source['Work Experience']) ? (source.experience || source.Experience || source['Work Experience']) : [];
  schema.projects = Array.isArray(source.projects || source.Projects) ? (source.projects || source.Projects) : [];
  schema.certifications = Array.isArray(source.certifications || source.Certifications || source.Certification) ? (source.certifications || source.Certifications || source.Certification) : [];
  schema.documents = { ...schema.documents, ...(source.documents || {}) };
  schema.customFields = typeof source.customFields === 'object' && source.customFields !== null ? { ...source.customFields } : {};

  // 2. Recursive Deep Search for key-value pairs at any depth
  const allKv = flattenObjectToKvPairs(input);

  // Name
  const nameVal = findKvMatch(allKv, ['fullname', 'name', 'candidatename', 'username']);
  if (nameVal && !schema.personal.fullName && typeof nameVal === 'string') {
    schema.personal.fullName = nameVal.trim();
  }

  const fnVal = findKvMatch(allKv, ['firstname', 'givenname', 'forename']);
  if (fnVal && !schema.personal.firstName && typeof fnVal === 'string') {
    schema.personal.firstName = fnVal.trim();
  }

  const lnVal = findKvMatch(allKv, ['lastname', 'surname', 'familyname']);
  if (lnVal && !schema.personal.lastName && typeof lnVal === 'string') {
    schema.personal.lastName = lnVal.trim();
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

  // Contact Details
  const emailVal = findKvMatch(allKv, ['email', 'emailid', 'contactemail', 'applicantemail', 'mail']);
  if (emailVal && !schema.contact.email && typeof emailVal === 'string') {
    schema.contact.email = emailVal.trim();
  }

  const phoneVal = findKvMatch(allKv, ['phone', 'phone1', 'phone2', 'mobile', 'cell', 'contactnumber', 'tel']);
  if (phoneVal && !schema.contact.phone && typeof phoneVal === 'string') {
    schema.contact.phone = phoneVal.trim();
  }

  const addressVal = findKvMatch(allKv, ['address', 'location', 'city', 'state']);
  if (addressVal && !schema.contact.address && typeof addressVal === 'string') {
    schema.contact.address = addressVal.trim();
  }

  // Title & Company
  const titleVal = findKvMatch(allKv, ['title', 'currenttitle', 'jobtitle', 'designation', 'role', 'position']);
  if (titleVal && !schema.professional.currentTitle && typeof titleVal === 'string') {
    schema.professional.currentTitle = titleVal.trim();
  }

  const companyVal = findKvMatch(allKv, ['company', 'currentcompany', 'employer', 'organization', 'workplace']);
  if (companyVal && !schema.professional.currentCompany && typeof companyVal === 'string') {
    schema.professional.currentCompany = companyVal.trim();
  }

  // Top experience fallback for company & title
  if (schema.experience.length > 0) {
    const topExp = schema.experience[0];
    if (typeof topExp === 'object' && topExp !== null) {
      const topComp = topExp.Company || topExp.company || topExp.Employer || topExp.employer;
      if (topComp && !schema.professional.currentCompany && typeof topComp === 'string') {
        schema.professional.currentCompany = topComp.trim();
      }
      const topRole = topExp.Role || topExp.role || topExp.Title || topExp.title || topExp.Position || topExp.position;
      if (topRole && !schema.professional.currentTitle && typeof topRole === 'string') {
        schema.professional.currentTitle = topRole.trim();
      }
    }
  }

  // Total Experience
  const expVal = findKvMatch(allKv, ['totalexperience', 'experience', 'yearsofexperience']);
  if (expVal && !schema.professional.totalExperience && typeof expVal === 'string') {
    schema.professional.totalExperience = expVal.trim();
  }

  // Skills
  let skillsArr = [];
  if (Array.isArray(source.Skills)) {
    skillsArr = source.Skills;
  } else if (source.Skills && Array.isArray(source.Skills.skills)) {
    skillsArr = source.Skills.skills;
  } else if (source.skills && Array.isArray(source.skills)) {
    skillsArr = source.skills;
  } else {
    const rawSkills = findKvMatch(allKv, ['skills', 'keyskills', 'technologystack', 'competencies']);
    if (Array.isArray(rawSkills)) {
      skillsArr = rawSkills;
    } else if (rawSkills && typeof rawSkills === 'object' && Array.isArray(rawSkills.skills)) {
      skillsArr = rawSkills.skills;
    } else if (typeof rawSkills === 'string') {
      skillsArr = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (skillsArr.length > 0) {
    schema.professional.skills = skillsArr.map(s => String(s).trim()).filter(Boolean);
  }

  // Links
  const linkedinVal = findKvMatch(allKv, ['linkedin', 'linkedinurl']);
  if (linkedinVal && !schema.links.linkedin && typeof linkedinVal === 'string') {
    schema.links.linkedin = linkedinVal.trim();
  }

  const githubVal = findKvMatch(allKv, ['github', 'githuburl']);
  if (githubVal && !schema.links.github && typeof githubVal === 'string') {
    schema.links.github = githubVal.trim();
  }

  const portfolioVal = findKvMatch(allKv, ['portfolio', 'website', 'personalwebsite']);
  if (portfolioVal && !schema.links.portfolio && typeof portfolioVal === 'string') {
    schema.links.portfolio = portfolioVal.trim();
  }

  // Capture unmapped flat properties into customFields
  for (const { key, value } of allKv) {
    if (value && typeof value !== 'object' && !Array.isArray(value)) {
      const cleanKey = key.trim();
      if (!isStandardProfileField(cleanKey) && !schema.customFields[cleanKey]) {
        schema.customFields[cleanKey] = String(value).trim();
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

/**
 * Helper to recursively flatten an object into key-value pairs at any depth.
 */
function flattenObjectToKvPairs(obj, prefix = '') {
  const kvPairs = [];
  if (!obj || typeof obj !== 'object') return kvPairs;

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && v !== undefined) {
      kvPairs.push({ key: k, fullKey, value: v });
      if (typeof v === 'object' && !Array.isArray(v)) {
        kvPairs.push(...flattenObjectToKvPairs(v, fullKey));
      }
    }
  }
  return kvPairs;
}

function findKvMatch(kvPairs, searchKeys = []) {
  for (const sk of searchKeys) {
    const target = sk.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const { key, value } of kvPairs) {
      const cleanK = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanK === target) {
        if (value !== undefined && value !== null) return value;
      }
    }
  }
  return null;
}

function isStandardProfileField(keyStr) {
  const norm = keyStr.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /firstname|lastname|fullname|name|email|phone|address|city|state|country|zip|postal|currenttitle|title|currentcompany|company|employer|totalexperience|experience|skills|linkedin|github|portfolio/i.test(norm);
}
