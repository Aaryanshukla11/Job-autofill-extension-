/**
 * Field Mapping Dictionary
 * Maps normalized field names & label keywords to Candidate Profile JSON paths.
 */

export const FIELD_MAPPING_DICTIONARY = {
  // Personal
  'first_name': 'personal.firstName',
  'fname': 'personal.firstName',
  'given_name': 'personal.firstName',

  'middle_name': 'personal.middleName',
  'mname': 'personal.middleName',

  'last_name': 'personal.lastName',
  'lname': 'personal.lastName',
  'surname': 'personal.lastName',
  'family_name': 'personal.lastName',

  'full_name': 'personal.fullName',
  'name': 'personal.fullName',
  'candidate_name': 'personal.fullName',
  'applicant_name': 'personal.fullName',

  'dob': 'personal.dateOfBirth',
  'date_of_birth': 'personal.dateOfBirth',
  'birth_date': 'personal.dateOfBirth',

  // Contact
  'email': 'contact.email',
  'email_address': 'contact.email',
  'mail': 'contact.email',
  'contact_email': 'contact.email',
  'user_email': 'contact.email',

  'phone': 'contact.phone',
  'phone_number': 'contact.phone',
  'mobile': 'contact.phone',
  'mobile_number': 'contact.phone',
  'contact_number': 'contact.phone',
  'cell_phone': 'contact.phone',

  'address': 'contact.address',
  'street_address': 'contact.address',
  'location': 'contact.address',

  'city': 'contact.city',
  'state': 'contact.state',
  'country': 'contact.country',
  'zip': 'contact.postalCode',
  'zip_code': 'contact.postalCode',
  'postal_code': 'contact.postalCode',

  // Links
  'linkedin': 'links.linkedin',
  'linkedin_url': 'links.linkedin',
  'linkedin_profile': 'links.linkedin',

  'github': 'links.github',
  'github_url': 'links.github',
  'github_profile': 'links.github',

  'portfolio': 'links.portfolio',
  'website': 'links.portfolio',
  'personal_website': 'links.portfolio',
  'portfolio_url': 'links.portfolio',

  // Professional
  'current_title': 'professional.currentTitle',
  'job_title': 'professional.currentTitle',
  'title': 'professional.currentTitle',
  'position': 'professional.currentTitle',
  'designation': 'professional.currentTitle',

  'current_company': 'professional.currentCompany',
  'company': 'professional.currentCompany',
  'employer': 'professional.currentCompany',
  'organization': 'professional.currentCompany',

  'experience': 'professional.totalExperience',
  'total_experience': 'professional.totalExperience',
  'years_experience': 'professional.totalExperience',
  'years_of_experience': 'professional.totalExperience',

  'skills': 'professional.skills',
  'key_skills': 'professional.skills',
  'technical_skills': 'professional.skills',

  'notice_period': 'professional.noticePeriod',

  // Sensitive / Protected Fields (Mapped but flagged for sensitive policy)
  'current_salary': 'professional.currentSalary',
  'expected_salary': 'professional.expectedSalary',
  'salary': 'professional.expectedSalary'
};

export const SENSITIVE_FIELD_PATHS = [
  'professional.currentSalary',
  'professional.expectedSalary',
  'demographic.gender',
  'demographic.race',
  'demographic.disability',
  'demographic.veteranStatus',
  'legal.workAuthorization',
  'legal.visaSponsorship',
  'legal.criminalHistory'
];
