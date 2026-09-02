import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  School,
  Calendar,
} from 'lucide-react';
import { Logo } from './Logo';
import { StudentProfile, EducationLevel } from '../types';
import { SUBJECTS_BY_LEVEL, NIGERIAN_EXAMS } from '../data/curriculumData';

interface OnboardingModalProps {
  initialProfile: StudentProfile;
  onComplete: (profile: StudentProfile) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  initialProfile,
  onComplete,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialProfile.name || '');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(
    initialProfile.educationLevel || 'senior_secondary'
  );
  const [grade, setGrade] = useState(initialProfile.grade || 'SS 3');
  const [country, setCountry] = useState(initialProfile.country || 'Nigeria');
  const [institution, setInstitution] = useState(initialProfile.institution || '');
  const [course, setCourse] = useState(initialProfile.course || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialProfile.subjects || []
  );
  const [targetExams, setTargetExams] = useState<string[]>(
    initialProfile.targetExams || []
  );

  const gradeOptions: Record<EducationLevel, string[]> = {
    primary: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    junior_secondary: ['JSS 1', 'JSS 2', 'JSS 3'],
    senior_secondary: ['SS 1', 'SS 2', 'SS 3'],
    university: ['100 Level (Year 1)', '200 Level (Year 2)', '300 Level (Year 3)', '400 Level (Year 4)', '500 Level (Year 5)', 'Postgraduate'],
  };

  const handleLevelChange = (lvl: EducationLevel) => {
    setEducationLevel(lvl);
    const availableGrades = gradeOptions[lvl];
    setGrade(availableGrades[availableGrades.length - 1]); // e.g. SS3 or Primary 6 by default
    const availableSubs = SUBJECTS_BY_LEVEL[lvl] || [];
    setSelectedSubjects(availableSubs.slice(0, 6));
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const toggleExam = (examName: string) => {
    if (targetExams.includes(examName)) {
      setTargetExams(targetExams.filter((e) => e !== examName));
    } else {
      setTargetExams([...targetExams, examName]);
    }
  };

  const handleFinish = () => {
    const updated: StudentProfile = {
      ...initialProfile,
      name: name.trim() || 'Scholar',
      educationLevel,
      grade,
      country,
      institution: educationLevel === 'university' ? institution : undefined,
      course: educationLevel === 'university' ? course : undefined,
      subjects: selectedSubjects.length > 0 ? selectedSubjects : (SUBJECTS_BY_LEVEL[educationLevel] || []).slice(0, 5),
      targetExams,
      onboardingCompleted: true,
    };
    onComplete(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-emerald-600 px-6 sm:px-8 py-6 text-white text-center relative">
          <div className="flex justify-center mb-2">
            <Logo size="lg" showTagline={false} />
          </div>
          <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest">
            Study. Practice. Excel
          </p>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            Welcome to LearnLab
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            Personalize your AI study ecosystem in less than 60 seconds.
          </p>

          {/* Step Progress Pills */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <span className={`h-2 rounded-full transition-all ${step === 1 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
            <span className={`h-2 rounded-full transition-all ${step === 2 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
            <span className={`h-2 rounded-full transition-all ${step === 3 ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
          </div>
        </div>

        {/* Content Steps */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* STEP 1: Academic Level & Grade */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  What is your full name?
                </label>
                <input
                  id="onboarding-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chinedu Okafor"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm font-medium outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Education Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'primary', label: 'Primary', desc: 'Classes 1–6' },
                    { id: 'junior_secondary', label: 'Junior Sec.', desc: 'JSS 1–3' },
                    { id: 'senior_secondary', label: 'Senior Sec.', desc: 'SS 1–3' },
                    { id: 'university', label: 'University', desc: '100L–500L' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      id={`level-opt-${lvl.id}`}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id as EducationLevel)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        educationLevel === lvl.id
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <p className={`text-sm font-bold ${educationLevel === lvl.id ? 'text-blue-900' : 'text-slate-800'}`}>
                        {lvl.label}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {lvl.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Specific Class / Grade
                </label>
                <select
                  id="onboarding-grade-select"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-hidden"
                >
                  {gradeOptions[educationLevel].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {educationLevel === 'university' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      University / Tertiary Institution
                    </label>
                    <input
                      id="onboarding-institution-input"
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. University of Lagos (UNILAG)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Course of Study / Department
                    </label>
                    <input
                      id="onboarding-course-input"
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. Medicine & Surgery, Computer Science"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Subjects Selection */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Select Your Study Subjects
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick the subjects you want to summarize notes and practice questions for ({selectedSubjects.length} selected).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                {(SUBJECTS_BY_LEVEL[educationLevel] || []).map((sub) => {
                  const isSelected = selectedSubjects.includes(sub);
                  return (
                    <button
                      key={sub}
                      id={`subject-tag-${sub.replace(/\s+/g, '-').toLowerCase()}`}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate mr-1">{sub}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Upcoming Target Exams (Optional) */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Target Examinations (Optional)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose any upcoming exams so ExamPrep AI can prioritize past questions and countdown milestones.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {NIGERIAN_EXAMS.map((exam) => {
                  const isTargeted = targetExams.includes(exam.shortName);
                  return (
                    <button
                      key={exam.id}
                      id={`target-exam-${exam.id}`}
                      type="button"
                      onClick={() => toggleExam(exam.shortName)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isTargeted
                          ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{exam.shortName}</span>
                        {isTargeted && <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {exam.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Action Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                id="onboarding-back-btn"
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                id="onboarding-next-btn"
                type="button"
                onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="onboarding-finish-btn"
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start Studying</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
