import React from 'react';
import {
  BookOpen,
  Zap,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Flame,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Award,
} from 'lucide-react';
import { StudentProfile, StudyNote, MistakeItem, StudyPlannerTask, ExamReadinessScore, ExamCountdownItem } from '../types';
import { formatMathPowerText } from '../utils/mathFormat';

interface HomeDashboardProps {
  profile: StudentProfile;
  notes: StudyNote[];
  mistakes: MistakeItem[];
  tasks: StudyPlannerTask[];
  countdowns: ExamCountdownItem[];
  readiness: ExamReadinessScore;
  onNavigate: (tab: string, subTab?: string) => void;
  onOpenStudyBuddy: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  profile,
  notes,
  mistakes,
  tasks,
  countdowns,
  readiness,
  onNavigate,
  onOpenStudyBuddy,
}) => {
  const unresolvedMistakesCount = mistakes.filter((m) => !m.resolved).length;
  const pendingTasks = tasks.filter((t) => !t.completed);

  // Compute nearest countdown
  const nearestCountdown = countdowns.length > 0 ? countdowns[0] : null;
  const daysRemaining = nearestCountdown
    ? Math.max(
        0,
        Math.ceil(
          (new Date(nearestCountdown.targetDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Greeting & Hero Banner with Sleek Interface Atmosphere */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 sm:p-10 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Ambient Glows */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Geometric Orbit Watermark */}
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none hidden sm:block">
          <svg width="180" height="180" viewBox="0 0 100 100" className="text-white">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
          </svg>
        </div>

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-bold px-2.5 py-1 bg-indigo-900/60 border border-indigo-400/30 rounded-md">
              {profile.grade} • {profile.country}
            </span>
            <span className="text-xs text-amber-300 font-bold flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-400/20 rounded-md">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {profile.studyStreakDays} {profile.studyStreakDays === 1 ? 'Day' : 'Days'} Streak
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Welcome back, {profile.name}.
          </h1>
          
          <p className="text-indigo-200 text-base sm:text-lg leading-relaxed font-normal">
            Ready to master your curriculum? Upload your lecture notes for instant AI summaries and flashcards, or take timed CBT exam drills.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('study')}
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Resume Study Notes</span>
            </button>
            <button
              onClick={() => onNavigate('examprep')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-xl font-semibold transition-all text-sm flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Practice Exams</span>
            </button>
          </div>
        </div>

        {/* Readiness Meter Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 sm:min-w-[190px] flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
              Exam Readiness
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black text-white">{readiness.overallPercentage}%</span>
            </div>
            <p className="text-[11px] text-indigo-200/80 mt-1">
              Across all syllabus modules
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <button
              id="view-readiness-details-btn"
              onClick={() => onNavigate('progress')}
              className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* THE TWO PRIMARY ACTIONS (Product Pillars) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Primary Study Modules
          </h2>
          <span className="text-xs font-semibold text-indigo-600">AI Powered Learning</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ACTION 1: Study My Notes */}
          <div
            id="action-study-notes-card"
            onClick={() => onNavigate('study')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-md text-slate-600">
                  {notes.length} Note{notes.length === 1 ? '' : 's'} Processed
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Study My Notes
                </h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  Upload PDF documents, school handouts, lecture photos, handwritten notes, or paste text. Turn them into instant AI summaries, active recall flashcards, and quizzes.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  AI Summarizer
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Active Recall Flashcards
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Diagnostic Quizzes
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Audio Mode
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
              <span>Open Note Summarizer</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ACTION 2: Prepare for an Exam */}
          <div
            id="action-prepare-exam-card"
            onClick={() => onNavigate('examprep')}
            className="group relative bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-md">
                  WAEC • JAMB • NECO • BECE • Uni
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Prepare for an Exam
                </h3>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  Practice with genuine past examination questions, timed CBT mock drills, AI practice generators, and targeted mistake remediation.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Official Past Questions
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Full CBT Mock Exams
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Mistake Bank ({unresolvedMistakesCount})
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Weak Area Drills
                </span>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-indigo-600 font-semibold text-sm group-hover:text-indigo-700">
              <span>Start Exam Preparation</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATUS & PERFORMANCE BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Exam Countdown Card */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Exam Countdown</h3>
                  <p className="text-xs text-slate-400">Target Milestones</p>
                </div>
              </div>
              <button
                id="view-all-countdowns-btn"
                onClick={() => onNavigate('examprep', 'countdown')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Manage
              </button>
            </div>

            {nearestCountdown ? (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {nearestCountdown.examName}
                  </span>
                  <span className="text-xl font-black text-indigo-600">
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Target Date: {new Date(nearestCountdown.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {nearestCountdown.notes && (
                  <p className="text-[11px] text-slate-600 mt-2 italic line-clamp-2">
                    "{nearestCountdown.notes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No upcoming exams scheduled.
              </div>
            )}
          </div>

          <button
            id="countdown-study-plan-btn"
            onClick={() => onNavigate('examprep', 'practice')}
            className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors text-center shadow-xs"
          >
            Practice Exam Topics
          </button>
        </div>

        {/* 2. Mistake Bank Quick Tracker */}
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Mistake Bank</h3>
                  <p className="text-xs text-slate-400">Targeted Remediation</p>
                </div>
              </div>
              <span className="text-xl font-black text-rose-600">
                {unresolvedMistakesCount}
              </span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              Questions answered incorrectly across quizzes and mock exams are saved here for mastery.
            </p>

            {unresolvedMistakesCount > 0 ? (
              <div className="mt-3 space-y-2">
                {mistakes
                  .filter((m) => !m.resolved)
                  .slice(0, 2)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <span className="font-bold text-slate-800 line-clamp-1">
                        {m.subject}: {m.topic}
                      </span>
                      <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {formatMathPowerText(m.question)}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Mistake bank is completely cleared!</span>
              </div>
            )}
          </div>

          <button
            id="review-mistakes-btn"
            onClick={() => onNavigate('examprep', 'mistakes')}
            className="mt-5 w-full py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors text-center"
          >
            Review Mistakes ({unresolvedMistakesCount})
          </button>
        </div>

        {/* 3. StudyBuddy AI Quick Prompt Card */}
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-600/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>StudyBuddy AI Tutor</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 bg-white/20 rounded text-white">
                24/7 Support
              </span>
            </div>

            <p className="text-indigo-100 text-xs leading-relaxed">
              Stuck on a tricky homework question or curriculum topic? Ask StudyBuddy AI for step-by-step guidance.
            </p>

            <div className="mt-4 p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/20 text-xs text-indigo-100 italic">
              "Help me understand how RuBisCO works in the Calvin cycle..."
            </div>
          </div>

          <button
            id="open-studybuddy-home-btn"
            onClick={onOpenStudyBuddy}
            className="mt-5 w-full py-2.5 rounded-xl bg-white text-indigo-600 hover:bg-slate-50 text-xs font-bold shadow-md transition-all text-center"
          >
            Ask StudyBuddy AI
          </button>
        </div>
      </div>
    </div>
  );
};
