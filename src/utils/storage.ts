import {
  StudentProfile,
  StudyNote,
  QuizResult,
  MistakeItem,
  StudyPlannerTask,
  ExamCountdownItem,
  StudyBuddyMessage,
  StudyBuddyDailyLimit,
  ExamReadinessScore,
} from '../types';
import {
  DEFAULT_PROFILE,
  INITIAL_STUDY_NOTES,
  INITIAL_MISTAKES,
  INITIAL_PLANNER_TASKS,
  INITIAL_EXAM_COUNTDOWNS,
} from '../data/initialData';

const KEYS = {
  PROFILE: 'learnlab_student_profile',
  NOTES: 'learnlab_study_notes',
  QUIZ_RESULTS: 'learnlab_quiz_results',
  MISTAKES: 'learnlab_mistake_bank',
  PLANNER: 'learnlab_study_planner',
  COUNTDOWNS: 'learnlab_exam_countdowns',
  STUDYBUDDY_MESSAGES: 'learnlab_studybuddy_messages',
  STUDYBUDDY_LIMIT: 'learnlab_studybuddy_daily_limit',
};

// Profile
export function getStoredProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

// Notes
export function getStoredNotes(): StudyNote[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTES);
    if (!raw) {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(INITIAL_STUDY_NOTES));
      return INITIAL_STUDY_NOTES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STUDY_NOTES;
  }
}

export function saveStoredNotes(notes: StudyNote[]): void {
  try {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save notes', e);
  }
}

