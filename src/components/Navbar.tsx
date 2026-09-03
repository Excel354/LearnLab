import React from 'react';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  BarChart3,
  Calendar,
  Flame,
  User,
  Bell,
  Menu,
  X,
  Zap,
  Cloud,
  CloudCheck,
  LogIn,
} from 'lucide-react';
import { Logo } from './Logo';
import { StudentProfile, StudyBuddyDailyLimit } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  profile: StudentProfile;
  studyBuddyLimit: StudyBuddyDailyLimit;
  onOpenStudyBuddy: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  profile,
  studyBuddyLimit,
  onOpenStudyBuddy,
}) => {
  const { user, signInWithGoogle, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err) {
      console.error('Sign-in failed:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: GraduationCap },
    { id: 'study', label: 'Study Mode', icon: BookOpen, badge: 'Summarizer & Flashcards' },
    { id: 'examprep', label: 'ExamPrep AI', icon: Zap, badge: 'Past Questions & Mocks' },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
  ];


  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo */}
          <button
            id="nav-brand-logo-btn"
            onClick={() => {
              setCurrentTab('home');
              setMobileMenuOpen(false);
            }}
            className="flex items-center text-left focus:outline-hidden hover:opacity-95 transition-opacity"
          >
            <Logo size="md" showTagline={true} />
          </button>

          {/* Desktop Navigation Links: Study Mode | ExamPrep AI | Progress | Study Planner */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`relative flex items-center gap-2 py-1 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Elements: [Account] [StudyBuddy AI] (Single unified account entry point) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Unified Account Management Button (Single Entry Point) */}
            <button
              id="nav-account-entry-btn"
              onClick={() => setCurrentTab('account')}
              title={`Unified Account Management (${user?.email || profile.name})`}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                currentTab === 'account'
                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs ring-2 ring-blue-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {user ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ) : (
                <User className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>Account</span>
            </button>

            {/* If not logged in, quick sign-in option */}
            {!user && (
              <button
                id="nav-login-entry-btn"
                onClick={handleSignIn}
                disabled={authLoading}
                title="Sign in with Google"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authLoading ? '...' : 'Sign In'}</span>
              </button>
            )}

            {/* StudyBuddy AI Quick Pill Button */}
            <button
              id="studybuddy-quick-btn"
              onClick={onOpenStudyBuddy}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/80 rounded-xl text-indigo-900 hover:bg-indigo-100/70 hover:shadow-xs transition-all text-xs font-semibold group"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-1 font-bold text-indigo-950">
                  <span>StudyBuddy AI</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-indigo-700">
                  <span>{studyBuddyLimit.usedCount}/{studyBuddyLimit.maxLimit} replies today</span>
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              id="mobile-studybuddy-btn"
              onClick={onOpenStudyBuddy}
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                {profile.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{profile.name}</p>
                <p className="text-xs text-blue-600 font-semibold">{profile.grade} • {profile.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{profile.studyStreakDays} days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-medium text-slate-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              id="mobile-menu-studybuddy"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenStudyBuddy();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask StudyBuddy AI ({studyBuddyLimit.usedCount}/4)</span>
            </button>
            <button
              id="mobile-menu-account"
              onClick={() => {
                setMobileMenuOpen(false);
                setCurrentTab('account');
              }}
              title="Unified Account Management"
              className="px-3.5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50"
            >
              <User className="w-4 h-4" />
              <span className="text-xs font-bold">Account</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
