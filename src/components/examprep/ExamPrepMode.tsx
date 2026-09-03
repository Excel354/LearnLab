import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Check,
  Award,
  UploadCloud,
  School,
  FileText,
  Trash2,
  HelpCircle,
  Paperclip,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  StudentProfile,
  QuizQuestion,
  QuizResult,
  MistakeItem,
  ExamDefinition,
  MockExamConfig,
  ExamCountdownItem,
  EducationLevel,
  ExamCategory,
} from '../../types';
import {
  NIGERIAN_EXAMS,
  SEED_PAST_QUESTIONS,
  SUBJECTS_BY_LEVEL,
  CLASSES_BY_LEVEL,
  SCHOOL_TERMS,
  SCHOOL_ASSESSMENT_TYPES,
  CURRICULUM_TOPICS_BY_LEVEL,
  createSchoolExamDefinition,
} from '../../data/curriculumData';
import { addMistakeItem, saveStoredQuizResult } from '../../utils/storage';

interface ExamPrepModeProps {
  profile: StudentProfile;
  mistakes: MistakeItem[];
  countdowns: ExamCountdownItem[];
  initialSubTab?: string;
  onSaveMistakes: (mistakes: MistakeItem[]) => void;
  onSaveCountdowns: (countdowns: ExamCountdownItem[]) => void;
  onQuizCompleted: (result: QuizResult) => void;
  onOpenStudyBuddy: (context?: string) => void;
}

