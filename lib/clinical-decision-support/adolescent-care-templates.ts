/**
 * Adolescent Care Templates
 * Standardized templates for confidentiality, family involvement, and school coordination
 * Based on AAP, AACAP, and state-specific guidelines for adolescent mental health
 */

export interface ConfidentialityGuidance {
  principles: string[];
  mustDisclose: string[];
  mayDisclose: string[];
  interviewApproach: string[];
  documentation: string[];
}

export interface FamilyInvolvementGuidance {
  importance: string;
  roles: string[];
  communication: string[];
  safetyMonitoring: string[];
  boundaries: string[];
}

export interface SchoolCoordinationGuidance {
  whenToInvolve: string[];
  consentRequirements: string[];
  accommodations: string[];
  communicationPoints: string[];
  returnToSchoolPlanning: string[];
}

export interface AdolescentCareTemplate {
  confidentiality: ConfidentialityGuidance;
  familyInvolvement: FamilyInvolvementGuidance;
  schoolCoordination: SchoolCoordinationGuidance;
  followUpTiming: FollowUpGuidance;
  specialConsiderations: string[];
}

export interface FollowUpGuidance {
  highRisk: string;
  moderateRisk: string;
  lowRisk: string;
  postDischarge: string;
  ongoingCare: string[];
}


/**
 * Standard confidentiality guidance for adolescent mental health
 */
export const CONFIDENTIALITY_GUIDANCE: ConfidentialityGuidance = {
  principles: [
    'Adolescents have a right to confidential healthcare within legal limits',
    'Building trust through confidentiality improves disclosure and outcomes',
    'Safety concerns override confidentiality (duty to warn/protect)',
    'Explain confidentiality limits at the start of every encounter',
    'Document what was discussed privately vs. with family present',
  ],
  mustDisclose: [
    'Imminent danger to self (active suicidal ideation with plan/intent)',
    'Imminent danger to others (homicidal ideation with plan)',
    'Suspected child abuse or neglect',
    'Certain reportable conditions (varies by state)',
    'Court orders or legal requirements',
  ],
  mayDisclose: [
    'Information necessary for continuity of care (with consent when possible)',
    'Information to parents when clinically appropriate and adolescent agrees',
    'Information to school with written consent',
    'Information to other providers with appropriate releases',
  ],
  interviewApproach: [
    'Interview adolescent alone for part of the encounter',
    'Interview with family present for part of the encounter',
    'Explain confidentiality and its limits before private interview',
    'Ask permission before sharing specific information with parents',
    'Help adolescent communicate important information to parents when appropriate',
  ],
  documentation: [
    'Document that confidentiality was discussed',
    'Note what was discussed privately vs. with family',
    'Document consent for any information sharing',
    'Record safety concerns that required disclosure',
    'Note adolescent\'s understanding and agreement',
  ],
};

/**
 * Family involvement guidance for adolescent mental health
 */
export const FAMILY_INVOLVEMENT_GUIDANCE: FamilyInvolvementGuidance = {
  importance: 'Family involvement is critical for adolescent mental health outcomes, particularly for safety monitoring, treatment adherence, and creating a supportive home environment.',
  roles: [
    'Safety monitoring and supervision during high-risk periods',
    'Medication management and adherence support',
    'Transportation to appointments',
    'Creating a supportive home environment',
    'Implementing safety plan components (lethal means restriction)',
    'Recognizing warning signs and knowing when to seek help',
    'Participating in family therapy when indicated',
  ],
  communication: [
    'Provide psychoeducation about the adolescent\'s condition',
    'Explain treatment plan and expected timeline',
    'Discuss warning signs to monitor',
    'Review safety plan with family present',
    'Provide crisis resources and emergency contacts',
    'Schedule family meetings as part of treatment',
  ],
  safetyMonitoring: [
    'Explain level of supervision needed based on risk',
    '24/7 monitoring for high-risk patients',
    'Regular check-ins for moderate-risk patients',
    'Know location of adolescent at all times during crisis',
    'Monitor social media and communications if safety concern',
    'Secure lethal means (firearms, medications, sharp objects)',
  ],
  boundaries: [
    'Respect adolescent\'s need for privacy within safety limits',
    'Avoid over-involvement that undermines autonomy',
    'Balance supervision with age-appropriate independence',
    'Support adolescent\'s therapeutic relationship',
    'Avoid using information shared in therapy punitively',
  ],
};