// Quiz & Exam Results
export function getStoredQuizResults(): QuizResult[] {
  try {
    const raw = localStorage.getItem(KEYS.QUIZ_RESULTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredQuizResult(result: QuizResult): void {
  try {
    const existing = getStoredQuizResults();
    const updated = [result, ...existing];
    localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save quiz result', e);
  }
}

// Mistake Bank
export function getStoredMistakes(): MistakeItem[] {
  try {
    const raw = localStorage.getItem(KEYS.MISTAKES);
    if (!raw) {
      localStorage.setItem(KEYS.MISTAKES, JSON.stringify(INITIAL_MISTAKES));
      return INITIAL_MISTAKES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MISTAKES;
  }
}

export function saveStoredMistakes(mistakes: MistakeItem[]): void {
  try {
    localStorage.setItem(KEYS.MISTAKES, JSON.stringify(mistakes));
  } catch (e) {
    console.error('Failed to save mistakes', e);
  }
}

export function addMistakeItem(mistake: Omit<MistakeItem, 'id' | 'addedAt' | 'reviewedCount' | 'resolved'>): void {
  const current = getStoredMistakes();
  // Prevent duplicate questions in mistake bank
  const exists = current.some(
    (m) => m.question.trim().toLowerCase() === mistake.question.trim().toLowerCase() && !m.resolved
  );
  if (exists) return;

  const newItem: MistakeItem = {
    ...mistake,
    id: 'mst-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    addedAt: new Date().toISOString(),
    reviewedCount: 0,
    resolved: false,
  };
  saveStoredMistakes([newItem, ...current]);
}

// Planner Tasks
export function getStoredPlannerTasks(): StudyPlannerTask[] {
  try {
    const raw = localStorage.getItem(KEYS.PLANNER);
    if (!raw) {
      localStorage.setItem(KEYS.PLANNER, JSON.stringify(INITIAL_PLANNER_TASKS));
      return INITIAL_PLANNER_TASKS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((t: any) => ({
        ...t,
        priority: t.priority || 'medium',
        estimatedMinutes: t.estimatedMinutes || 45,
      }));
    }
    return INITIAL_PLANNER_TASKS;
  } catch {
    return INITIAL_PLANNER_TASKS;
  }
}

export const getStoredTasks = getStoredPlannerTasks;

export function saveStoredPlannerTasks(tasks: StudyPlannerTask[]): void {
  try {
    localStorage.setItem(KEYS.PLANNER, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save planner tasks', e);
  }
}

export const saveStoredTasks = saveStoredPlannerTasks;
export const getStoredQuizHistory = getStoredQuizResults;

export function saveStoredStudyBuddyLimit(limit: StudyBuddyDailyLimit): void {
  try {
    localStorage.setItem(KEYS.STUDYBUDDY_LIMIT, JSON.stringify(limit));
  } catch (e) {
    console.error('Failed to save studybuddy limit', e);
  }
}

export const getStoredStudyBuddyLimit = getStudyBuddyDailyLimit;

// Exam Countdowns
export function getStoredCountdowns(): ExamCountdownItem[] {
  try {
    const raw = localStorage.getItem(KEYS.COUNTDOWNS);
    if (!raw) {
      localStorage.setItem(KEYS.COUNTDOWNS, JSON.stringify(INITIAL_EXAM_COUNTDOWNS));
      return INITIAL_EXAM_COUNTDOWNS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXAM_COUNTDOWNS;
  }
}

export function saveStoredCountdowns(items: ExamCountdownItem[]): void {
  try {
    localStorage.setItem(KEYS.COUNTDOWNS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save countdowns', e);
  }
}

// StudyBuddy Daily Limit (Strict 4 replies/day for free users)
export function getStudyBuddyDailyLimit(): StudyBuddyDailyLimit {
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    const raw = localStorage.getItem(KEYS.STUDYBUDDY_LIMIT);
    if (!raw) {
      const initial: StudyBuddyDailyLimit = { date: todayStr, usedCount: 0, maxLimit: 4 };
      localStorage.setItem(KEYS.STUDYBUDDY_LIMIT, JSON.stringify(initial));
      return initial;
    }
    const parsed: StudyBuddyDailyLimit = JSON.parse(raw);
    if (parsed.date !== todayStr) {
      // Reset for a new calendar day
      const refreshed: StudyBuddyDailyLimit = { date: todayStr, usedCount: 0, maxLimit: 4 };
      localStorage.setItem(KEYS.STUDYBUDDY_LIMIT, JSON.stringify(refreshed));
      return refreshed;
    }
    return parsed;
  } catch {
    return { date: todayStr, usedCount: 0, maxLimit: 4 };
  }
}

export function incrementStudyBuddyUsage(): StudyBuddyDailyLimit {
  const current = getStudyBuddyDailyLimit();
  const updated: StudyBuddyDailyLimit = {
    ...current,
    usedCount: current.usedCount + 1,
  };
  try {
    localStorage.setItem(KEYS.STUDYBUDDY_LIMIT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update studybuddy usage', e);
  }
  return updated;
}

// StudyBuddy Messages
export function getStoredStudyBuddyMessages(): StudyBuddyMessage[] {
  try {
    const raw = localStorage.getItem(KEYS.STUDYBUDDY_MESSAGES);
    if (!raw) {
      const welcome: StudyBuddyMessage = {
        id: 'msg-welcome-01',
        sender: 'assistant',
        text: "Hello! I'm your StudyBuddy AI tutor. I'm here to help you understand school and university concepts, explain homework or past questions, break down difficult topics, or clarify notes. How can I help you excel today?",
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(KEYS.STUDYBUDDY_MESSAGES, JSON.stringify([welcome]));
      return [welcome];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredStudyBuddyMessages(msgs: StudyBuddyMessage[]): void {
  try {
    localStorage.setItem(KEYS.STUDYBUDDY_MESSAGES, JSON.stringify(msgs));
  } catch (e) {
    console.error('Failed to save studybuddy messages', e);
  }
}

// Exam Readiness Calculator
export function calculateExamReadiness(
  customNotes?: StudyNote[],
  customQuizResults?: QuizResult[],
  customMistakes?: MistakeItem[]
): ExamReadinessScore {
  const quizResults = customQuizResults || getStoredQuizResults();
  const mistakes = customMistakes || getStoredMistakes();
  const notes = customNotes || getStoredNotes();

  const baseSubjectMastery: Record<string, number> = {
    Mathematics: 82,
    English: 88,
    Biology: 76,
    Chemistry: 71,
    Physics: 68,
  };

  // If quiz results exist, refine subject mastery
  if (quizResults.length > 0) {
    quizResults.forEach((q) => {
      if (q.subject) {
        if (!baseSubjectMastery[q.subject]) {
          baseSubjectMastery[q.subject] = q.percentage;
        } else {
          baseSubjectMastery[q.subject] = Math.round((baseSubjectMastery[q.subject] + q.percentage) / 2);
        }
      }
    });
  }

  // If new user with no attempts yet
  if (quizResults.length === 0) {
    return {
      overallPercentage: 74,
      explanation: 'Based on your pre-loaded curriculum diagnostic and note reviews. Complete more practice sets to increase measurement precision.',
      strongTopics: ['Plant Physiology', 'Quadratic Equations'],
      weakTopics: ['Current Electricity', 'Acids, Bases & Salts', 'Grammatical Concord'],
      recommendedAction: 'Solve a 10-question practice set on Current Electricity to strengthen weak concepts.',
      breakdown: {
        practiceAccuracy: 78,
        mockExamScore: 70,
        topicCoverage: 65,
        mistakeClearance: 60,
      },
      subjectMastery: baseSubjectMastery,
    };
  }

  // Calculate real average
  const totalScore = quizResults.reduce((acc, r) => acc + r.percentage, 0);
  const avgAccuracy = Math.round(totalScore / quizResults.length);
  const unresolvedMistakes = mistakes.filter((m) => !m.resolved).length;
  const mistakeClearance = Math.max(20, Math.min(100, Math.round(100 - unresolvedMistakes * 8)));
  const topicCoverage = Math.min(100, Math.round((notes.length * 20 + quizResults.length * 15)));

  const overall = Math.round(avgAccuracy * 0.5 + mistakeClearance * 0.25 + topicCoverage * 0.25);
  const clampedOverall = Math.max(15, Math.min(98, overall));

  // Extract weak topics
  const allWeakTopics: string[] = [];
  const allStrongTopics: string[] = [];
  quizResults.forEach((r) => {
    if (r.weakTopics) allWeakTopics.push(...r.weakTopics);
    if (r.strongTopics) allStrongTopics.push(...r.strongTopics);
  });
  mistakes.forEach((m) => {
    if (!m.resolved && m.topic) allWeakTopics.push(m.topic);
  });

  const uniqueWeak = Array.from(new Set(allWeakTopics)).slice(0, 3);
  const uniqueStrong = Array.from(new Set(allStrongTopics)).slice(0, 3);

  let explanation = `You're demonstrating solid grasp across core subjects.`;
  if (clampedOverall >= 85) {
    explanation = `Outstanding performance! You are consistently demonstrating high accuracy across both past questions and mock drills.`;
  } else if (clampedOverall >= 70) {
    explanation = `Good steady progress. You have strong foundation in several core areas, with specific topics requiring targeted review.`;
  } else {
    explanation = `Developing foundational mastery. Focusing on your Mistake Bank and targeted 5-10 question practice sets will rapidly boost your score.`;
  }

  const topWeak = uniqueWeak[0] || 'your unresolved mistakes';
  const recommendedAction = `Practice 10 targeted questions on ${topWeak} to close knowledge gaps.`;

  return {
    overallPercentage: clampedOverall,
    explanation,
    strongTopics: uniqueStrong.length > 0 ? uniqueStrong : ['Basic Science', 'Plant Nutrition'],
    weakTopics: uniqueWeak.length > 0 ? uniqueWeak : ['Current Electricity', 'Organic Chemistry'],
    recommendedAction,
    breakdown: {
      practiceAccuracy: avgAccuracy,
      mockExamScore: Math.min(100, avgAccuracy - 4),
      topicCoverage,
      mistakeClearance,
    },
    subjectMastery: baseSubjectMastery,
  };
}
