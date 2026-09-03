import { StudentProfile, StudyNote, MistakeItem, StudyPlannerTask, ExamCountdownItem } from '../types';

export const DEFAULT_PROFILE: StudentProfile = {
  id: '',
  name: 'NEW USER',
  email: '',
  educationLevel: 'senior_secondary',
  grade: 'SS 3',
  country: 'Nigeria',
  subjects: [],
  targetExams: [],
  examDates: {},
  studyStreakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  isPremium: false,
  onboardingCompleted: true,
};

export const INITIAL_STUDY_NOTES: StudyNote[] = [
  {
    id: 'note-bio-ss3-001',
    userId: 'student-demo-01',
    title: 'Photosynthesis, Chloroplast Structure & Light-Dependent Reactions',
    subject: 'Biology',
    gradeLevel: 'SS 3',
    educationLevel: 'senior_secondary',
    topic: 'Photosynthesis & Plant Nutrition',
    fileNames: ['SS3_Biology_Term1_Photosynthesis.pdf'],
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-28T10:00:00Z',
    rawText: `Photosynthesis is the biochemical process by which green plants, algae, and certain bacteria convert light energy into chemical energy stored in glucose.
Chemical Equation: 6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2.
It occurs in two distinct stages inside the chloroplast:
1. Light-Dependent Reactions (occurs on Thylakoid membranes / Grana): Light energy is captured by Chlorophyll pigments. Photolysis of water occurs: 2H2O -> 4H+ + 4e- + O2. ATP and NADPH are synthesized to power the dark reaction.
2. Light-Independent Reactions / Calvin Cycle (occurs in the Stroma): Carbon dioxide is fixed by the enzyme RuBisCO into 3-PGA, then reduced using ATP and NADPH into glyceraldehyde-3-phosphate (G3P) and ultimately hexose sugars (glucose).
Limiting factors: Light intensity, Carbon dioxide concentration, and Temperature.`,
    resources: {
      summary: {
        title: 'Mastering Photosynthesis: Mechanisms, Sites & Energy Conversion',
        overview: 'Photosynthesis is the core energetic foundation of terrestrial life. Green plants use chlorophyll within chloroplasts to transform solar photons and inorganic substrates (CO₂ and H₂O) into chemical energy (glucose), releasing oxygen as a vital byproduct.',
        keyPoints: [
          'Overall balanced reaction: 6CO₂ + 6H₂O + Solar Energy → C₆H₁₂O₆ + 6O₂.',
          'Two main phases: Light-Dependent reactions (in thylakoids/grana) and Calvin Cycle (in stroma).',
          'Photolysis of water generates protons, electrons, and evolves oxygen gas into the atmosphere.',
          'RuBisCO is the primary catalyst responsible for atmospheric carbon fixation in the stroma.',
          'Key limiting factors affecting the photosynthetic rate are light intensity, ambient CO₂ level, and enzyme-sensitive temperature.',
        ],
        importantConcepts: [
          {
            concept: 'Photolysis of Water',
            explanation: 'The light-driven enzymatic splitting of water molecules (2H₂O → 4H⁺ + 4e⁻ + O₂) within photosystem II, replenishing lost chlorophyll electrons and providing H⁺ for NADPH synthesis.',
          },
          {
            concept: 'Calvin Cycle (Carbon Fixation)',
            explanation: 'A cyclic series of biochemical steps in the chloroplast stroma where CO₂ is bound to RuBP by RuBisCO, then reduced to sugar using high-energy ATP and NADPH.',
          },
        ],
        definitions: [
          {
            term: 'Thylakoid',
            definition: 'Flattened sac-like membrane inside chloroplasts where chlorophyll molecules are embedded and light reactions take place.',
          },
          {
            term: 'Stroma',
            definition: 'The fluid-filled internal space surrounding the thylakoids in chloroplasts, housing enzymes for the Calvin cycle.',
          },
          {
            term: 'RuBisCO',
            definition: 'Ribulose-1,5-bisphosphate carboxylase-oxygenase, the essential plant enzyme that fixes atmospheric CO₂.',
          },
        ],
        examples: [
          {
            title: 'Starch Test in Leaves (Iodine Test)',
            explanation: 'A leaf de-starched in darkness for 24h, then exposed to sunlight, turns blue-black with iodine solution, confirming localized starch production from photosynthesis.',
          },
        ],
      },
      keyPoints: [
        'Photosynthesis converts solar photons into stable chemical bonds (glucose).',
        'Thylakoid membranes are the site of Photolysis and ATP/NADPH photophosphorylation.',
        'Stroma is the fluid site where dark reactions (Calvin Cycle) produce simple carbohydrates.',
        'Temperature above 40°C denatures RuBisCO and slows the photosynthetic rate.',
      ],
      flashcards: [
        {
          id: 'fc-bio-01',
          question: 'What is the specific cellular location of the Light-Dependent reactions in photosynthesis?',
          answer: 'The Thylakoid membranes (Grana) of the chloroplast.',
          explanation: 'Thylakoids contain embedded chlorophyll pigments and electron transport chains that harvest photon energy.',
          topic: 'Photosynthesis Stages',
          difficulty: 'easy',
          repetitionCount: 3,
          intervalDays: 4,
          easeFactor: 2.5,
          status: 'review',
        },
        {
          id: 'fc-bio-02',
          question: 'What is the chemical reaction and significance of the photolysis of water?',
          answer: '2H₂O → 4H⁺ + 4e⁻ + O₂. It provides electrons to replace those excited in chlorophyll and releases oxygen.',
          explanation: 'Occurs inside Photosystem II on the lumen side of the thylakoid membrane.',
          topic: 'Light Reactions',
          difficulty: 'medium',
          repetitionCount: 2,
          intervalDays: 2,
          easeFactor: 2.4,
          status: 'learning',
        },
        {
          id: 'fc-bio-03',
          question: 'Which key enzyme catalyzes the fixation of carbon dioxide in the Calvin Cycle?',
          answer: 'RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase).',
          explanation: 'RuBisCO attaches CO₂ to the 5-carbon sugar RuBP in the chloroplast stroma.',
          topic: 'Calvin Cycle',
          difficulty: 'hard',
          repetitionCount: 1,
          intervalDays: 1,
          easeFactor: 2.3,
          status: 'learning',
        },
      ],
      quizzes: [
        {
          id: 'qz-bio-01',
          question: 'During photosynthesis, where does the oxygen released as a byproduct originate from?',
          options: [
            'A. Carbon dioxide (CO₂)',
            'B. Water (H₂O) via photolysis',
            'C. Glucose breakdown',
            'D. Atmospheric nitrogen',
          ],
          correctAnswer: 'B. Water (H₂O) via photolysis',
          correctOptionIndex: 1,
          explanation: 'Isotopic labeling experiments (using Oxygen-18) proved that all O₂ evolved comes from the photolytic splitting of water (H₂O), not from carbon dioxide.',
          topic: 'Light Reactions',
          difficulty: 'medium',
          sourceType: 'ai_generated',
          sourceLabel: 'LearnLab AI Diagnostic',
        },
        {
          id: 'qz-bio-02',
          question: 'Which of the following conditions would immediately halt the light-independent reactions (Calvin cycle)?',
          options: [
            'A. Absence of oxygen in the atmosphere',
            'B. Immediate depletion of ATP and NADPH from the light stage',
            'C. Excess green light wavelengths',
            'D. Increased soil moisture',
          ],
          correctAnswer: 'B. Immediate depletion of ATP and NADPH from the light stage',
          correctOptionIndex: 1,
          explanation: 'Although the Calvin cycle does not directly require light photons, it relies continually on ATP and NADPH generated in the thylakoid light reactions.',
          topic: 'Calvin Cycle',
          difficulty: 'hard',
          sourceType: 'ai_generated',
          sourceLabel: 'LearnLab AI Diagnostic',
        },
      ],
      studyGuideMarkdown: `# Study Guide: Photosynthesis & Plant Energetics

### 1. Architectural Overview of the Chloroplast
- **Double Membrane**: Outer and inner lipid bilayer regulating molecular transport.
- **Thylakoids**: Flattened sacs organized into stacks called **Grana**.
- **Stroma**: Gel-like alkaline fluid containing enzymes, circular DNA, and 70S ribosomes.

### 2. Comparative Matrix: Light vs. Dark Reactions
| Attribute | Light-Dependent Phase | Light-Independent Phase (Calvin) |
| :--- | :--- | :--- |
| **Site** | Thylakoid Membrane / Grana | Chloroplast Stroma |
| **Input Required** | Sunlight, H₂O, NADP⁺, ADP | CO₂, ATP, NADPH |
| **Output Generated**| O₂, ATP, NADPH | Glucose (C₆H₁₂O₆), ADP, NADP⁺ |
| **Key Enzyme/Complex** | Photosystem II & I, ATP Synthase | RuBisCO |

### 3. Exam Tips for WAEC & JAMB
- Always specify that **water** is the electron donor for the light reactions.
- Remember that extreme temperature decreases the rate of photosynthesis because **enzymes are proteinaceous and denature**.
`,
      glossary: [
        { term: 'Autotroph', definition: 'An organism capable of synthesizing its own food from inorganic substances using light or chemical energy.' },
        { term: 'Chemiosmosis', definition: 'The movement of ions across a semipermeable membrane down their electrochemical gradient, generating ATP via ATP synthase.' },
        { term: 'Photophosphorylation', definition: 'The production of ATP from ADP and phosphate using energy derived from light.' },
      ],
      cheatSheet: [
        {
          category: 'Chemical Formulas',
          content: [
            'Net Equation: 6CO₂ + 6H₂O + Photons → C₆H₁₂O₆ + 6O₂',
            'Photolysis: 2H₂O → 4H⁺ + 4e⁻ + O₂',
          ],
        },
        {
          category: 'Key Structures & Sites',
          content: [
            'Light Reactions → Thylakoid Membranes (Grana)',
            'Dark Reactions (Calvin Cycle) → Stroma',
          ],
        },
      ],
      revisionChecklist: [
        { task: 'Memorize balanced chemical equation for photosynthesis', completed: true },
        { task: 'Label the parts of a chloroplast (grana, stroma, thylakoid, lumen)', completed: true },
        { task: 'Differentiate between cyclic and non-cyclic photophosphorylation', completed: false },
        { task: 'Understand the three main limiting factors (Light, CO₂, Temp)', completed: true },
      ],
    },
  },
];