/**
 * School coordination guidance
 */
export const SCHOOL_COORDINATION_GUIDANCE: SchoolCoordinationGuidance = {
  whenToInvolve: [
    'Academic functioning is significantly impaired',
    'Attendance problems related to mental health',
    'Safety concerns at school (bullying, self-harm)',
    'Need for academic accommodations',
    'Transition back to school after hospitalization',
    'Coordination of school-based mental health services',
  ],
  consentRequirements: [
    'Obtain written consent from parent/guardian (and adolescent when appropriate)',
    'Use FERPA-compliant release forms',
    'Specify what information can be shared',
    'Specify duration of consent',
    'Document consent in medical record',
    'Adolescent should be involved in deciding what to share',
  ],
  accommodations: [
    '504 Plan for mental health conditions',
    'IEP if educational impact is significant',
    'Extended time for assignments/tests',
    'Reduced course load during acute episodes',
    'Flexible attendance policies',
    'Access to school counselor',
    'Safe space/break room access',
    'Modified PE requirements if needed',
    'Permission to leave class for appointments',
  ],
  communicationPoints: [
    'General diagnosis (with consent) and functional impact',
    'Specific accommodations needed',
    'Warning signs school staff should monitor',
    'Who to contact if concerns arise',
    'Expected duration of accommodations',
    'Plan for gradual return to full functioning',
  ],
  returnToSchoolPlanning: [
    'Gradual reintegration when appropriate',
    'Identify trusted adult at school',
    'Plan for managing questions from peers',
    'Schedule for catching up on missed work',
    'Regular check-ins with school counselor',
    'Clear communication pathway between school and treatment team',
  ],
};

/**
 * Follow-up timing guidance
 */
export const FOLLOW_UP_GUIDANCE: FollowUpGuidance = {
  highRisk: 'Within 24-72 hours of ED discharge or within 3-7 days of inpatient discharge',
  moderateRisk: 'Within 7 days',
  lowRisk: 'Within 7-14 days',
  postDischarge: 'First outpatient appointment within 7 days of psychiatric discharge is critical - this is a high-risk period',
  ongoingCare: [
    'Weekly psychotherapy initially, then adjust based on progress',
    'Medication management every 2-4 weeks during titration',
    'Monthly medication checks once stable',
    'Crisis plan review at each visit',
    'Periodic reassessment of suicide risk',
    'Coordination with school at least quarterly',
    'Family sessions as clinically indicated',
  ],
};

/**
 * Generate complete adolescent care template
 */
export function generateAdolescentCareTemplate(context?: {
  isHighRisk?: boolean;
  hasSchoolIssues?: boolean;
  hasFamilyConflict?: boolean;
}): AdolescentCareTemplate {
  const specialConsiderations: string[] = [];

  if (context?.isHighRisk) {
    specialConsiderations.push('High-risk patient: Ensure 24/7 supervision and rapid follow-up');
    specialConsiderations.push('Consider partial hospitalization or intensive outpatient if not admitted');
  }

  if (context?.hasSchoolIssues) {
    specialConsiderations.push('School involvement critical: Initiate 504/IEP process if not already in place');
    specialConsiderations.push('Consider school-based mental health services as adjunct');
  }

  if (context?.hasFamilyConflict) {
    specialConsiderations.push('Family conflict present: Consider family therapy as part of treatment');
    specialConsiderations.push('May need to identify alternative safe adult if home environment is contributing factor');
  }

  return {
    confidentiality: CONFIDENTIALITY_GUIDANCE,
    familyInvolvement: FAMILY_INVOLVEMENT_GUIDANCE,
    schoolCoordination: SCHOOL_COORDINATION_GUIDANCE,
    followUpTiming: FOLLOW_UP_GUIDANCE,
    specialConsiderations,
  };
}


/**
 * Format adolescent care template for AI prompt injection
 */
