import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  Lock,
  User,
  LogIn,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Award,
  AlertCircle,
  Sparkles,
  Zap,
  BookOpen,
  Target,
} from 'lucide-react';
import logoImage from '../../assets/images/learnlab_logo_1788341344137.jpg';
import { useAuth } from '../../context/AuthContext';
import { StudentProfile } from '../../types';
import { DEFAULT_PROFILE } from '../../data/initialData';

interface WelcomeHomeProps {
  profile: StudentProfile;
  onNavigate: (tab: string) => void;
  onSaveProfile: (profile: StudentProfile) => void;
  onOpenStudyBuddy?: (context?: string) => void;
  onExplore?: () => void;
}

export const WelcomeHome: React.FC<WelcomeHomeProps> = ({
  profile,
  onNavigate,
  onSaveProfile,
  onExplore,
}) => {
  const { user, signInWithGoogle, signUpWithEmail, signInWithEmail } = useAuth();

  // Auth Mode: 'signup' vs 'signin'
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (authMode === 'signup') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        const nameToUse = fullName.trim() || 'NEW USER';
        await signUpWithEmail(email.trim(), password, nameToUse);
        onSaveProfile({
          ...DEFAULT_PROFILE,
          name: nameToUse,
          email: email.trim(),
        });
        setAuthSuccess('Account created successfully! Welcome to LearnLab.');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1000);
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your email address and password.');
        }
        await signInWithEmail(email.trim(), password);
        setAuthSuccess('Signed in successfully! Loading your dashboard...');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1000);
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to Sign In.';
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect email or password. Please verify and try again.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Email/Password sign in is disabled in Firebase. Please use Sign in with Google below.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setAuthError(null);
    setAuthLoading(true);
    try {
      const userCred = await signInWithGoogle();
      if (userCred) {
        setAuthSuccess('Signed in with Google successfully!');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 800);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      let msg = err.message || 'Google sign in failed. Please try again.';
      if (err?.code === 'auth/popup-blocked' || msg.includes('blocked')) {
        msg = 'Sign-in pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTriggerExplore = () => {
    if (onExplore) {
      onExplore();
    } else {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-full space-y-12 pb-16">
      {/* HERO SECTION WITH LARGE LOGO, TAGLINE, AUTH & EXPLORE ACTION */}
      <section
        id="welcome-hero"
        className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border border-slate-200/80 p-8 sm:p-14 text-center shadow-xs"
      >
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {/* Large Visible Logo */}
          <div className="relative group mb-6">
            <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-3xl bg-white p-3 shadow-2xl border-4 border-white ring-8 ring-blue-500/10 flex items-center justify-center overflow-hidden transition-transform duration-300 hover:scale-105">
              <img
                src={logoImage}
                alt="LearnLab Logo"
                className="w-full h-full object-contain rounded-2xl"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-md border border-slate-700">
              Official Platform
            </div>
          </div>

          {/* App Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            LearnLab
          </h1>

          {/* Tagline */}
          <div className="mt-3 inline-block px-5 py-2 rounded-full bg-blue-600 text-white font-black text-sm sm:text-base tracking-[0.25em] shadow-lg shadow-blue-600/20 uppercase">
            STUDY. PRACTICE. EXCEL.
          </div>

          {/* Persuasive Message */}
          <p className="mt-5 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-normal">
            Welcome to <strong className="text-slate-900 font-semibold">LearnLab</strong> — Africa's premier AI-powered learning and examination preparation platform. Whether you are in Primary, Junior or Senior Secondary preparing for <span className="font-semibold text-slate-800">WAEC, JAMB/UTME, NECO, or BECE</span>, or tackling university coursework, LearnLab equips you with curriculum-calibrated intelligence to study smarter and excel with distinction.
          </p>

          {/* User Status if already signed in */}
          {user ? (
            <div className="mt-8 p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white w-full max-w-md shadow-xl flex items-center justify-between gap-4">
              <div className="text-left">
                <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                  Signed in as
                </span>
                <h3 className="text-lg font-black text-white">
                  {profile.name || user.displayName || 'NEW USER'}
                </h3>
                <p className="text-xs text-blue-100/80 mt-0.5">
                  {user.email}
                </p>
              </div>

              <button
                id="go-to-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            /* AUTHENTICATION & GUEST EXPLORE CONTAINER */
            <div
              id="auth-container"
              className="mt-8 w-full max-w-md bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl text-left animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Tab Selector: Sign Up vs Sign In */}
              <div className="flex rounded-2xl bg-slate-100 p-1.5 mb-6">
                <button
                  type="button"
                  id="tab-signup-btn"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    authMode === 'signup'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Sign Up (New User)</span>
                </button>
                <button
                  type="button"
                  id="tab-signin-btn"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    authMode === 'signin'
                      ? 'bg-white text-blue-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Notification Banners */}
              {authError && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* 1-Click Google Auth */}
              <button
                type="button"
                id="google-auth-btn"
                disabled={authLoading}
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-3 transition-colors shadow-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {authMode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </span>
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase">or with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. NEW USER"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="scholar@learnlab.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="submit-auth-form-btn"
                  disabled={authLoading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{authMode === 'signup' ? 'Create Free Account' : 'Sign In'}</span>
                      <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </form>

              {/* Dedicated Explore Button without signing in */}
              <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
                <button
                  type="button"
                  id="explore-guest-btn"
                  onClick={handleTriggerExplore}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore LearnLab Without Signing In</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <p className="text-[11px] text-slate-400 font-normal">
                  Instant preview • Browse past questions, CBT simulation & AI tools as a guest.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PERSUASIVE MODERN VALUE PROPOSITIONS */}
      <section className="max-w-5xl mx-auto space-y-8 px-4">
        <div className="text-center space-y-2">
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase">
            The LearnLab Advantage
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Engineered for Exam Excellence & Deep Conceptual Understanding
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Traditional studying leaves knowledge gaps hidden until exam day. LearnLab turns passive reading into active, diagnostic retention.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Proposition 1 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Curriculum-Calibrated
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Strictly mapped to official examination syllabi — WAEC, JAMB/UTME, NECO, BECE, Cambridge, and University level benchmarks.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-blue-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Targeted syllabus coverage</span>
            </div>
          </div>

          {/* Proposition 2 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Active Recall & CBT Drills
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Replicate authentic CBT test conditions with real-time timers, automatic scoring, and detailed step-by-step answer explanations.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Realistic CBT environment</span>
            </div>
          </div>

          {/* Proposition 3 */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Zero Guesswork Readiness
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Our algorithm isolates recurring weaknesses and aggregates errors into your personal Mistake Bank until you achieve 100% mastery.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Data-driven score optimization</span>
            </div>
          </div>
        </div>

        {/* Accreditation & Exam Badges Row */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Trusted Syllabus Standards
              </span>
            </div>
            <h4 className="text-lg font-black text-white">
              Prepared for Every Stage of Your Academic Journey
            </h4>
            <p className="text-xs text-slate-300 max-w-lg">
              Covering senior and junior secondary examinations, common entrance testing, and university undergraduate degree courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['WAEC', 'JAMB / UTME', 'NECO', 'BECE', 'IGCSE / Cambridge', 'University'].map((exam) => (
              <span
                key={exam}
                className="px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 shadow-2xs"
              >
                {exam}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