export const INITIAL_MISTAKES: MistakeItem[] = [
  {
    id: 'mst-001',
    questionId: 'jamb-eng-2024-02',
    question: 'The principal, accompanied by his teachers and the school prefects, _______ arriving at the auditorium now.',
    options: ['A. are', 'B. is', 'C. were', 'D. have been'],
    correctAnswer: 'B. is',
    userWrongAnswer: 'A. are',
    explanation: 'In grammatical concord, expressions joined by "accompanied by" or "as well as" do not affect the number of the subject. The subject is singular ("The principal"), so the verb must be "is".',
    subject: 'English Language',
    topic: 'Lexis & Structure (Concord)',
    examName: 'JAMB / UTME',
    year: 2024,
    sourceType: 'past_question',
    addedAt: '2026-09-01T14:20:00Z',
    reviewedCount: 1,
    resolved: false,
  },
  {
    id: 'mst-002',
    questionId: 'waec-chem-2023-09',
    question: 'What is the pH of a 0.001 mol/dm³ solution of Hydrochloric acid (HCl)?',
    options: ['A. 1.0', 'B. 2.0', 'C. 3.0', 'D. 11.0'],
    correctAnswer: 'C. 3.0',
    userWrongAnswer: 'A. 1.0',
    explanation: '0.001 mol/dm³ = 10⁻³ M. pH = -log₁₀[H⁺] = -log₁₀(10⁻³) = 3.0.',
    subject: 'Chemistry',
    topic: 'Acids, Bases and Salts',
    examName: 'WAEC (WASSCE)',
    year: 2023,
    sourceType: 'past_question',
    addedAt: '2026-08-30T16:15:00Z',
    reviewedCount: 0,
    resolved: false,
  },
];