export const ExamPrepMode: React.FC<ExamPrepModeProps> = ({
  profile,
  mistakes,
  countdowns,
  initialSubTab = 'practice',
  onSaveMistakes,
  onSaveCountdowns,
  onQuizCompleted,
  onOpenStudyBuddy,
}) => {
  const [subTab, setSubTab] = useState<'practice' | 'mock' | 'mistakes' | 'countdown' | 'school_exam'>(
    (initialSubTab as any) || 'practice'
  );

  // Category Switcher: 'school_exam' vs 'standardized_exam'
  const [examCategory, setExamCategory] = useState<ExamCategory>(
    (initialSubTab as string) === 'school_exam' || profile.educationLevel === 'primary'
      ? 'school_exam'
      : 'standardized_exam'
  );

  // School Exam State
  const [schoolLevel, setSchoolLevel] = useState<EducationLevel>(profile.educationLevel || 'senior_secondary');
  const [schoolClass, setSchoolClass] = useState<string>(
    profile.grade && profile.grade !== 'Primary 1-6'
      ? profile.grade
      : profile.educationLevel === 'primary'
      ? 'Primary 5'
      : profile.educationLevel === 'junior_secondary'
      ? 'JSS 2'
      : 'SS 2'
  );
  const [schoolTerm, setSchoolTerm] = useState<string>('First Term');
  const [schoolAssessmentType, setSchoolAssessmentType] = useState<string>(
    'School Examination (End of Term)'
  );
  const [customMaterialText, setCustomMaterialText] = useState<string>('');
  const [customMaterialFileName, setCustomMaterialFileName] = useState<string>('');
  const [isCustomMaterialExpanded, setIsCustomMaterialExpanded] = useState<boolean>(false);

  // Standardized Exam Selection Configuration State
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel>(profile.educationLevel || 'senior_secondary');
  const [selectedExamId, setSelectedExamId] = useState<string>(
    profile.educationLevel === 'junior_secondary'
      ? 'bece_junior_waec'
      : profile.educationLevel === 'primary'
      ? 'ncee_common_entrance'
      : 'jamb_utme'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('All Topics');
  const [practiceSource, setPracticeSource] = useState<'past_questions' | 'ai_practice'>('past_questions');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium'); // STRICT: Easy, Medium, Hard (NO mixed!)
  const [questionCount, setQuestionCount] = useState<number>(10); // 5, 10, 20, 30, 50, Custom

  // Active Exam Runner State
  const [isExamActive, setIsExamActive] = useState(false);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [isExamTimed, setIsExamTimed] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [examResult, setExamResult] = useState<QuizResult | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // New Countdown Form State
  const [newCountdownExam, setNewCountdownExam] = useState(profile.targetExams[0] || 'WAEC (WASSCE)');
  const [newCountdownDate, setNewCountdownDate] = useState('');
  const [newCountdownNotes, setNewCountdownNotes] = useState('');

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Exam Definition based on Category (School Exam vs Standardized Exam)
  const currentExamDef: ExamDefinition =
    examCategory === 'school_exam'
      ? createSchoolExamDefinition(
          schoolLevel,
          schoolClass,
          selectedSubject,
          schoolTerm,
          schoolAssessmentType
        )
      : NIGERIAN_EXAMS.find((e) => e.id === selectedExamId) || NIGERIAN_EXAMS[0];

  // Update class when schoolLevel changes
  const handleSchoolLevelChange = (lvl: EducationLevel) => {
    setSchoolLevel(lvl);
    const classes = CLASSES_BY_LEVEL[lvl] || [];
    if (classes.length > 0) {
      setSchoolClass(classes[0]);
    }
    const validSubjects = SUBJECTS_BY_LEVEL[lvl] || [];
    if (validSubjects.length > 0 && !validSubjects.includes(selectedSubject)) {
      setSelectedSubject(validSubjects[0]);
    }
  };

  // Synchronize subjects when category or exam changes
  useEffect(() => {
    if (examCategory === 'school_exam') {
      const validSubjects = SUBJECTS_BY_LEVEL[schoolLevel] || [];
      if (validSubjects.length > 0 && !validSubjects.includes(selectedSubject)) {
        setSelectedSubject(validSubjects[0]);
      }
    } else {
      if (currentExamDef && currentExamDef.subjects.length > 0) {
        if (!currentExamDef.subjects.includes(selectedSubject)) {
          setSelectedSubject(currentExamDef.subjects[0]);
        }
      }
    }
    setSelectedTopic('All Topics');
  }, [examCategory, schoolLevel, selectedExamId]);

  // Handle Material File Upload (Scheme of work, teacher notes, physical test photo/doc)
  const handleMaterialFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCustomMaterialFileName(file.name);
    setIsCustomMaterialExpanded(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCustomMaterialText(text || '');
    };
    reader.onerror = () => {
      setGenerationError('Unable to read the uploaded file. Please paste your text notes directly.');
    };
    reader.readAsText(file);
  };

  // Exam Timer Countdown Handler
  useEffect(() => {
    if (isExamActive && isExamTimed && timeRemainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamActive, isExamTimed, timeRemainingSeconds]);

  // Start Practice or Mock Exam
  const handleStartExam = async (mode: 'practice' | 'mock') => {
    setGenerationError(null);
    setIsGeneratingAI(true);

    try {
      let questions: QuizQuestion[] = [];

      const isSchoolExam = examCategory === 'school_exam';
      const effectiveLevel = isSchoolExam ? schoolLevel : selectedLevel;

      if (practiceSource === 'past_questions' && mode === 'practice') {
        // Filter from curated Past Question repository
        const filtered = SEED_PAST_QUESTIONS.filter((q) => {
          const matchSubject =
            !selectedSubject ||
            q.subject?.toLowerCase().includes(selectedSubject.toLowerCase());
          const matchYear = selectedYear === 'all' || q.year === selectedYear;
          const matchExamOrClass = isSchoolExam
            ? q.classLevel === schoolClass || q.educationLevel === schoolLevel
            : q.examId === selectedExamId;
          return matchSubject && matchYear && matchExamOrClass;
        });

        if (filtered.length >= 3) {
          questions = [...filtered];
        } else {
          // If fewer questions in seed, augment with high-yield questions for that specific exam or school class
          const res = await fetch('/api/ai/generate-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: examCategory,
              examName: currentExamDef.shortName,
              subject: selectedSubject,
              topic: selectedTopic === 'All Topics' ? '' : selectedTopic,
              difficulty: difficulty,
              count: questionCount,
              educationLevel: effectiveLevel,
              classLevel: isSchoolExam ? schoolClass : undefined,
              term: isSchoolExam ? schoolTerm : undefined,
              assessmentType: isSchoolExam ? schoolAssessmentType : undefined,
              materialText: isSchoolExam && customMaterialText.trim() ? customMaterialText : undefined,
            }),
          });
          const data = await res.json();
          if (data.success && data.questions) {
            questions = [...filtered, ...data.questions];
          }
        }
      } else {
        // Generate targeted AI Questions for specific topic, school class, or uploaded scheme of work
        const res = await fetch('/api/ai/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: examCategory,
            examName: currentExamDef.shortName,
            subject: selectedSubject,
            topic: selectedTopic === 'All Topics' ? '' : selectedTopic,
            difficulty: difficulty,
            count: questionCount,
            educationLevel: effectiveLevel,
            classLevel: isSchoolExam ? schoolClass : undefined,
            term: isSchoolExam ? schoolTerm : undefined,
            assessmentType: isSchoolExam ? schoolAssessmentType : undefined,
            materialText: isSchoolExam && customMaterialText.trim() ? customMaterialText : undefined,
          }),
        });
        const data = await res.json();
        if (data.success && data.questions) {
          questions = data.questions;
        } else {
          throw new Error(data.error || 'Could not load practice questions.');
        }
      }

      // Ensure proper labels and metadata
      const finalQuestions = questions.slice(0, questionCount).map((q, idx) => ({
        ...q,
        id: q.id || `q-${Date.now()}-${idx}`,
        sourceType: q.sourceType || (practiceSource === 'past_questions' ? 'past_question' : 'ai_generated'),
        sourceLabel:
          q.sourceLabel ||
          (q.sourceType === 'past_question'
            ? `📜 Past Question (${isSchoolExam ? schoolClass : currentExamDef.shortName})`
            : `🤖 AI Practice Question (${isSchoolExam ? `${schoolClass} • ${schoolTerm}` : currentExamDef.shortName})`),
        classLevel: isSchoolExam ? schoolClass : undefined,
      }));

      if (finalQuestions.length === 0) {
        throw new Error('No questions available for this combination. Please adjust topic or year.');
      }

      setCurrentQuestions(finalQuestions);
      setUserAnswers({});
      setFlaggedQuestions({});
      setCurrentQuestionIndex(0);
      setExamResult(null);

      const timed = mode === 'mock' || currentExamDef.timedByDefault;
      setIsExamTimed(timed);
      if (timed) {
        const minutes = currentExamDef.defaultTimeMinutes || (isSchoolExam ? (schoolLevel === 'primary' ? 25 : 40) : 30);
        setTimeRemainingSeconds(minutes * 60);
      } else {
        setTimeRemainingSeconds(0);
      }

      setIsExamActive(true);
    } catch (err: any) {
      console.error('Failed to start exam:', err);
      setGenerationError(err.message || 'Error generating questions. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Submit Exam & Compile Detailed Results
  const handleFinishExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowSubmitModal(false);

    let score = 0;
    const answersDetailed: any[] = [];
    const weakTopicsSet = new Set<string>();
    const strongTopicsSet = new Set<string>();

    currentQuestions.forEach((q) => {
      const selectedIdx = userAnswers[q.id];
      const isCorrect = selectedIdx === q.correctOptionIndex;
      const selectedText = selectedIdx !== undefined ? q.options[selectedIdx] : 'Unanswered';

      if (isCorrect) {
        score += 1;
        strongTopicsSet.add(q.topic);
      } else {
        weakTopicsSet.add(q.topic);
        // Automatically add wrong questions into Mistake Bank (Section 29/34)
        addMistakeItem({
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userWrongAnswer: selectedText,
          explanation: q.explanation,
          subject: selectedSubject,
          topic: q.topic,
          examName: q.examName || currentExamDef.shortName,
          year: q.year,
          sourceType: q.sourceType,
        });
      }

      answersDetailed.push({
        questionId: q.id,
        question: q.question,
        selectedAnswer: selectedText,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
      });
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);

    const result: QuizResult = {
      id: `exam-res-${Date.now()}`,
      examId: selectedExamId,
      subject: selectedSubject,
      topic: selectedTopic || 'Curriculum Practice',
      title: `${currentExamDef.shortName} ${selectedSubject} Practice Session`,
      date: new Date().toISOString(),
      totalQuestions: currentQuestions.length,
      score,
      percentage,
      timeSpentSeconds: isExamTimed ? (currentExamDef.defaultTimeMinutes || 30) * 60 - timeRemainingSeconds : 0,
      answers: answersDetailed,
      weakTopics: Array.from(weakTopicsSet),
      strongTopics: Array.from(strongTopicsSet),
      recommendedNextSteps:
        weakTopicsSet.size > 0
          ? [
              `Target ${Array.from(weakTopicsSet)[0]} in your Mistake Bank`,
              `Ask StudyBuddy AI to explain difficult concepts`,
            ]
          : ['Excellent performance! Proceed to higher difficulty or next subject.'],
    };

    setExamResult(result);
    setIsExamActive(false);
    saveStoredQuizResult(result);
    onQuizCompleted(result);

    // Refresh mistakes list
    onSaveMistakes([...mistakes]);

    // Trigger celebration if scored above 70%
    if (percentage >= 70) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Add countdown
  const handleAddCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountdownExam || !newCountdownDate) return;
    const newItem: ExamCountdownItem = {
      id: `cd-${Date.now()}`,
      examName: newCountdownExam,
      targetDate: newCountdownDate,
      notes: newCountdownNotes,
    };
    const updated = [newItem, ...countdowns];
    onSaveCountdowns(updated);
    setNewCountdownNotes('');
    setNewCountdownDate('');
  };

  // Remove countdown
  const handleRemoveCountdown = (id: string) => {
    const updated = countdowns.filter((c) => c.id !== id);
    onSaveCountdowns(updated);
  };

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const unansweredCount = currentQuestions.filter((q) => userAnswers[q.id] === undefined).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* EXAM RUNNER SCREEN (ACTIVE EXAM) */}
      {isExamActive && currentQuestions.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in duration-150">
          {/* Top Bar: Timer, Question Counter, Flag & Submit */}
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/30 text-blue-200 text-xs font-bold uppercase">
                {currentExamDef.shortName}
              </span>
              <span className="text-sm font-bold text-slate-200">
                {selectedSubject}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* CBT Timer */}
              {isExamTimed && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold ${timeRemainingSeconds < 300 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-white/10 text-emerald-300 border border-white/15'}`}>
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeRemainingSeconds)}</span>
                </div>
              )}

              {/* Flag Question for Review */}
              <button
                id="flag-question-btn"
                onClick={() => {
                  const currentQ = currentQuestions[currentQuestionIndex];
                  setFlaggedQuestions({
                    ...flaggedQuestions,
                    [currentQ.id]: !flaggedQuestions[currentQ.id],
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  flaggedQuestions[currentQuestions[currentQuestionIndex]?.id]
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flaggedQuestions[currentQuestions[currentQuestionIndex]?.id] ? 'Flagged' : 'Mark for Review'}
                </span>
              </button>

              {/* Submit Button */}
              <button
                id="exam-finish-modal-trigger-btn"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                Submit Exam
              </button>
            </div>
          </div>

          {/* Question Body + Question Navigator Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
            {/* Main Question Display (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Question metadata label (Official Past Question vs AI Practice) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">
                    Question {currentQuestionIndex + 1} of {currentQuestions.length}
                  </span>
                  {/* Distinct source label */}
                  {currentQuestions[currentQuestionIndex]?.sourceType === 'past_question' ? (
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-[10px] border border-blue-200">
                      📜 Past Question ({currentQuestions[currentQuestionIndex]?.sourceLabel || 'Official'})
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-900 font-bold text-[10px] border border-purple-200">
                      🤖 AI Practice Question
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-semibold text-slate-500">
                  Topic: {currentQuestions[currentQuestionIndex]?.topic}
                </span>
              </div>

              {/* Question Text */}
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 text-slate-900 text-base sm:text-lg font-bold leading-relaxed">
                {currentQuestions[currentQuestionIndex]?.question}
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestions[currentQuestionIndex]?.options.map((opt, optIdx) => {
                  const currentQId = currentQuestions[currentQuestionIndex]?.id;
                  const isSelected = userAnswers[currentQId] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      id={`option-btn-${optIdx}`}
                      onClick={() =>
                        setUserAnswers({
                          ...userAnswers,
                          [currentQId]: optIdx,
                        })
                      }
                      className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/90 text-blue-950 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt}</span>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav Prev/Next Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  id="prev-exam-q-btn"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((idx) => Math.max(0, idx - 1))}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold ${
                    currentQuestionIndex === 0
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  id="next-exam-q-btn"
                  onClick={() => {
                    if (currentQuestionIndex < currentQuestions.length - 1) {
                      setCurrentQuestionIndex((idx) => idx + 1);
                    } else {
                      setShowSubmitModal(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  <span>{currentQuestionIndex === currentQuestions.length - 1 ? 'Review & Submit' : 'Next Question'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Navigator Grid (4 cols) */}
            <div className="lg:col-span-4 bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Question Navigator
              </h4>

              <div className="grid grid-cols-5 gap-2">
                {currentQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions[q.id];
                  const isCurrent = idx === currentQuestionIndex;

                  let styleClass = 'bg-white text-slate-700 border-slate-200';
                  if (isCurrent) styleClass = 'ring-2 ring-blue-600 font-black';
                  if (isAnswered) styleClass = 'bg-blue-600 text-white border-blue-600';
                  if (isFlagged) styleClass = 'bg-amber-400 text-slate-900 border-amber-500';

                  return (
                    <button
                      key={q.id}
                      id={`nav-q-idx-${idx}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-10 rounded-xl text-xs font-bold border transition-all flex items-center justify-center ${styleClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] font-semibold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                  <span>Answered ({Object.keys(userAnswers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                  <span>Unanswered ({unansweredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <span>Marked for Review ({Object.values(flaggedQuestions).filter(Boolean).length})</span>
                </div>
              </div>
            </div>
          </div>

          {/* SUBMISSION PROTECTION MODAL (Section 33) */}
          {showSubmitModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Submit Exam & View Results?
                  </h3>
                  {unansweredCount > 0 ? (
                    <p className="text-xs text-amber-800 mt-1 font-medium bg-amber-50 p-3 rounded-xl border border-amber-200">
                      ⚠️ You still have <span className="font-bold">{unansweredCount} unanswered questions</span>. Are you sure you want to submit now?
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 mt-1">
                      All questions have been answered. You will receive comprehensive explanations and score breakdown.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    id="return-to-exam-btn"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                  >
                    Return to Exam
                  </button>
                  <button
                    id="confirm-submit-exam-btn"
                    onClick={handleFinishExam}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                  >
                    Confirm Submission
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : examResult ? (
        /* COMPREHENSIVE RESULTS VIEW (Section 34) */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
          {/* Top Score Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <span className="px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase">
                {examResult.title}
              </span>
              <h2 className="text-3xl font-black text-white mt-2">
                Score: {examResult.score} / {examResult.totalQuestions} ({examResult.percentage}%)
              </h2>
              <p className="text-xs text-blue-100 max-w-md">
                {examResult.percentage >= 70
                  ? 'Excellent work! You are demonstrating solid exam readiness.'
                  : 'Good practice effort! Incorrect questions have been automatically added to your Mistake Bank.'}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 min-w-[140px]">
              <span className="text-3xl font-black text-emerald-300">{examResult.percentage}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-300">Accuracy</span>
            </div>
          </div>

          {/* Weak Areas & Mistake Bank Notice */}
          {examResult.weakTopics.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <p className="font-bold">
                  Weak Topics Saved to Mistake Bank:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {examResult.weakTopics.map((wt, i) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-amber-200/80 font-bold text-amber-950">
                      {wt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Question-by-Question Review with Explanations */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Question Review & Deep Explanations
            </h3>

            {examResult.answers.map((ans, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border space-y-3 ${
                  ans.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {idx + 1}. {ans.question}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                      ans.isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {ans.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <p>
                    <span className="font-semibold text-slate-500">Your Selection: </span>
                    <span className={ans.isCorrect ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {ans.selectedAnswer}
                    </span>
                  </p>
                  {!ans.isCorrect && (
                    <p>
                      <span className="font-semibold text-slate-500">Correct Answer: </span>
                      <span className="text-emerald-700 font-bold">{ans.correctAnswer}</span>
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs text-slate-600">
                  <span className="font-bold text-slate-900">Teaching Explanation: </span>
                  <span>{ans.explanation}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              id="back-to-examprep-home-btn"
              onClick={() => setExamResult(null)}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              ← Back to Exam Configuration
            </button>

            <button
              id="practice-mistakes-now-btn"
              onClick={() => {
                setExamResult(null);
                setSubTab('mistakes');
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs"
            >
              Open Mistake Bank ({mistakes.filter((m) => !m.resolved).length})
            </button>
          </div>
        </div>
      ) : (
        /* MAIN EXAM PREP DASHBOARD (Selector, Practice, Mocks, Mistake Bank, Countdowns) */
        <div className="space-y-6">
          {/* Sub-Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
                  ExamPrep AI
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Past Questions, AI Drills, Mock CBT & Mistake Bank
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
                Targeted Examination Preparation
              </h1>
            </div>

            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { id: 'practice', label: 'Practice Questions' },
                { id: 'mock', label: 'CBT Mock Exam' },
                { id: 'mistakes', label: `Mistake Bank (${mistakes.filter((m) => !m.resolved).length})` },
                { id: 'countdown', label: 'Countdown & Milestones' },
                { id: 'school_exam', label: 'School Specific Prep' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`examprep-subtab-${tab.id}`}
                  onClick={() => setSubTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    subTab === tab.id
                      ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* SUB-VIEW 1 & 2: Practice & Mock Exam Configuration */}
          {(subTab === 'practice' || subTab === 'mock') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Configuration Controls Form (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-900">
                    {subTab === 'mock' ? '⏱️ Configure CBT Mock Examination' : '🎯 Configure Topic Practice Session'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your examination, subject, difficulty, and question source.
                  </p>
                </div>

                {generationError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {generationError}
                  </div>
                )}

                {/* Category Switcher: School Exams vs Standardized National Exams */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Examination Category
                  </label>
                  <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-col sm:flex-row gap-1.5 border border-slate-200/80">
                    <button
                      id="category-school-exam-btn"
                      type="button"
                      onClick={() => setExamCategory('school_exam')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        examCategory === 'school_exam'
                          ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <School className="w-4 h-4 text-emerald-600" />
                      <span>School Examinations (Primary & Secondary)</span>
                    </button>
                    <button
                      id="category-standardized-exam-btn"
                      type="button"
                      onClick={() => setExamCategory('standardized_exam')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        examCategory === 'standardized_exam'
                          ? 'bg-white text-blue-800 shadow-xs ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <span>Standardized National Exams (JAMB, WAEC, NECO)</span>
                    </button>
                  </div>
                </div>

                {/* SCHOOL EXAM CONFIGURATION */}
                {examCategory === 'school_exam' ? (
                  <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <School className="w-4 h-4 text-emerald-700" />
                        <span>Academic Level & Class Selection</span>
                      </h4>
                      <span className="text-[11px] font-semibold text-emerald-800">
                        Nigerian Curriculum Aligned
                      </span>
                    </div>

                    {/* Academic Level Tabs */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'primary', label: 'Primary (1-6)' },
                        { id: 'junior_secondary', label: 'Junior Sec (JSS)' },
                        { id: 'senior_secondary', label: 'Senior Sec (SS)' },
                        { id: 'university', label: 'University' },
                      ].map((lvl) => (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => handleSchoolLevelChange(lvl.id as EducationLevel)}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center border ${
                            schoolLevel === lvl.id
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>

                    {/* Class Selection Pills */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                        Select Class / Grade
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(CLASSES_BY_LEVEL[schoolLevel] || []).map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSchoolClass(cls)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              schoolClass === cls
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* School Term & Assessment Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          School Term
                        </label>
                        <select
                          id="school-term-select"
                          value={schoolTerm}
                          onChange={(e) => setSchoolTerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {SCHOOL_TERMS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Assessment Type
                        </label>
                        <select
                          id="school-assessment-type-select"
                          value={schoolAssessmentType}
                          onChange={(e) => setSchoolAssessmentType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {SCHOOL_ASSESSMENT_TYPES.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Subject & Topic for School Exam */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Subject
                        </label>
                        <select
                          id="school-subject-select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {(SUBJECTS_BY_LEVEL[schoolLevel] || []).map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          Curriculum Topic
                        </label>
                        <select
                          id="school-topic-select"
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          <option value="All Topics">All Term Topics (Comprehensive)</option>
                          {(CURRICULUM_TOPICS_BY_LEVEL[schoolClass]?.[selectedSubject] || []).map(
                            (top) => (
                              <option key={top} value={top}>
                                {top}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Custom Material / Scheme of Work Upload & Text Grounding */}
                    <div className="pt-2 border-t border-emerald-200/60">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setIsCustomMaterialExpanded(!isCustomMaterialExpanded)}
                          className="text-xs font-bold text-emerald-900 hover:text-emerald-700 flex items-center gap-1.5"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {isCustomMaterialExpanded ? 'Hide' : 'Add'} Teacher Notes or Scheme of Work (Optional Grounding)
                          </span>
                        </button>
                        {customMaterialText.trim() && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                            {customMaterialFileName ? customMaterialFileName : `${customMaterialText.length} chars grounded`}
                          </span>
                        )}
                      </div>

                      {isCustomMaterialExpanded && (
                        <div className="mt-2.5 p-3.5 rounded-xl bg-white border border-emerald-200 space-y-2.5">
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            Upload your school's scheme of work, teacher notes, or paste questions from previous term tests. LearnLab AI will tailor questions directly to your school's syllabus.
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer hover:bg-emerald-100 transition-colors flex items-center gap-1.5">
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>Upload Document / Notes</span>
                              <input
                                type="file"
                                accept=".txt,.doc,.docx,.pdf"
                                onChange={handleMaterialFileUpload}
                                className="hidden"
                              />
                            </label>

                            {customMaterialFileName && (
                              <span className="text-xs text-slate-600 font-medium truncate max-w-xs">
                                📎 {customMaterialFileName}
                              </span>
                            )}

                            {customMaterialText && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomMaterialText('');
                                  setCustomMaterialFileName('');
                                }}
                                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 ml-auto font-semibold"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Clear</span>
                              </button>
                            )}
                          </div>

                          <textarea
                            value={customMaterialText}
                            onChange={(e) => setCustomMaterialText(e.target.value)}
                            placeholder="Or paste teacher notes, textbook extracts, or test questions here..."
                            rows={3}
                            className="w-full p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* STANDARDIZED NATIONAL EXAM CONFIGURATION */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Target Standardized Examination
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {NIGERIAN_EXAMS.map((exam) => {
                          const isSelected = exam.id === selectedExamId;
                          return (
                            <button
                              key={exam.id}
                              id={`exam-select-${exam.id}`}
                              onClick={() => setSelectedExamId(exam.id)}
                              className={`p-3.5 rounded-2xl border text-left transition-all ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500/20 shadow-xs'
                                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {exam.shortName}
                              </span>
                              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {exam.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subject & Year Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Subject
                        </label>
                        <select
                          id="exam-subject-select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-blue-500 outline-hidden"
                        >
                          {currentExamDef.subjects.map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Year Filter (for Past Questions)
                        </label>
                        <select
                          id="exam-year-select"
                          value={selectedYear}
                          onChange={(e) =>
                            setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-blue-500 outline-hidden"
                        >
                          <option value="all">All Available Years</option>
                          {currentExamDef.years.map((y) => (
                            <option key={y} value={y}>
                              {y} Past Questions
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Question Source (Past Questions vs AI Practice) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Question Source
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="source-past-questions-btn"
                      onClick={() => setPracticeSource('past_questions')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        practiceSource === 'past_questions'
                          ? 'border-blue-600 bg-blue-50/80 ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-blue-900 block">
                        📜 Official Past Questions
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Real examination questions with full solutions
                      </span>
                    </button>

                    <button
                      id="source-ai-practice-btn"
                      onClick={() => setPracticeSource('ai_practice')}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        practiceSource === 'ai_practice'
                          ? 'border-purple-600 bg-purple-50/80 ring-1 ring-purple-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-purple-900 block">
                        🤖 AI Practice Questions
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Curriculum-aligned generated diagnostic questions
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4. Practice Configuration: Difficulty (Easy/Med/Hard) & Count (5/10/20/30/50) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Difficulty Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'medium', 'hard'] as const).map((diff) => (
                        <button
                          key={diff}
                          id={`diff-btn-${diff}`}
                          type="button"
                          onClick={() => setDifficulty(diff)}
                          className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                            difficulty === diff
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Number of Questions
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[5, 10, 20, 30, 50].map((num) => (
                        <button
                          key={num}
                          id={`count-btn-${num}`}
                          type="button"
                          onClick={() => setQuestionCount(num)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                            questionCount === num
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Launch Button */}
                <button
                  id="launch-exam-btn"
                  disabled={isGeneratingAI}
                  onClick={() => handleStartExam(subTab === 'mock' ? 'mock' : 'practice')}
                  className={`w-full py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                    isGeneratingAI
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {isGeneratingAI ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading Examination Questions...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        {subTab === 'mock'
                          ? `Start Timed Mock Exam (${currentExamDef.defaultTimeMinutes || 30} mins)`
                          : `Start Practice Session (${questionCount} Questions)`}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Sidebar Info: Personalized Recommendations (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-3xl p-6 text-white shadow-md space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <h4 className="text-sm font-bold">Personalized Recommendation</h4>
                  </div>
                  <p className="text-xs text-blue-100/90 leading-relaxed">
                    Based on your recent diagnostic attempts, you have highest improvement potential in:
                  </p>
                  <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15 text-xs font-bold text-emerald-200">
                    Physics: Current Electricity & Ohm's Law
                  </div>
                  <button
                    id="quick-start-recommended-drill-btn"
                    onClick={() => {
                      setSelectedSubject('Physics');
                      setSelectedTopic("Current Electricity & Ohm's Law");
                      setPracticeSource('ai_practice');
                      setQuestionCount(10);
                      handleStartExam('practice');
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Start 10-Question Drill
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: MISTAKE BANK (Section 29) */}
          {subTab === 'mistakes' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>💡 Mistake Bank</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
                      {mistakes.filter((m) => !m.resolved).length} Unresolved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Questions you answered incorrectly are automatically captured here so you can master the underlying concepts.
                  </p>
                </div>
              </div>

              {mistakes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Your mistake bank is empty. Any wrong questions in quizzes or mock exams will automatically appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {mistakes.map((m) => (
                    <div
                      key={m.id}
                      className={`p-5 rounded-2xl border space-y-3 transition-all ${
                        m.resolved ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-amber-50/30 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                            {m.subject}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {m.topic} • {m.examName || 'Exam Question'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Ask StudyBuddy for Help on this Mistake */}
                          <button
                            onClick={() =>
                              onOpenStudyBuddy(
                                `Help me understand this mistake in ${m.subject} (${m.topic}): Question: "${m.question}". Correct Answer: "${m.correctAnswer}". Why is this correct?`
                              )
                            }
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 hover:bg-emerald-100"
                          >
                            Ask StudyBuddy AI
                          </button>

                          {/* Toggle Resolved */}
                          <button
                            onClick={() => {
                              const updated = mistakes.map((item) =>
                                item.id === m.id ? { ...item, resolved: !item.resolved } : item
                              );
                              onSaveMistakes(updated);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              m.resolved
                                ? 'border-slate-300 text-slate-600 bg-white'
                                : 'border-emerald-600 bg-emerald-600 text-white'
                            }`}
                          >
                            {m.resolved ? 'Mark Unresolved' : '✓ Mark Mastered'}
                          </button>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        {m.question}
                      </p>

                      <div className="text-xs space-y-1">
                        <p>
                          <span className="font-semibold text-slate-500">Your Previous Answer: </span>
                          <span className="text-rose-600 font-bold">{m.userWrongAnswer}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-500">Correct Answer: </span>
                          <span className="text-emerald-700 font-bold">{m.correctAnswer}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Explanation: </span>
                        <span>{m.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 4: COUNTDOWN & MILESTONES (Section 36) */}
          {subTab === 'countdown' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      📅 Upcoming Exam Countdowns & Milestones
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Track upcoming dates with milestone notifications leading up to exam day.
                    </p>
                  </div>
                </div>

                {/* Add New Countdown Form */}
                <form onSubmit={handleAddCountdown} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exam Name
                    </label>
                    <input
                      type="text"
                      value={newCountdownExam}
                      onChange={(e) => setNewCountdownExam(e.target.value)}
                      placeholder="e.g. WAEC WASSCE 2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Exam Date
                    </label>
                    <input
                      type="date"
                      value={newCountdownDate}
                      onChange={(e) => setNewCountdownDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Target / Notes
                    </label>
                    <input
                      type="text"
                      value={newCountdownNotes}
                      onChange={(e) => setNewCountdownNotes(e.target.value)}
                      placeholder="e.g. Aiming for 7+ Distinctions"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-hidden"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Add Countdown
                    </button>
                  </div>
                </form>

                {/* Countdowns Grid */}
                {countdowns.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {countdowns.map((cd) => {
                      const days = Math.max(
                        0,
                        Math.ceil(
                          (new Date(cd.targetDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      );
                      const isExamDay = days === 0;

                      return (
                        <div
                          key={cd.id}
                          className={`p-6 rounded-3xl border flex flex-col justify-between space-y-4 ${
                            isExamDay
                              ? 'bg-emerald-50 border-emerald-300'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Target Examination
                              </span>
                              <h4 className="text-base font-black text-slate-900 mt-0.5">
                                {cd.examName}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Date: {new Date(cd.targetDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveCountdown(cd.id)}
                              className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>

                          {/* Milestone encouragement box */}
                          {isExamDay ? (
                            <div className="p-3.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold leading-relaxed shadow-xs">
                              Today is your exam! You've prepared for this. Stay focused, read each question carefully, and manage your time. Good luck!
                            </div>
                          ) : (
                            <div className="flex items-baseline justify-between p-4 rounded-2xl bg-white border border-slate-200/80">
                              <span className="text-xs font-bold text-slate-700">Days Remaining:</span>
                              <span className="text-3xl font-black text-blue-700">{days} Days</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-700">No Exam Countdowns Set</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Add your upcoming school term or national examination dates above to track your remaining study days.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 5: SCHOOL EXAM PREPARATION (Section 24) */}
          {subTab === 'school_exam' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                        School Exams & CA
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Primary 1–6 • JSS 1–3 • SS 1–3 • Continuous Assessment
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-1">
                      School Term Examinations & Scheme-of-Work Prep
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
                      Practice for First, Second, and Third Term examinations, Continuous Assessment (CA) tests, and weekly revision drills. You can also upload or paste your school's scheme of work or teacher's test notes.
                    </p>
                  </div>
                </div>

                {generationError && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                    {generationError}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: School Exam Setup Form (8 cols) */}
                  <div className="lg:col-span-8 space-y-5">
                    {/* 1. Academic Level Tabs */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Step 1: Academic Level
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'primary', label: 'Primary School (1-6)' },
                          { id: 'junior_secondary', label: 'Junior Secondary (JSS)' },
                          { id: 'senior_secondary', label: 'Senior Secondary (SS)' },
                          { id: 'university', label: 'University / Tertiary' },
                        ].map((lvl) => (
                          <button
                            key={lvl.id}
                            type="button"
                            onClick={() => handleSchoolLevelChange(lvl.id as EducationLevel)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                              schoolLevel === lvl.id
                                ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Specific Class Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Step 2: Class / Grade
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(CLASSES_BY_LEVEL[schoolLevel] || []).map((cls) => (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => setSchoolClass(cls)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                              schoolClass === cls
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {cls}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3. Term and Assessment Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          School Term
                        </label>
                        <select
                          id="school-tab-term-select"
                          value={schoolTerm}
                          onChange={(e) => setSchoolTerm(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {SCHOOL_TERMS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Assessment Type
                        </label>
                        <select
                          id="school-tab-assessment-select"
                          value={schoolAssessmentType}
                          onChange={(e) => setSchoolAssessmentType(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {SCHOOL_ASSESSMENT_TYPES.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 4. Subject and Curriculum Topic */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Subject
                        </label>
                        <select
                          id="school-tab-subject-select"
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          {(SUBJECTS_BY_LEVEL[schoolLevel] || []).map((sub) => (
                            <option key={sub} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Syllabus Topic
                        </label>
                        <select
                          id="school-tab-topic-select"
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-hidden"
                        >
                          <option value="All Topics">All Term Topics (Comprehensive)</option>
                          {(CURRICULUM_TOPICS_BY_LEVEL[schoolClass]?.[selectedSubject] || []).map(
                            (top) => (
                              <option key={top} value={top}>
                                {top}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* 5. Custom Material / Notes Upload & Grounding */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-slate-800">
                            Ground with School Scheme of Work or Teacher Notes
                          </span>
                        </div>
                        {customMaterialText.trim() ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {customMaterialFileName ? customMaterialFileName : `${customMaterialText.length} characters`}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Have a specific term syllabus, lesson handout, or past test from your teacher? Upload the file or paste the text below so LearnLab AI can mirror your exact classroom expectations.
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 border border-emerald-300 text-xs font-bold cursor-pointer hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-xs">
                          <UploadCloud className="w-4 h-4 text-emerald-600" />
                          <span>Upload File (.txt, .pdf, .doc)</span>
                          <input
                            type="file"
                            accept=".txt,.doc,.docx,.pdf"
                            onChange={handleMaterialFileUpload}
                            className="hidden"
                          />
                        </label>

                        {customMaterialFileName && (
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-xs bg-slate-200/70 px-2.5 py-1 rounded-lg">
                            📄 {customMaterialFileName}
                          </span>
                        )}

                        {customMaterialText && (
                          <button
                            type="button"
                            onClick={() => {
                              setCustomMaterialText('');
                              setCustomMaterialFileName('');
                            }}
                            className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 ml-auto font-semibold px-2 py-1 rounded-lg hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove Content</span>
                          </button>
                        )}
                      </div>

                      <textarea
                        value={customMaterialText}
                        onChange={(e) => setCustomMaterialText(e.target.value)}
                        placeholder="Paste teacher notes, syllabus topics, or questions from past school tests..."
                        rows={3}
                        className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {/* 6. Difficulty & Question Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Difficulty Level
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['easy', 'medium', 'hard'] as const).map((diff) => (
                            <button
                              key={diff}
                              type="button"
                              onClick={() => setDifficulty(diff)}
                              className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                                difficulty === diff
                                  ? 'border-emerald-700 bg-emerald-700 text-white shadow-xs'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {diff}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Question Count
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[5, 10, 20, 30, 50].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQuestionCount(num)}
                              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${
                                questionCount === num
                                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 7. Action Launch Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        id="launch-school-practice-btn"
                        disabled={isGeneratingAI}
                        onClick={() => {
                          setExamCategory('school_exam');
                          handleStartExam('practice');
                        }}
                        className={`py-3.5 px-4 rounded-2xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                          isGeneratingAI
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isGeneratingAI ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Preparing Questions...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 fill-white" />
                            <span>Start School Practice Drill ({questionCount} Qs)</span>
                          </>
                        )}
                      </button>

                      <button
                        id="launch-school-mock-btn"
                        disabled={isGeneratingAI}
                        onClick={() => {
                          setExamCategory('school_exam');
                          handleStartExam('mock');
                        }}
                        className={`py-3.5 px-4 rounded-2xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                          isGeneratingAI
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-slate-900 hover:bg-slate-800'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                        <span>Launch Timed CBT Exam ({schoolLevel === 'primary' ? '25' : '40'} mins)</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Nigerian Curriculum & Syllabus Guide (4 cols) */}
                  <div className="lg:col-span-4 space-y-4">
                    {/* Active Configuration Summary */}
                    <div className="p-5 rounded-3xl bg-emerald-900 text-white shadow-md space-y-3">
                      <div className="flex items-center gap-2">
                        <School className="w-5 h-5 text-emerald-300" />
                        <h4 className="text-sm font-bold">Target Class Syllabus</h4>
                      </div>
                      <div className="text-xs space-y-1 text-emerald-100">
                        <p>
                          <span className="text-emerald-300 font-semibold">Class: </span>
                          <span className="font-bold text-white">{schoolClass}</span>
                        </p>
                        <p>
                          <span className="text-emerald-300 font-semibold">Term: </span>
                          <span>{schoolTerm}</span>
                        </p>
                        <p>
                          <span className="text-emerald-300 font-semibold">Assessment: </span>
                          <span>{schoolAssessmentType}</span>
                        </p>
                        <p>
                          <span className="text-emerald-300 font-semibold">Subject: </span>
                          <span className="font-bold text-white">{selectedSubject}</span>
                        </p>
                      </div>

                      {/* Curriculum Topics for this class */}
                      <div className="pt-2 border-t border-emerald-800">
                        <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold block mb-1.5">
                          Standard Topics ({schoolClass}):
                        </span>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {(CURRICULUM_TOPICS_BY_LEVEL[schoolClass]?.[selectedSubject] || [
                            'Number & Numeration',
                            'Algebraic Expressions',
                            'Everyday Phenomena',
                            'Grammar & Comprehension',
                          ]).map((top) => (
                            <button
                              key={top}
                              type="button"
                              onClick={() => setSelectedTopic(top)}
                              className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                selectedTopic === top
                                  ? 'bg-emerald-800 text-white font-bold'
                                  : 'text-emerald-100 hover:bg-emerald-800/50'
                              }`}
                            >
                              <span className="truncate">{top}</span>
                              {selectedTopic === top && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Nigerian School Assessment Structure */}
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Nigerian School Assessment Structure
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        In primary and secondary schools across Nigeria:
                      </p>
                      <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                        <li>
                          <strong className="text-slate-800">Continuous Assessment (CA):</strong> Accounts for 30% to 40% of the overall term score.
                        </li>
                        <li>
                          <strong className="text-slate-800">Terminal Examination:</strong> Accounts for 60% to 70% of the final grade.
                        </li>
                        <li>
                          <strong className="text-slate-800">Cumulative Promotion:</strong> Promotion to the next class depends on combined First, Second, and Third Term averages.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
