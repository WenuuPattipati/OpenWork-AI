/**
 * Stanley-Brown Safety Plan Template
 * Standardized safety planning intervention for suicide prevention
 * Based on evidence-based Stanley-Brown Safety Planning Intervention
 */

export interface SafetyPlanSection {
  title: string;
  description: string;
  prompts: string[];
  examples?: string[];
}

export interface SafetyPlan {
  sections: SafetyPlanSection[];
  crisisResources: CrisisResource[];
  lethalMeansRestriction: LethalMeansGuidance;
  caregiverInvolvement: string[];
  documentationNotes: string[];
}

export interface CrisisResource {
  name: string;
  number: string;
  description: string;
  availability: string;
}

export interface LethalMeansGuidance {
  importance: string;
  actions: string[];
  itemsToSecure: string[];
  storageRecommendations: string[];
}

/**
 * Standard crisis resources (US-based, can be localized)
 */
export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    description: 'National suicide prevention hotline - call or text',
    availability: '24/7',
  },
  {
    name: 'Crisis Text Line',
    number: 'Text HOME to 741741',
    description: 'Text-based crisis support',
    availability: '24/7',
  },
  {
    name: 'Emergency Services',
    number: '911',
    description: 'For immediate life-threatening emergencies',
    availability: '24/7',
  },
  {
    name: 'Trevor Project (LGBTQ+ Youth)',
    number: '1-866-488-7386',
    description: 'Crisis intervention for LGBTQ+ young people',
    availability: '24/7',
  },
  {
    name: 'Veterans Crisis Line',
    number: '988, Press 1',
    description: 'For veterans and their families',
    availability: '24/7',
  },
];

/**
 * Generate a complete Stanley-Brown Safety Plan template
 */
export function generateSafetyPlan(patientContext?: {
  isAdolescent?: boolean;
  hasSubstanceUse?: boolean;
  hasSelfHarm?: boolean;
  specificConcerns?: string[];
}): SafetyPlan {
  const sections: SafetyPlanSection[] = [
    {
      title: 'Step 1: Warning Signs',
      description: 'Recognize thoughts, images, moods, situations, or behaviors that indicate a crisis may be developing',
      prompts: [
        'What thoughts or images do you have before a crisis?',
        'What mood or feelings do you notice?',
        'What situations tend to trigger these feelings?',
        'What behaviors do you notice in yourself?',
      ],
      examples: [
        'Feeling hopeless or trapped',
        'Thinking "I can\'t do this anymore"',
        'Isolating from friends and family',
        'Difficulty sleeping or sleeping too much',
        'Increased irritability or agitation',
      ],
    },
    {
      title: 'Step 2: Internal Coping Strategies',
      description: 'Things I can do to take my mind off my problems without contacting another person',
      prompts: [
        'What activities help distract you?',
        'What helps you feel calm or relaxed?',
        'What gives you a sense of accomplishment?',
      ],
      examples: [
        'Physical exercise (walking, running, sports)',
        'Listening to music',
        'Deep breathing or meditation',
        'Taking a shower or bath',
        'Writing in a journal',
        'Playing video games',
        'Watching a favorite show',
        'Drawing or creative activities',
      ],
    },
    {
      title: 'Step 3: People and Social Settings for Distraction',
      description: 'People and places that provide distraction (without necessarily discussing the crisis)',
      prompts: [
        'Who can you spend time with to take your mind off things?',
        'What social settings help you feel better?',
        'Where can you go to be around others?',
      ],
      examples: [
        'Coffee shop or library',
        'Friend\'s house',
        'Family member\'s home',
        'Community center or gym',
        'Place of worship',
      ],
    },
    {
      title: 'Step 4: People I Can Ask for Help',
      description: 'People I can reach out to when I need support (family, friends, trusted adults)',
      prompts: [
        'Who do you trust to talk to about how you\'re feeling?',
        'Who has helped you in the past?',
        'Who would want to know if you were struggling?',
      ],
      examples: [
        'Parent or guardian',
        'Sibling or other family member',
        'Close friend',
        'Teacher or school counselor',
        'Coach or mentor',
        'Religious leader',
      ],
    },
    {
      title: 'Step 5: Professionals and Agencies to Contact',
      description: 'Mental health professionals and crisis services',
      prompts: [
        'Who is your therapist or counselor?',
        'Who is your psychiatrist or prescriber?',
        'What is your local crisis line?',
        'Where is your nearest emergency department?',
      ],
      examples: [
        'Therapist: [Name] - [Phone]',
        'Psychiatrist: [Name] - [Phone]',
        'Primary care: [Name] - [Phone]',
        '988 Suicide & Crisis Lifeline',
        'Local crisis team: [Phone]',
        'Nearest ED: [Hospital Name]',
      ],
    },
    {
      title: 'Step 6: Making the Environment Safe',
      description: 'Reducing access to lethal means',
      prompts: [
        'What items could be used for self-harm that should be secured?',
        'Who can help secure these items?',
        'Where can dangerous items be stored safely?',
      ],
      examples: [
        'Firearms - store with trusted person or use gun safe',
        'Medications - lock up or give to trusted person',
        'Sharp objects - secure or remove',
        'Alcohol - remove from home during crisis',
      ],
    },
  ];

  // Add adolescent-specific content
  if (patientContext?.isAdolescent) {
    sections[3].examples?.push('School counselor', 'Trusted teacher', 'Coach');
    sections[1].examples?.push('Texting friends', 'Social media (positive accounts)', 'Gaming with friends online');
  }

  // Add substance use considerations
  if (patientContext?.hasSubstanceUse) {
    sections.push({
      title: 'Step 7: Substance Use Safety',
      description: 'Avoiding substances that increase risk',
      prompts: [
        'What substances increase your risk?',
        'Who can help you stay sober during a crisis?',
        'What are your triggers for substance use?',
      ],
      examples: [
        'Avoid alcohol during crisis periods',
        'Call sponsor or support person',
        'Attend extra meetings if needed',
        'Remove substances from home',
      ],
    });
  }

  const lethalMeansRestriction: LethalMeansGuidance = {
    importance: 'Reducing access to lethal means is one of the most effective suicide prevention strategies. Most suicidal crises are brief, and limiting access during these periods saves lives.',
    actions: [
      'Discuss lethal means restriction with patient and caregivers',
      'Identify all potential means in the home',
      'Create a plan to secure or remove each item',
      'Identify a trusted person to hold items temporarily',
      'Follow up on implementation',
    ],
    itemsToSecure: [
      'Firearms and ammunition (store separately, off-site preferred)',
      'Prescription medications (especially opioids, benzodiazepines, insulin)',
      'Over-the-counter medications (acetaminophen, antihistamines)',
      'Sharp objects (knives, razors, scissors)',
      'Ropes, cords, belts',
      'Alcohol (increases impulsivity)',
      'Car keys (if driving into traffic is a concern)',
    ],
    storageRecommendations: [
      'Store firearms with a trusted friend, family member, or at a gun range',
      'Use a gun safe with combination known only to trusted adult',
      'Lock medications in a lockbox; trusted adult holds key',
      'Dispense medications in limited quantities',
      'Remove or secure items rather than relying on promises not to use them',
    ],
  };

  const caregiverInvolvement: string[] = [
    'Review safety plan with caregivers present',
    'Ensure caregivers understand warning signs',
    'Assign specific roles in lethal means restriction',
    'Provide caregivers with crisis resources',
    'Discuss supervision expectations',
    'Plan for 24/7 monitoring during high-risk periods',
    'Schedule family follow-up appointments',
  ];

  const documentationNotes: string[] = [
    'Document that safety planning was completed',
    'Note patient and caregiver understanding',
    'Record lethal means counseling and actions taken',
    'Document follow-up plan and appointments',
    'Note any barriers to safety plan implementation',
    'Record crisis resources provided',
  ];

  return {
    sections,
    crisisResources: CRISIS_RESOURCES,
    lethalMeansRestriction,
    caregiverInvolvement,
    documentationNotes,
  };
}

