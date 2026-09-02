import React from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  Zap,
  Flame,
  Calendar,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  StudentProfile,
  ExamReadinessScore,
  QuizResult,
  MistakeItem,
  StudyNote,
} from '../../types';

interface ProgressDashboardProps {
  profile: StudentProfile;
  readiness: ExamReadinessScore;
  quizHistory: QuizResult[];
  mistakes: MistakeItem[];
  notes: StudyNote[];
  onNavigateToStudy: () => void;
  onNavigateToExamPrep: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  profile,
  readiness,
  quizHistory,
  mistakes,
  notes,
  onNavigateToStudy,
  onNavigateToExamPrep,
}) => {
  const totalQuestionsAnswered = quizHistory.reduce((acc, q) => acc + q.totalQuestions, 0);
  const totalCorrect = quizHistory.reduce((acc, q) => acc + q.score, 0);
  const averageAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;

  const totalFlashcards = notes.reduce((acc, n) => acc + (n.resources?.flashcards?.length || 0), 0);
  const resolvedMistakesCount = mistakes.filter((m) => m.resolved).length;
  const unresolvedMistakesCount = mistakes.filter((m) => !m.resolved).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
              Analytics & Performance
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Study Metrics & Exam Readiness
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Learning Progress & Readiness Score
          </h1>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>{profile.studyStreakDays} Day Study Streak</span>
        </div>
      </div>

      {/* OVERALL READINESS SCORE CARD (Bento Primary) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
                Comprehensive Evaluation
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
                Overall Exam Readiness: {readiness.overallPercentage}%
              </h2>
              <p className="text-xs text-blue-100/90 max-w-lg font-medium">
                Calculated across note summaries reviewed, active recall flashcard accuracy, past question CBT sessions, and mistake resolution rate.
              </p>
            </div>

            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center p-3 text-center flex-shrink-0">
              <span className="text-3xl font-black text-emerald-300">{readiness.overallPercentage}%</span>
              <span className="text-[10px] font-bold uppercase text-slate-300">Ready</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15">
            <div>
              <span className="text-[10px] font-semibold text-blue-200 uppercase">Questions Attempted</span>
              <p className="text-lg font-black text-white">{totalQuestionsAnswered}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-blue-200 uppercase">Average Accuracy</span>
              <p className="text-lg font-black text-emerald-300">{averageAccuracy}%</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-blue-200 uppercase">Notes Processed</span>
              <p className="text-lg font-black text-white">{notes.length}</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-blue-200 uppercase">Mistakes Resolved</span>
              <p className="text-lg font-black text-amber-300">{resolvedMistakesCount}/{mistakes.length}</p>
            </div>
          </div>
        </div>

        {/* Action Callout (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Target Improvement Area</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Resolve your <span className="font-bold text-slate-900">{unresolvedMistakesCount} unresolved mistake concepts</span> in the Mistake Bank to boost your exam readiness score.
            </p>
          </div>

          <div className="space-y-2">
            <button
              id="analytics-study-notes-btn"
              onClick={onNavigateToStudy}
              className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors text-center"
            >
              Review Study Notes ({notes.length})
            </button>
            <button
              id="analytics-examprep-btn"
              onClick={onNavigateToExamPrep}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors text-center shadow-xs"
            >
              Practice Past Questions
            </button>
          </div>
        </div>
      </div>

      {/* SUBJECT MASTERY BREAKDOWN */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          Subject Mastery Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(readiness.subjectMastery || {}).map(([subject, val]) => {
            const mastery = typeof val === 'number' ? val : Number(val) || 0;
            return (
              <div
                key={subject}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{subject}</span>
                  <span className="text-xs font-black text-blue-700">{mastery}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${mastery >= 75 ? 'bg-emerald-500' : mastery >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${mastery}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-500">
                  {mastery >= 75
                    ? 'Strong mastery demonstrated across practice sets.'
                    : 'Recommended for targeted practice drills.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUIZ & MOCK EXAM ACTIVITY LOGS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">
          Recent Assessment & Practice History
        </h3>

        {quizHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No quiz or exam history recorded yet. Complete a study quiz or past question session to see your logs.
          </div>
        ) : (
          <div className="space-y-3">
            {quizHistory.slice(0, 10).map((hist) => (
              <div
                key={hist.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {hist.subject}
                    </span>
                    <span className="font-bold text-slate-900">{hist.title}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    {new Date(hist.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • Topic: {hist.topic}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-black text-sm text-slate-900">
                      {hist.score} / {hist.totalQuestions}
                    </span>
                    <span className={`block text-[11px] font-bold ${hist.percentage >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {hist.percentage}% Accuracy
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
