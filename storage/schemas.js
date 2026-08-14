/**
 * Default schemas and structure definitions for storage.
 */

export const DEFAULT_CANDIDATE_PROFILE = {
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

  education: [
    /*
    {
      degree: "",
      fieldOfStudy: "",
      institution: "",
      startYear: "",
      endYear: "",
      gpa: ""
    }
    */
  ],

  experience: [
    /*
    {
      title: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: ""
    }
    */
  ],

  projects: [
    /*
    {
      title: "",
      description: "",
      technologies: [],
      link: ""
    }
    */
  ],

  certifications: [
    /*
    {
      name: "",
      issuer: "",
      issueDate: ""
    }
    */
  ],

  links: {
    linkedin: "",
    github: "",
    portfolio: ""
  },

  preferences: {
    preferredLocations: [],
    workMode: "", // Remote, Hybrid, On-site
    preferredRoles: []
  },

  documents: {
    resumeFileName: "",
    rawResumeText: "",
    coverLetter: ""
  }
};

export const DEFAULT_SETTINGS = {
  aiProvider: "Gemini",
  geminiApiKey: "",
  aiModel: "models/gemini-3.7-flash",
  confidenceThreshold: 0.90, // >=0.90 auto-fill, 0.75-0.89 review, <0.75 skip
  autoGenerateAnswers: true,
  fillSensitiveFields: false, // Default to FALSE for safety
  confirmBeforeAnswers: true,
  debugMode: true
};