/**
 * Format safety plan for AI prompt injection
 */
export function formatSafetyPlanForPrompt(plan: SafetyPlan): string {
  let formatted = '\n\n--- SAFETY PLAN TEMPLATE (STANLEY-BROWN) ---\n\n';
  
  formatted += '**INCLUDE THE FOLLOWING SAFETY PLAN STRUCTURE IN YOUR RESPONSE:**\n\n';

  plan.sections.forEach((section) => {
    formatted += `**${section.title}**\n`;
    formatted += `${section.description}\n`;
    formatted += 'Key elements:\n';
    section.prompts.forEach(prompt => {
      formatted += `• ${prompt}\n`;
    });
    formatted += '\n';
  });

  formatted += '**CRISIS RESOURCES TO PROVIDE:**\n';
  plan.crisisResources.forEach(resource => {
    formatted += `• ${resource.name}: ${resource.number} (${resource.availability})\n`;
  });
  formatted += '\n';

  formatted += '**LETHAL MEANS RESTRICTION (CRITICAL):**\n';
  formatted += `${plan.lethalMeansRestriction.importance}\n\n`;
  formatted += 'Items to address:\n';
  plan.lethalMeansRestriction.itemsToSecure.forEach(item => {
    formatted += `• ${item}\n`;
  });
  formatted += '\n';

  formatted += '**CAREGIVER INVOLVEMENT:**\n';
  plan.caregiverInvolvement.forEach(item => {
    formatted += `• ${item}\n`;
  });
  formatted += '\n';

  formatted += '--- END SAFETY PLAN TEMPLATE ---\n\n';

  return formatted;
}

/**
 * Generate a brief safety plan summary for responses
 */
export function generateSafetyPlanSummary(): string {
  return `
**Safety Plan Components (Stanley-Brown Framework):**
1. **Warning Signs** - Recognize personal crisis indicators
2. **Internal Coping** - Self-soothing strategies without others
3. **Social Distraction** - People/places for healthy distraction
4. **Support Network** - Trusted people to contact for help
5. **Professional Resources** - Therapist, crisis lines, ED
6. **Environment Safety** - Lethal means restriction

**Crisis Resources:**
• 988 Suicide & Crisis Lifeline (call or text 988)
• Crisis Text Line (text HOME to 741741)
• Emergency: 911

**Lethal Means Counseling:**
• Secure firearms (off-site storage preferred)
• Lock medications (trusted adult holds key)
• Remove/secure sharp objects
• Limit alcohol access during crisis periods
`;
}
