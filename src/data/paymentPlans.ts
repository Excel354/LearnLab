import { PaymentPlan } from '../types';

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    tagline: 'Essential tools for daily review and homework support',
    prices: {
      monthly: 0,
      termly: 0,
      annual: 0,
    },
    features: [
      '4 StudyBuddy AI replies per day',
      'Up to 3 AI note summaries daily',
      'Standard practice quizzes & flashcards',
      'Daily login streak tracker',
      'Basic exam countdowns',
      'Standard mobile and web access',
    ],
    recommendedFor: 'Casual homework help & quick review',
  },
  {
    id: 'pro',
    name: 'LearnLab Pro',
    badge: 'MOST POPULAR',
    tagline: 'Complete exam prep power for Primary, JSS & SSS / WAEC / JAMB candidates',
    popular: true,
    prices: {
      monthly: 3500,
      termly: 8500,
      annual: 28000,
    },
    features: [
      'Unlimited StudyBuddy AI Tutor (Zero daily limits)',
      'Unlimited AI Note Summaries & Textbook Scanner',
      'Full WAEC, JAMB CBT & BECE Exam Simulator',
      'Instant AI explanations for all question options',
      'Active Recall & Spaced Repetition Flashcards',
      'Automated Mistake Bank & Weak-Area Recovery',
      'Downloadable Offline Revision Packs & Cheat Sheets',
      'Audio Explanations & Natural Voice Tutor',
      'Priority AI server speed & zero waiting queue',
    ],
    recommendedFor: 'WAEC, JAMB, NECO, BECE candidates and ambitious students',
  },
  {
    id: 'campus',
    name: 'Campus Scholar',
    badge: 'FOR HIGHER ED',
    tagline: 'Advanced syllabus mastery for Polytechnic and University students',
    prices: {
      monthly: 5000,
      termly: 12000,
      annual: 36000,
    },
    features: [
      'Everything included in LearnLab Pro',
      'Nigerian & Global University GST and Degree syllabus',
      'Complex derivations, proofs & formula step solver',
      'Lecture slides, PDF handouts & audio note processing',
      'Comprehensive semester & departmental course planner',
      'Past university exam question breakdown generator',
      'Export study guides to formatted Word/PDF',
      'Direct priority student support',
    ],
    recommendedFor: '100L – 500L university & polytechnic undergraduates',
  },
];