export function formatAdolescentCareForPrompt(template: AdolescentCareTemplate): string {
  let formatted = '\n\n--- ADOLESCENT CARE COORDINATION TEMPLATE ---\n\n';

  formatted += '**CONFIDENTIALITY & CONSENT (INCLUDE IN RESPONSE):**\n';
  formatted += 'Key principles:\n';
  template.confidentiality.principles.slice(0, 3).forEach(p => {
    formatted += `• ${p}\n`;
  });
  formatted += '\nMust disclose for safety:\n';
  template.confidentiality.mustDisclose.slice(0, 3).forEach(d => {
    formatted += `• ${d}\n`;
  });
  formatted += '\nInterview approach:\n';
  template.confidentiality.interviewApproach.forEach(a => {
    formatted += `• ${a}\n`;
  });
  formatted += '\n';

  formatted += '**FAMILY INVOLVEMENT (INCLUDE IN RESPONSE):**\n';
  formatted += `${template.familyInvolvement.importance}\n\n`;
  formatted += 'Key roles:\n';
  template.familyInvolvement.roles.slice(0, 5).forEach(r => {
    formatted += `• ${r}\n`;
  });
  formatted += '\nSafety monitoring:\n';
  template.familyInvolvement.safetyMonitoring.slice(0, 4).forEach(s => {
    formatted += `• ${s}\n`;
  });
  formatted += '\n';

  formatted += '**SCHOOL COORDINATION (INCLUDE WHEN RELEVANT):**\n';
  formatted += 'When to involve school:\n';
  template.schoolCoordination.whenToInvolve.slice(0, 4).forEach(w => {
    formatted += `• ${w}\n`;
  });
  formatted += '\nPossible accommodations:\n';
  template.schoolCoordination.accommodations.slice(0, 5).forEach(a => {
    formatted += `• ${a}\n`;
  });
  formatted += '\n';

  formatted += '**FOLLOW-UP TIMING:**\n';
  formatted += `• High risk: ${template.followUpTiming.highRisk}\n`;
  formatted += `• Moderate risk: ${template.followUpTiming.moderateRisk}\n`;
  formatted += `• Low risk: ${template.followUpTiming.lowRisk}\n`;
  formatted += `• Post-discharge: ${template.followUpTiming.postDischarge}\n`;
  formatted += '\n';

  if (template.specialConsiderations.length > 0) {
    formatted += '**SPECIAL CONSIDERATIONS FOR THIS CASE:**\n';
    template.specialConsiderations.forEach(c => {
      formatted += `⚠️ ${c}\n`;
    });
    formatted += '\n';
  }

  formatted += '--- END ADOLESCENT CARE TEMPLATE ---\n\n';

  return formatted;
}

/**
 * Check if query involves adolescent patient
 */
export function isAdolescentPatient(query: string): boolean {
  const adolescentPatterns = [
    /\b(1[0-9]|20)[- ]?year[- ]?old\b/i,
    /\badolescent\b/i,
    /\bteenager?\b/i,
    /\bteen\b/i,
    /\bpediatric\b/i,
    /\bchild\b/i,
    /\bminor\b/i,
    /\bhigh school\b/i,
    /\bmiddle school\b/i,
    /\bschool[- ]?age\b/i,
  ];

  return adolescentPatterns.some(pattern => pattern.test(query));
}

/**
 * Generate a brief adolescent care summary for responses
 */
export function generateAdolescentCareSummary(): string {
  return `
**Adolescent-Specific Considerations:**

**Confidentiality & Consent:**
• Interview adolescent alone AND with family present
• Explain confidentiality limits upfront (safety overrides privacy)
• Balance autonomy with parental involvement for safety

**Family Involvement:**
• Critical for safety monitoring and treatment adherence
• Assign specific roles in safety plan implementation
• Provide psychoeducation and crisis resources

**School Coordination (with consent):**
• Consider 504 Plan or IEP for academic accommodations
• Coordinate return-to-school planning after hospitalization
• Identify trusted adult at school

**Follow-Up Timing:**
• High risk: Within 24-72 hours of discharge
• Moderate risk: Within 7 days
• Post-psychiatric discharge: First appointment within 7 days (critical period)
`;
}
