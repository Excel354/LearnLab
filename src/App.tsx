import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { StudyMode } from './components/study/StudyMode';
import { ExamPrepMode } from './components/examprep/ExamPrepMode';
import { ProgressDashboard } from './components/progress/ProgressDashboard';
import { StudyPlanner } from './components/planner/StudyPlanner';
import { StudyBuddyModal } from './components/studybuddy/StudyBuddyModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AccountManagement } from './components/account/AccountManagement';
import { Logo } from './components/Logo';
import { useAuth } from './context/AuthContext';
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
  saveStoredQuizHistory,
  getStoredStudyBuddyLimit,
  saveStoredStudyBuddyLimit,
  clearAllStoredUserData,
  calculateExamReadiness,
} from './utils/storage';
import {
  syncUserProfile,
  syncStudyNote,
  deleteStudyNoteFromFirestore,
  syncPlannerTask,
  deletePlannerTaskFromFirestore,
  syncMistakeItem,
  deleteMistakeFromFirestore,
  syncCountdownItem,
  deleteCountdownFromFirestore,
  syncQuizResult,
  subscribeToUserData,
  eraseAllUserFirestoreData,
} from './lib/firestoreService';

export const App: React.FC = () => {
  const { user } = useAuth();

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

  // Track previous arrays for Firestore deletion diffing
  const prevNotesRef = useRef<StudyNote[]>(notes);
  const prevTasksRef = useRef<StudyPlannerTask[]>(tasks);
  const prevMistakesRef = useRef<MistakeItem[]>(mistakes);
  const prevCountdownsRef = useRef<ExamCountdownItem[]>(countdowns);

  // Synchronize with Firebase Firestore in real-time when authenticated
  useEffect(() => {
    if (!user) return;

    // Ensure student profile in state matches user ID & email
    const updatedProfile: StudentProfile = {
      ...profile,
      id: user.uid,
      email: user.email || profile.email,
      name: profile.name === 'Scholar' && user.displayName ? user.displayName : profile.name,
    };
    setProfile(updatedProfile);
    saveStoredProfile(updatedProfile);
    syncUserProfile(updatedProfile);

    // Initial backup of existing local data to Firestore if not already present
    notes.forEach((n) => syncStudyNote(user.uid, { ...n, userId: user.uid }));
    tasks.forEach((t) => syncPlannerTask(user.uid, { ...t, userId: user.uid }));
    mistakes.forEach((m) => syncMistakeItem(user.uid, { ...m, userId: user.uid }));
    countdowns.forEach((c) => syncCountdownItem(user.uid, { ...c, userId: user.uid }));
    quizHistory.forEach((q) => syncQuizResult(user.uid, { ...q, userId: user.uid }));

    // Subscribe to Firestore collections
    const unsubscribe = subscribeToUserData(user.uid, {
      onProfile: (remoteProfile) => {
        if (remoteProfile) {
          setProfile(remoteProfile);
          saveStoredProfile(remoteProfile);
        }
      },
      onNotes: (remoteNotes) => {
        const list = remoteNotes || [];
        setNotes(list);
        saveStoredNotes(list);
        prevNotesRef.current = list;
      },
      onTasks: (remoteTasks) => {
        const list = remoteTasks || [];
        setTasks(list);
        saveStoredTasks(list);
        prevTasksRef.current = list;
      },
      onMistakes: (remoteMistakes) => {
        const list = remoteMistakes || [];
        setMistakes(list);
        saveStoredMistakes(list);
        prevMistakesRef.current = list;
      },
      onCountdowns: (remoteCountdowns) => {
        const list = remoteCountdowns || [];
        setCountdowns(list);
        saveStoredCountdowns(list);
        prevCountdownsRef.current = list;
      },
      onQuizHistory: (remoteHistory) => {
        const list = remoteHistory || [];
        setQuizHistory(list);
        saveStoredQuizHistory(list);
      },
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Computed Readiness Score
  const readiness: ExamReadinessScore = calculateExamReadiness(notes, quizHistory, mistakes);

  // Profile update handler
  const handleUpdateProfile = (newProfile: StudentProfile) => {
    const profileToSave = user ? { ...newProfile, id: user.uid, email: user.email || newProfile.email } : newProfile;
    setProfile(profileToSave);
    saveStoredProfile(profileToSave);
    if (user) {
      syncUserProfile(profileToSave);
    }
  };

  // Notes update handler
  const handleUpdateNotes = (newNotes: StudyNote[]) => {
    setNotes(newNotes);
    saveStoredNotes(newNotes);
    if (user) {
      // Find deleted notes
      const currentIds = new Set(newNotes.map((n) => n.id));
      prevNotesRef.current.forEach((oldNote) => {
        if (!currentIds.has(oldNote.id)) {
          deleteStudyNoteFromFirestore(user.uid, oldNote.id);
        }
      });
      // Sync added/updated notes
      newNotes.forEach((n) => syncStudyNote(user.uid, { ...n, userId: user.uid }));
    }
    prevNotesRef.current = newNotes;
  };

  // Mistakes update handler
  const handleUpdateMistakes = (newMistakes: MistakeItem[]) => {
    setMistakes(newMistakes);
    saveStoredMistakes(newMistakes);
    if (user) {
      const currentIds = new Set(newMistakes.map((m) => m.id));
      prevMistakesRef.current.forEach((oldMistake) => {
        if (!currentIds.has(oldMistake.id)) {
          deleteMistakeFromFirestore(user.uid, oldMistake.id);
        }
      });
      newMistakes.forEach((m) => syncMistakeItem(user.uid, { ...m, userId: user.uid }));
    }
    prevMistakesRef.current = newMistakes;
  };

  // Tasks update handler
  const handleUpdateTasks = (newTasks: StudyPlannerTask[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
    if (user) {
      const currentIds = new Set(newTasks.map((t) => t.id));
      prevTasksRef.current.forEach((oldTask) => {
        if (!currentIds.has(oldTask.id)) {
          deletePlannerTaskFromFirestore(user.uid, oldTask.id);
        }
      });
      newTasks.forEach((t) => syncPlannerTask(user.uid, { ...t, userId: user.uid }));
    }
    prevTasksRef.current = newTasks;
  };

  // Countdowns update handler
  const handleUpdateCountdowns = (newCountdowns: ExamCountdownItem[]) => {
    setCountdowns(newCountdowns);
    saveStoredCountdowns(newCountdowns);
    if (user) {
      const currentIds = new Set(newCountdowns.map((c) => c.id));
      prevCountdownsRef.current.forEach((oldCountdown) => {
        if (!currentIds.has(oldCountdown.id)) {
          deleteCountdownFromFirestore(user.uid, oldCountdown.id);
        }
      });
      newCountdowns.forEach((c) => syncCountdownItem(user.uid, { ...c, userId: user.uid }));
    }
    prevCountdownsRef.current = newCountdowns;
  };

  // StudyBuddy Limit handler
  const handleUpdateStudyBuddyLimit = (newLimit: StudyBuddyDailyLimit) => {
    setStudyBuddyLimit(newLimit);
    saveStoredStudyBuddyLimit(newLimit);
  };

  // Quiz completion handler
  const handleQuizCompleted = (result: QuizResult) => {
    const updatedHistory = [result, ...quizHistory];
    setQuizHistory(updatedHistory);
    saveStoredQuizHistory(updatedHistory);
    const updatedMistakes = getStoredMistakes();
    setMistakes(updatedMistakes);
    if (user) {
      syncQuizResult(user.uid, { ...result, userId: user.uid });
      updatedMistakes.forEach((m) => syncMistakeItem(user.uid, { ...m, userId: user.uid }));
    }
  };

  // Erase All Data handler for Account Management
  const handleEraseAllUserData = async () => {
    if (user) {
      await eraseAllUserFirestoreData(user.uid);
      const resetProfile: StudentProfile = {
        ...profile,
        subjects: [],
        targetExams: [],
        examDates: {},
        studyStreakDays: 0,
        lastActiveDate: new Date().toISOString().split('T')[0],
      };
      await syncUserProfile(resetProfile);
      setProfile(resetProfile);
      saveStoredProfile(resetProfile);
    } else {
      const resetProfile: StudentProfile = {
        ...profile,
        subjects: [],
        targetExams: [],
        examDates: {},
        studyStreakDays: 0,
      };
      setProfile(resetProfile);
      saveStoredProfile(resetProfile);
    }

    clearAllStoredUserData();
    setNotes([]);
    setMistakes([]);
    setTasks([]);
    setCountdowns([]);
    setQuizHistory([]);
    prevNotesRef.current = [];
    prevTasksRef.current = [];
    prevMistakesRef.current = [];
    prevCountdownsRef.current = [];
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

        {currentTab === 'account' && (
          <AccountManagement
            profile={profile}
            notes={notes}
            mistakes={mistakes}
            tasks={tasks}
            countdowns={countdowns}
            quizHistory={quizHistory}
            onSaveProfile={handleUpdateProfile}
            onEraseAllData={handleEraseAllUserData}
            onNavigateToStudy={() => setCurrentTab('study')}
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
