import React, { useState, useRef } from 'react';
import {
  User,
  Mail,
  Shield,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Clock,
  LogOut,
  LogIn,
  School,
  Globe,
  GraduationCap,
  Sparkles,
  BookOpen,
  HelpCircle,
  Calendar,
  Layers,
  FileText,
  Check,
  ChevronRight,
  Database,
  X,
  Flame,
  Camera,
  Upload,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  StudentProfile,
  EducationLevel,
  StudyNote,
  MistakeItem,
  StudyPlannerTask,
  ExamCountdownItem,
  QuizResult,
} from '../../types';
import { SUBJECTS_BY_LEVEL } from '../../data/curriculumData';
import { getAvatarColor } from '../../utils/avatarColor';

interface AccountManagementProps {
  profile: StudentProfile;
  notes: StudyNote[];
  mistakes: MistakeItem[];
  tasks: StudyPlannerTask[];
  countdowns: ExamCountdownItem[];
  quizHistory: QuizResult[];
  onSaveProfile: (profile: StudentProfile) => void;
  onEraseAllData: () => Promise<void>;
  onNavigateToStudy: () => void;
}

export const AccountManagement: React.FC<AccountManagementProps> = ({
  profile,
  notes,
  mistakes,
  tasks,
  countdowns,
  quizHistory,
  onSaveProfile,
  onEraseAllData,
  onNavigateToStudy,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();

  // Profile Edit State
  const [name, setName] = useState<string>(profile.name || (user?.displayName ?? 'Scholar'));
  const [educationLevel, setEducationLevel] = useState<EducationLevel>(profile.educationLevel);
  const [grade, setGrade] = useState<string>(profile.grade);
  const [country, setCountry] = useState<string>(profile.country || 'Nigeria');
  const [institution, setInstitution] = useState<string>(profile.institution || '');
  const [course, setCourse] = useState<string>(profile.course || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(profile.subjects || []);
  const [targetExams, setTargetExams] = useState<string[]>(profile.targetExams || []);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Erase Modal State
  const [isEraseModalOpen, setIsEraseModalOpen] = useState<boolean>(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState<string>('');
  const [isErasing, setIsErasing] = useState<boolean>(false);
  const [eraseError, setEraseError] = useState<string | null>(null);
  const [eraseSuccessBanner, setEraseSuccessBanner] = useState<boolean>(false);

  // Sign out confirmation state
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  // Profile Picture & Camera States
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [photoMode, setPhotoMode] = useState<'options' | 'camera'>('options');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentUsername = name || user?.displayName || user?.email || 'Scholar';
  const initialLetter = currentUsername.trim().charAt(0).toUpperCase() || 'S';
  const avatarBgColor = profile.avatarColor || getAvatarColor(currentUsername);

  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    setCapturedPreview(null);
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      setPhotoMode('camera');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        'Could not access camera device. Please allow camera permissions, or choose a file from your photos below.'
      );
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const snapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPreview(dataUrl);
      stopCamera();
    }
  };

  const handleSavePhoto = (photoDataUrl: string) => {
    const updated: StudentProfile = {
      ...profile,
      photoURL: photoDataUrl,
      avatarColor: avatarBgColor,
    };
    onSaveProfile(updated);
    setIsPhotoModalOpen(false);
    stopCamera();
    setCapturedPreview(null);
    setSaveSuccessMessage('Profile picture updated successfully!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleRemovePhoto = () => {
    const updated: StudentProfile = {
      ...profile,
      photoURL: undefined,
      avatarColor: avatarBgColor,
    };
    onSaveProfile(updated);
    setIsPhotoModalOpen(false);
    stopCamera();
    setCapturedPreview(null);
    setSaveSuccessMessage('Profile picture removed. Showing custom letter avatar.');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Please select an image smaller than 8MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleSavePhoto(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const gradeOptions: Record<EducationLevel, string[]> = {
    primary: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    junior_secondary: ['JSS 1', 'JSS 2', 'JSS 3'],
    senior_secondary: ['SS 1', 'SS 2', 'SS 3'],
    university: [
      '100 Level (Year 1)',
      '200 Level (Year 2)',
      '300 Level (Year 3)',
      '400 Level (Year 4)',
      '500 Level (Year 5)',
      'Postgraduate',
    ],
  };

  const handleLevelChange = (lvl: EducationLevel) => {
    setEducationLevel(lvl);
    const available = gradeOptions[lvl];
    setGrade(available[available.length - 1]);
    // Pre-populate default subjects for this level if none selected or mismatched
    const levelSubs = SUBJECTS_BY_LEVEL[lvl] || [];
    if (levelSubs.length > 0) {
      setSelectedSubjects(levelSubs.slice(0, 5));
    }
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== sub));
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const toggleTargetExam = (exam: string) => {
    if (targetExams.includes(exam)) {
      setTargetExams(targetExams.filter((e) => e !== exam));
    } else {
      setTargetExams([...targetExams, exam]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: StudentProfile = {
      ...profile,
      name: name.trim() || 'Scholar',
      educationLevel,
      grade,
      country,
      institution: educationLevel === 'university' ? institution.trim() : undefined,
      course: educationLevel === 'university' ? course.trim() : undefined,
      subjects: selectedSubjects,
      targetExams,
    };
    onSaveProfile(updatedProfile);
    setSaveSuccessMessage('Personal information & curriculum settings saved successfully.');
    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 4000);
  };

  const handleExecuteErase = async () => {
    if (eraseConfirmInput.trim().toUpperCase() !== 'ERASE') {
      setEraseError('Please type ERASE to confirm permanent data deletion.');
      return;
    }

    try {
      setIsErasing(true);
      setEraseError(null);
      await onEraseAllData();
      setIsErasing(false);
      setIsEraseModalOpen(false);
      setEraseConfirmInput('');
      setEraseSuccessBanner(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to erase user data:', err);
      setIsErasing(false);
      setEraseError(
        err?.message || 'An unexpected error occurred while erasing your data. Please try again.'
      );
    }
  };

  const handleLogout = async () => {
    try {
      setIsSigningOut(true);
      await logout();
      setIsSigningOut(false);
    } catch (err) {
      console.error('Logout failed:', err);
      setIsSigningOut(false);
    }
  };

  const totalUserDataCount =
    notes.length + mistakes.length + tasks.length + countdowns.length + quizHistory.length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          <span>Settings</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-blue-700">Profile</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Profile
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Manage your personal student details, profile photo, curriculum settings, security
              credentials, and privacy controls.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Firebase Synced
              </span>
            ) : (
              <button
                onClick={() => signInWithGoogle()}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
            )}

            {/* Functional Sign Out Button */}
            <button
              id="profile-header-signout-btn"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Student Academic & Streak Overview Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-8 translate-y-8">
          <GraduationCap className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex flex-col items-center sm:items-start">
              {profile.photoURL || user?.photoURL ? (
                <img
                  src={profile.photoURL || user?.photoURL || ''}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/30 object-cover shadow-md shrink-0"
                />
              ) : (
                <div
                  style={{ backgroundColor: avatarBgColor }}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-white font-black text-2xl sm:text-3xl flex items-center justify-center border-2 border-white/30 shadow-md select-none shrink-0"
                >
                  {initialLetter}
                </div>
              )}
              {/* Button to add/change profile picture */}
              <button
                id="profile-picture-edit-btn"
                type="button"
                onClick={() => {
                  setIsPhotoModalOpen(true);
                  setPhotoMode('options');
                  setCameraError(null);
                  setCapturedPreview(null);
                }}
                className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-all border border-white/20 shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{profile.photoURL || user?.photoURL ? 'Change Photo' : 'Add Profile Picture'}</span>
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{name}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {grade}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                {educationLevel === 'university' ? (institution || 'University Scholar') : `${country} Curriculum`} • {selectedSubjects.length} Active Subjects
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Study Streak */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <div className="text-lg font-black text-white leading-none">
                  {profile.studyStreakDays || 1} Day Streak
                </div>
                <div className="text-[11px] text-amber-200 font-semibold mt-0.5">
                  Daily Study Rhythm
                </div>
              </div>
            </div>

            {/* Total Cloud Resources */}
            <div className="hidden md:flex bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/15 items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-black text-white leading-none">
                  {totalUserDataCount}
                </div>
                <div className="text-[11px] text-blue-200 font-semibold mt-0.5">
                  Study Resources
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner after Data Deletion */}
      {eraseSuccessBanner && (
        <div
          id="erase-success-notification"
          className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-emerald-900">
                Your LearnLab data has been successfully erased.
              </h4>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">
                All study notes, extracted files, flashcards, diagnostic quiz records, mock exam
                scores, mistake bank entries, and timetable tasks have been permanently deleted from
                both Cloud Firestore and local storage. Your account is now completely empty and
                fresh.
              </p>
            </div>
          </div>
          <button
            onClick={() => setEraseSuccessBanner(false)}
            className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Column (Personal Info & Account Info) + Right Column (Security & Data/Privacy) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Profile / Personal Information */}
          <section
            id="personal-information-section"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                  <p className="text-xs text-slate-500">
                    Update your student profile and academic curriculum settings
                  </p>
                </div>
              </div>
            </div>

            {saveSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{saveSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Amina Bello or Chinedu Okafor"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  This name is used across your personalized study summaries, quiz reports, and AI
                  tutoring sessions.
                </p>
              </div>

              {/* Education Level & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Education Level
                  </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => handleLevelChange(e.target.value as EducationLevel)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white transition-all"
                  >
                    <option value="primary">Primary School</option>
                    <option value="junior_secondary">Junior Secondary (JSS 1 - 3)</option>
                    <option value="senior_secondary">Senior Secondary (SS 1 - 3)</option>
                    <option value="university">University / Higher Institution</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Current Grade / Year
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white transition-all"
                  >
                    {gradeOptions[educationLevel].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Country */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Country / Curriculum Region
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white transition-all"
                >
                  <option value="Nigeria">Nigeria (WAEC, JAMB/UTME, NECO, BECE, NCEE)</option>
                  <option value="Ghana">Ghana (WASSCE, BECE)</option>
                  <option value="Kenya">Kenya (KCSE, CBC)</option>
                  <option value="Rwanda">Rwanda (National Examinations)</option>
                  <option value="Sierra Leone">Sierra Leone (WASSCE)</option>
                  <option value="Liberia">Liberia (WASSCE)</option>
                  <option value="International">International Curriculum</option>
                </select>
              </div>

              {/* University Specific Fields */}
              {educationLevel === 'university' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      University / Institution
                    </label>
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="e.g. University of Lagos (UNILAG)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Course of Study / Major
                    </label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      placeholder="e.g. Computer Science, Medicine"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-900 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              )}

              {/* Selected Academic Subjects */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Academic Subjects ({selectedSubjects.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Click subjects to add/remove
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {(SUBJECTS_BY_LEVEL[educationLevel] || []).map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{subject}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Examinations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Target Examinations & Assessments
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Syllabi & exam modes you prepare for
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                  {[
                    'School Term Exams',
                    'Continuous Assessments (CAs)',
                    'Class Tests & Quizzes',
                    'WAEC / WASSCE',
                    'JAMB / UTME',
                    'NECO SSCE',
                    'BECE / Junior WAEC',
                    'National Common Entrance',
                    'NABTEB',
                    'University Semester Exams',
                  ].map((exam) => {
                    const isTargeted = targetExams.includes(exam);
                    return (
                      <button
                        key={exam}
                        type="button"
                        onClick={() => toggleTargetExam(exam)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between ${
                          isTargeted
                            ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                        }`}
                      >
                        <span className="truncate">{exam}</span>
                        {isTargeted && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Account Information */}
          <section
            id="account-information-section"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Account Information</h2>
                <p className="text-xs text-slate-500">
                  Authentication provider, login credentials, and synchronization status
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Email Address
                </span>
                <span className="text-sm font-semibold text-slate-900 block mt-1 break-all">
                  {user?.email || profile.email || 'No email attached (Local Session)'}
                </span>
              </div>

              {/* Login Provider */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Authentication Method
                </span>
                <span className="text-sm font-semibold text-slate-900 block mt-1">
                  {user ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Google / Firebase Auth
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Guest / Local Browser Session
                    </span>
                  )}
                </span>
              </div>

              {/* Account ID / UID */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Account ID (UID)
                </span>
                <span className="text-xs font-mono font-medium text-slate-700 block mt-1 truncate">
                  {user?.uid || profile.id || 'local-guest-session'}
                </span>
              </div>

              {/* Member Since */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Account Created
                </span>
                <span className="text-sm font-semibold text-slate-900 block mt-1">
                  {user?.metadata?.creationTime
                    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Current session'}
                </span>
              </div>

              {/* Last Sign In */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Last Sign-In
                </span>
                <span className="text-sm font-semibold text-slate-900 block mt-1">
                  {user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Active now'}
                </span>
              </div>

              {/* Cloud Sync Status */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Cloud Database Status
                </span>
                <span className="text-sm font-semibold text-slate-900 block mt-1">
                  {user ? (
                    <span className="text-emerald-700 font-medium">
                      Active • Scoped to your User ID
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">Local Browser Cache Only</span>
                  )}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Security & Data/Privacy */}
        <div className="lg:col-span-5 space-y-8">
          {/* Section 3: Security & Session */}
          <section
            id="security-section"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Security & Session</h2>
                <p className="text-xs text-slate-500">Access control & device authorization</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">
                    Cloud Firestore Security Rules
                  </strong>
                  All documents and study subcollections are strictly locked to your verified User
                  ID.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                <Database className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block mb-0.5">Multi-Device Persistence</strong>
                  Your study materials and quiz scores synchronize automatically across your
                  authenticated sessions.
                </div>
              </div>
            </div>

            {/* Session Action: Sign In or Sign Out */}
            <div className="pt-2 border-t border-slate-100">
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-600">
                    Signed in as <strong className="text-slate-900">{user.email}</strong>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={isSigningOut}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-slate-600">
                    Sign in with Google to enable cloud backup and synchronize your learning across
                    devices.
                  </p>
                  <button
                    onClick={() => signInWithGoogle()}
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In with Google
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section 4: Data & Privacy */}
          <section
            id="data-and-privacy-section"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Data & Privacy</h2>
                <p className="text-xs text-slate-500">
                  Review stored study materials and manage data retention
                </p>
              </div>
            </div>

            {/* Stored Study Data Counts */}
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
                Stored Account Content
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <span className="text-[11px] text-slate-500 block">Study Notes</span>
                  <span className="text-lg font-bold text-slate-900">{notes.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <span className="text-[11px] text-slate-500 block">Quiz Attempts</span>
                  <span className="text-lg font-bold text-slate-900">{quizHistory.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <span className="text-[11px] text-slate-500 block">Mistake Bank</span>
                  <span className="text-lg font-bold text-slate-900">{mistakes.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-left">
                  <span className="text-[11px] text-slate-500 block">Planner Tasks</span>
                  <span className="text-lg font-bold text-slate-900">{tasks.length}</span>
                </div>
              </div>
            </div>

            {/* Destructive Action Card: Erase All My Data */}
            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-950">Erase All My Data</h3>
                  <p className="text-xs text-rose-800/90 mt-1 leading-relaxed">
                    Permanently delete all study notes, uploaded curriculum materials, extracted
                    summaries, active recall flashcards, quiz attempts, mistake bank items, and study
                    planner schedules.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  id="open-erase-data-modal-btn"
                  onClick={() => {
                    setEraseConfirmInput('');
                    setEraseError(null);
                    setIsEraseModalOpen(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Erase All My Data
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Confirmation & Warning Dialog for "Erase All My Data" */}
      {isEraseModalOpen && (
        <div
          id="erase-confirmation-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 sm:p-7 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Erase All My Data?</h3>
                  <p className="text-xs text-slate-500">
                    This action is permanent and cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isErasing && setIsEraseModalOpen(false)}
                disabled={isErasing}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-7 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Warning: Irreversible Account Deletion
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-800">
                  <li>
                    All your uploaded notes, generated summaries, and flashcards will be permanently
                    removed.
                  </li>
                  <li>
                    All diagnostic quiz results, mock exam attempts, and mistake bank records will
                    be cleared.
                  </li>
                  <li>
                    All study planner tasks, schedules, and countdowns will be erased from Cloud
                    Firestore.
                  </li>
                  <li>
                    <strong>Authentication Note:</strong> Your Firebase account credentials remain
                    intact so you can continue to sign in with an empty, fresh profile.
                  </li>
                </ul>
              </div>

              {eraseError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {eraseError}
                </div>
              )}

              {/* Explicit Confirmation Input */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  To confirm, type <span className="font-mono text-rose-700 font-extrabold">ERASE</span> below:
                </label>
                <input
                  type="text"
                  value={eraseConfirmInput}
                  onChange={(e) => setEraseConfirmInput(e.target.value)}
                  placeholder="Type ERASE to confirm"
                  disabled={isErasing}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all disabled:bg-slate-100"
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 sm:p-7 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEraseModalOpen(false)}
                disabled={isErasing}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-permanent-erase-btn"
                onClick={handleExecuteErase}
                disabled={isErasing || eraseConfirmInput.trim().toUpperCase() !== 'ERASE'}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {isErasing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Erasing Data from Cloud Firestore...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm & Permanently Erase All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Modal (Take a Photo or Select from Existing Files) */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Profile Picture</h3>
                  <p className="text-xs text-slate-500">
                    Take a photo or choose an existing photo from your files
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsPhotoModalOpen(false);
                  setPhotoMode('options');
                  setCapturedPreview(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {cameraError && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {photoMode === 'options' ? (
                <div className="space-y-4">
                  {/* Current Avatar Preview */}
                  <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {profile.photoURL || user?.photoURL ? (
                      <img
                        src={profile.photoURL || user?.photoURL || ''}
                        alt="Current Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
                      />
                    ) : (
                      <div
                        style={{ backgroundColor: avatarBgColor }}
                        className="w-24 h-24 rounded-full text-white font-black text-4xl flex items-center justify-center border-4 border-white shadow-md select-none"
                      >
                        {initialLetter}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-slate-500 mt-2">
                      {profile.photoURL
                        ? 'Custom Profile Picture Active'
                        : `Default Letter Avatar (${initialLetter})`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option 1: Take Photo via Camera */}
                    <button
                      type="button"
                      id="modal-take-photo-btn"
                      onClick={() => startCamera('user')}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex flex-col items-start gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Take a Photo</span>
                        <span className="text-[11px] text-slate-500 block">Use device webcam or camera</span>
                      </div>
                    </button>

                    {/* Option 2: Choose from Files / Photos */}
                    <button
                      type="button"
                      id="modal-select-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-left flex flex-col items-start gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          Select from Files or Photos
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Upload from storage or gallery
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Remove photo option if one is set */}
                  {profile.photoURL && (
                    <div className="pt-2 border-t border-slate-100 flex justify-center">
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 py-1.5 px-3 rounded-lg hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Custom Photo & Use Letter Avatar</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Camera Mode */
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-xs mx-auto shadow-inner flex items-center justify-center">
                    {capturedPreview ? (
                      <img
                        src={capturedPreview}
                        alt="Captured Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Circle overlay guide */}
                        <div className="absolute inset-0 border-2 border-dashed border-white/50 rounded-full m-6 pointer-events-none" />
                      </>
                    )}
                  </div>

                  {/* Camera Action Buttons */}
                  <div className="flex items-center justify-center gap-3">
                    {capturedPreview ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedPreview(null);
                            startCamera(cameraFacing);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Retake Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSavePhoto(capturedPreview)}
                          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                        >
                          Use This Photo
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            stopCamera();
                            setPhotoMode('options');
                          }}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const newFacing = cameraFacing === 'user' ? 'environment' : 'user';
                            setCameraFacing(newFacing);
                            startCamera(newFacing);
                          }}
                          className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                          title="Switch Camera"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          id="snap-photo-trigger-btn"
                          onClick={snapPhoto}
                          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Snap Photo</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