export const INITIAL_PLANNER_TASKS: StudyPlannerTask[] = [
  {
    id: 'task-01',
    title: 'Review Photosynthesis & Active Recall Flashcards',
    subject: 'Biology',
    topic: 'Photosynthesis & Plant Energetics',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    time: '16:00',
    notes: 'Focus on Light vs Dark reaction differences and RuBisCO function.',
    completed: false,
    priority: 'high',
    estimatedMinutes: 30,
    isSpacedRepetition: true,
  },
  {
    id: 'task-02',
    title: 'JAMB UTME Physics Past Questions: Current Electricity',
    subject: 'Physics',
    topic: 'Current Electricity & Circuits',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '17:30',
    notes: 'Solve 15 parallel and series circuit resistance calculation questions.',
    completed: false,
    priority: 'medium',
    estimatedMinutes: 45,
  },
  {
    id: 'task-03',
    title: 'WAEC Chemistry: Revise Acid-Base Titration Calculations',
    subject: 'Chemistry',
    topic: 'Acid-Base Titration',
    date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    time: '15:00',
    notes: 'Standard solutions, molar concentration, and indicator color changes.',
    completed: false,
    priority: 'low',
    estimatedMinutes: 40,
  },
];

export const INITIAL_EXAM_COUNTDOWNS: ExamCountdownItem[] = [
  {
    id: 'cd-jamb-2026',
    examName: 'JAMB / UTME 2026 Examination',
    subject: 'All 4 Registered Subjects',
    targetDate: '2026-04-20',
    notes: 'Target Score: 320+ for Federal University Medicine & Surgery admission.',
  },
  {
    id: 'cd-waec-2026',
    examName: 'WAEC WASSCE Senior School Certificate',
    subject: '9 Core & Science Subjects',
    targetDate: '2026-05-12',
    notes: 'Aim for 7+ distinctions (A1/B2) across all science subjects.',
  },
];
