import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyMode } from './components/study/StudyMode';
import { ExamPrepMode } from './components/examprep/ExamPrepMode';
import { ProgressDashboard } from './components/progress/ProgressDashboard';
import { StudyPlanner } from './components/planner/StudyPlanner';
import { StudyBuddyModal } from './components/studybuddy/StudyBuddyModal';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { Logo } from './components/Logo';
import {
  StudentProfile,
  StudyNote,
  MistakeItem,
  StudyPlannerTask,
  ExamCountdownItem,
  QuizResult,
  StudyBuddyDailyLimit,
  ExamReadinessScore,
} from './types';
import {
  getStoredProfile,
  saveStoredProfile,
  getStoredNotes,
  saveStoredNotes,
  getStoredMistakes,
  saveStoredMistakes,
  getStoredTasks,
  saveStoredTasks,
  getStoredCountdowns,
  saveStoredCountdowns,
  getStoredQuizHistory,
  getStoredStudyBuddyLimit,
  saveStoredStudyBuddyLimit,
  calculateExamReadiness,
} from './utils/storage';

export const App: React.FC = () => {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [examPrepSubTab, setExamPrepSubTab] = useState<string>('practice');

  // Core Persistent State
  const [profile, setProfile] = useState<StudentProfile>(getStoredProfile());
  const [notes, setNotes] = useState<StudyNote[]>(getStoredNotes());
  const [mistakes, setMistakes] = useState<MistakeItem[]>(getStoredMistakes());
  const [tasks, setTasks] = useState<StudyPlannerTask[]>(getStoredTasks());
  const [countdowns, setCountdowns] = useState<ExamCountdownItem[]>(getStoredCountdowns());
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>(getStoredQuizHistory());
  const [studyBuddyLimit, setStudyBuddyLimit] = useState<StudyBuddyDailyLimit>(
    getStoredStudyBuddyLimit()
  );

  // Modals & Drawers
  const [isStudyBuddyOpen, setIsStudyBuddyOpen] = useState<boolean>(false);
  const [studyBuddyInitialContext, setStudyBuddyInitialContext] = useState<string | undefined>(
    undefined
  );
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Computed Readiness Score
  const readiness: ExamReadinessScore = calculateExamReadiness(notes, quizHistory, mistakes);

  // Profile update handler
  const handleUpdateProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    saveStoredProfile(newProfile);
  };

  // Notes update handler
  const handleUpdateNotes = (newNotes: StudyNote[]) => {
    setNotes(newNotes);
    saveStoredNotes(newNotes);
  };

  // Mistakes update handler
  const handleUpdateMistakes = (newMistakes: MistakeItem[]) => {
    setMistakes(newMistakes);
    saveStoredMistakes(newMistakes);
  };

  // Tasks update handler
  const handleUpdateTasks = (newTasks: StudyPlannerTask[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
  };

  // Countdowns update handler
  const handleUpdateCountdowns = (newCountdowns: ExamCountdownItem[]) => {
    setCountdowns(newCountdowns);
    saveStoredCountdowns(newCountdowns);
  };

  // StudyBuddy Limit handler
  const handleUpdateStudyBuddyLimit = (newLimit: StudyBuddyDailyLimit) => {
    setStudyBuddyLimit(newLimit);
    saveStoredStudyBuddyLimit(newLimit);
  };

  // Quiz completion handler
  const handleQuizCompleted = (result: QuizResult) => {
    setQuizHistory(getStoredQuizHistory());
    setMistakes(getStoredMistakes());
  };

  // Navigation helper
  const handleNavigate = (tab: string, subTab?: string) => {
    setCurrentTab(tab);
    if (subTab) {
      setExamPrepSubTab(subTab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open StudyBuddy with custom context
  const handleOpenStudyBuddyWithContext = (context?: string) => {
    setStudyBuddyInitialContext(context);
    setIsStudyBuddyOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Onboarding Modal for first-time or uncompleted setups */}
      {!profile.onboardingCompleted && (
        <OnboardingModal
          initialProfile={profile}
          onComplete={(completedProfile) => {
            handleUpdateProfile(completedProfile);
          }}
        />
      )}

      {/* Main Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        profile={profile}
        studyBuddyLimit={studyBuddyLimit}
        onOpenStudyBuddy={() => handleOpenStudyBuddyWithContext()}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-16">
        {currentTab === 'home' && (
          <HomeDashboard
            profile={profile}
            notes={notes}
            mistakes={mistakes}
            tasks={tasks}
            countdowns={countdowns}
            readiness={readiness}
            onNavigate={handleNavigate}
            onOpenStudyBuddy={() => handleOpenStudyBuddyWithContext()}
          />
        )}

        {currentTab === 'study' && (
          <StudyMode
            profile={profile}
            notes={notes}
            onSaveNotes={handleUpdateNotes}
            onQuizCompleted={handleQuizCompleted}
            onOpenStudyBuddy={handleOpenStudyBuddyWithContext}
          />
        )}

        {currentTab === 'examprep' && (
          <ExamPrepMode
            profile={profile}
            mistakes={mistakes}
            countdowns={countdowns}
            initialSubTab={examPrepSubTab}
            onSaveMistakes={handleUpdateMistakes}
            onSaveCountdowns={handleUpdateCountdowns}
            onQuizCompleted={handleQuizCompleted}
            onOpenStudyBuddy={handleOpenStudyBuddyWithContext}
          />
        )}

        {currentTab === 'progress' && (
          <ProgressDashboard
            profile={profile}
            readiness={readiness}
            quizHistory={quizHistory}
            mistakes={mistakes}
            notes={notes}
            onNavigateToStudy={() => setCurrentTab('study')}
            onNavigateToExamPrep={() => setCurrentTab('examprep')}
          />
        )}

        {currentTab === 'planner' && (
          <StudyPlanner
            profile={profile}
            tasks={tasks}
            onSaveTasks={handleUpdateTasks}
            onNavigateToStudy={() => setCurrentTab('study')}
            onNavigateToExamPrep={() => setCurrentTab('examprep')}
          />
        )}
      </main>

      {/* Persistent StudyBuddy AI Modal */}
      <StudyBuddyModal
        isOpen={isStudyBuddyOpen}
        onClose={() => setIsStudyBuddyOpen(false)}
        profile={profile}
        limit={studyBuddyLimit}
        onUpdateLimit={handleUpdateStudyBuddyLimit}
        initialContext={studyBuddyInitialContext}
      />

      {/* Student Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleUpdateProfile}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={true} />
          </div>

          <p className="text-xs text-slate-500 text-center sm:text-right">
            Curriculum aligned with WAEC, JAMB/UTME, NECO, BECE, National Common Entrance & University standards.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
