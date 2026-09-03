export type EducationLevel = 'primary' | 'junior_secondary' | 'senior_secondary' | 'university';

export type PrimaryGrade = 'Primary 1' | 'Primary 2' | 'Primary 3' | 'Primary 4' | 'Primary 5' | 'Primary 6';
export type JuniorSecGrade = 'JSS 1' | 'JSS 2' | 'JSS 3';
export type SeniorSecGrade = 'SS 1' | 'SS 2' | 'SS 3';
export type UniversityYear = '100 Level' | '200 Level' | '300 Level' | '400 Level' | '500 Level' | 'Postgraduate';

export type AcademicGrade = PrimaryGrade | JuniorSecGrade | SeniorSecGrade | UniversityYear | string;

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  avatarColor?: string;
  educationLevel: EducationLevel;
  grade: AcademicGrade;
  country: string;
  institution?: string;
  faculty?: string;
  course?: string;
  subjects: string[];
  targetExams: string[];
  examDates?: Record<string, string>; // examName -> YYYY-MM-DD
  studyStreakDays: number;
  lastActiveDate: string;
  isPremium: boolean;
  onboardingCompleted: boolean;
}

export type QuestionSourceType = 'past_question' | 'ai_generated' | 'user_provided';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  // Spaced repetition metadata
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
  lastReviewed?: string;
  nextReviewDate?: string;
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string; // The text of correct option or option letter
  correctOptionIndex: number; // 0-based index
  explanation: string;
  topic: string;
  subject?: string;
  examName?: string;
  examId?: string;
  classLevel?: string;
  educationLevel?: EducationLevel;
  year?: number | string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceType: QuestionSourceType;
  sourceLabel?: string; // e.g. "WAEC 2023 Q14" or "JAMB 2024"
}

export interface StudyResource {
  summary: {
    title: string;
    overview: string;
    keyPoints: string[];
    importantConcepts: { concept: string; explanation: string }[];
    definitions: { term: string; definition: string }[];
    examples: { title: string; explanation: string }[];
  };
  keyPoints: string[];
  flashcards: Flashcard[];
  quizzes: QuizQuestion[];
  studyGuideMarkdown: string;
  glossary: { term: string; definition: string }[];
  cheatSheet: { category: string; content: string[] }[];
  comparisonTables?: { title: string; headers: string[]; rows: string[][] }[];
  conceptMap?: { coreTopic: string; branches: { subtopic: string; details: string[] }[] };
  detectedSubject?: string;
  detectedTopic?: string;
  detectedTopics?: string[];
  revisionChecklist: { task: string; completed: boolean }[];
}

export interface StudyNote {
  id: string;
  userId: string;
  title: string;
  subject: string;
  gradeLevel: AcademicGrade;
  educationLevel: EducationLevel;
  topic: string;
  detectedTopics?: string[];
  sourceFileType?: string;
  rawText: string;
  fileNames?: string[];
  createdAt: string;
  updatedAt: string;
  resources: StudyResource;
}

export interface QuizResult {
  id: string;
  userId?: string;
  noteId?: string;
  examId?: string;
  subject: string;
  topic: string;
  title: string;
  date: string;
  totalQuestions: number;
  score: number;
  percentage: number;
  timeSpentSeconds?: number;
  answers: {
    questionId: string;
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
    topic: string;
  }[];
  weakTopics: string[];
  strongTopics: string[];
  recommendedNextSteps: string[];
}

export interface MistakeItem {
  id: string;
  userId?: string;
  questionId: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userWrongAnswer: string;
  explanation: string;
  subject: string;
  topic: string;
  examName?: string;
  year?: string | number;
  sourceType: QuestionSourceType;
  addedAt: string;
  reviewedCount: number;
  resolved: boolean;
}

export type ExamCategory = 'school_exam' | 'standardized_exam';

export interface ExamDefinition {
  id: string;
  name: string;
  shortName: string;
  level: EducationLevel;
  category?: ExamCategory;
  classLevel?: string;
  term?: string;
  assessmentType?: string;
  description: string;
  subjects: string[];
  years: number[];
  timedByDefault: boolean;
  defaultTimeMinutes?: number;
  officialPastQuestionsAvailable: boolean;
}

export interface MockExamConfig {
  examId: string;
  examName: string;
  category?: ExamCategory;
  classLevel?: string;
  term?: string;
  assessmentType?: string;
  subject: string;
  topics?: string[];
  questionCount: number; // 5, 10, 20, 30, 50, custom
  difficulty: 'easy' | 'medium' | 'hard';
  source: 'all' | 'past_questions' | 'ai_practice';
  year?: number | 'all';
  isTimed: boolean;
  durationMinutes: number;
}

export interface StudyPlannerTask {
  id: string;
  userId?: string;
  title: string;
  subject: string;
  topic?: string;
  date?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  time?: string;
  notes?: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  estimatedMinutes?: number;
  isSpacedRepetition?: boolean;
}

export interface StudyBuddyMessage {
  id: string;
  sender: 'user' | 'assistant' | 'ai';
  text: string;
  timestamp: string;
  attachmentName?: string;
  attachmentType?: string;
}

export interface StudyBuddyDailyLimit {
  date: string; // YYYY-MM-DD
  usedCount: number;
  maxLimit: number; // default 4 for free
}

export interface ExamCountdownItem {
  id: string;
  userId?: string;
  examName: string;
  subject?: string;
  targetDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface ExamReadinessScore {
  overallPercentage: number;
  explanation: string;
  strongTopics: string[];
  weakTopics: string[];
  recommendedAction: string;
  breakdown: {
    practiceAccuracy: number;
    mockExamScore: number;
    topicCoverage: number;
    mistakeClearance: number;
  };
  subjectMastery: Record<string, number>;
}
