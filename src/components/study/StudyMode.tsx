import React, { useState, useRef } from 'react';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Trash2,
  Check,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Search,
  Plus,
} from 'lucide-react';
import {
  StudyNote,
  StudentProfile,
  Flashcard,
  QuizQuestion,
  QuizResult,
  StudyResource,
} from '../../types';
import { SUBJECTS_BY_LEVEL } from '../../data/curriculumData';
import { addMistakeItem, saveStoredQuizResult } from '../../utils/storage';

interface StudyModeProps {
  profile: StudentProfile;
  notes: StudyNote[];
  onSaveNotes: (notes: StudyNote[]) => void;
  onQuizCompleted?: (result: QuizResult) => void;
  onOpenStudyBuddy: (context?: string) => void;
}

export const StudyMode: React.FC<StudyModeProps> = ({
  profile,
  notes,
  onSaveNotes,
  onQuizCompleted,
  onOpenStudyBuddy,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes.length > 0 ? notes[0].id : null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [activeResourceTab, setActiveResourceTab] = useState<
    'summary' | 'flashcards' | 'quiz' | 'guide' | 'cheatsheet' | 'glossary'
  >('summary');

  // New Note Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(profile.subjects[0] || 'Biology');
  const [newTopic, setNewTopic] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState(profile.grade || 'SS 3');
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    base64: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audio Study Mode State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRate, setAudioRate] = useState<number>(1.0);
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Flashcards Study State
  const [flashcardMode, setFlashcardMode] = useState<'traditional' | 'active_recall'>('traditional');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [activeRecallInput, setActiveRecallInput] = useState('');
  const [activeRecallEvaluation, setActiveRecallEvaluation] = useState<{
    isCorrect: boolean;
    score: number;
    feedback: string;
  } | null>(null);
  const [isEvaluatingRecall, setIsEvaluatingRecall] = useState(false);

  // Quiz Taking State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // Editing State
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedOverview, setEditedOverview] = useState('');

  const currentNote = notes.find((n) => n.id === selectedNoteId);

  // File Upload Handler (PDF, Images, DOCX, Text)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        base64: base64,
      });
      if (!newTitle) {
        setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Note for AI Processing
  const handleProcessNote = async () => {
    if (!newSubject.trim() || !newTopic.trim()) {
      setErrorMessage('Please specify both the Subject and Topic for your notes.');
      return;
    }
    if (!pastedText.trim() && !selectedFile) {
      setErrorMessage('Please paste your study text or upload a document/image.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        text: pastedText,
        subject: newSubject,
        gradeLevel: newGradeLevel,
        topic: newTopic,
      };

      if (selectedFile) {
        payload.fileData = selectedFile.base64;
        payload.mimeType = selectedFile.type;
      }

      const response = await fetch('/api/ai/process-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process note materials.');
      }

      const newNote: StudyNote = {
        id: `note-${Date.now()}`,
        userId: profile.id,
        title: newTitle.trim() || `${newSubject}: ${newTopic}`,
        subject: newSubject,
        gradeLevel: newGradeLevel,
        educationLevel: profile.educationLevel,
        topic: newTopic,
        rawText: pastedText || `Processed from file: ${selectedFile?.name}`,
        fileNames: selectedFile ? [selectedFile.name] : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resources: data.resources,
      };

      const updated = [newNote, ...notes];
      onSaveNotes(updated);
      setSelectedNoteId(newNote.id);
      setIsCreatingNew(false);
      resetNewForm();
    } catch (err: any) {
      console.error('Error in handleProcessNote:', err);
      setErrorMessage(err.message || 'We could not process this document. Please try a clearer copy or paste the text directly.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetNewForm = () => {
    setNewTitle('');
    setNewTopic('');
    setPastedText('');
    setSelectedFile(null);
    setErrorMessage(null);
  };

  // Audio Study Mode: Read summary aloud using SpeechSynthesis
  const handleToggleAudio = () => {
    if (!synthRef.current || !currentNote) return;

    if (isPlayingAudio) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
      return;
    }

    synthRef.current.cancel();

    const summaryText = `${currentNote.resources.summary.title}. Overview: ${
      currentNote.resources.summary.overview
    }. Key Points: ${currentNote.resources.summary.keyPoints.join('. ')}.`;

    const utterance = new SpeechSynthesisUtterance(summaryText);
    utterance.rate = audioRate;
    utterance.lang = 'en-US';

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlayingAudio(true);
  };

  const handleStopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlayingAudio(false);
    }
  };

  // Active Recall Flashcard Evaluation
  const handleEvaluateActiveRecall = async () => {
    if (!currentNote || !activeRecallInput.trim()) return;
    const currentCard = currentNote.resources.flashcards[currentCardIndex];
    if (!currentCard) return;

    setIsEvaluatingRecall(true);
    try {
      const res = await fetch('/api/ai/evaluate-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentCard.question,
          modelAnswer: currentCard.answer,
          userAnswer: activeRecallInput,
          topic: currentCard.topic,
        }),
      });
      const data = await res.json();
      if (data.success && data.evaluation) {
        setActiveRecallEvaluation(data.evaluation);
      }
    } catch (e) {
      console.error('Recall eval failed', e);
    } finally {
      setIsEvaluatingRecall(false);
    }
  };

  // Submit Quiz (Evaluated AT THE END as mandated)
  const handleQuizSubmit = () => {
    if (!currentNote) return;
    const questions = currentNote.resources.quizzes;
    let score = 0;
    const answersDetailed: any[] = [];
    const weakTopicsSet = new Set<string>();
    const strongTopicsSet = new Set<string>();

    questions.forEach((q, idx) => {
      const selectedIndex = quizAnswers[q.id];
      const isCorrect = selectedIndex === q.correctOptionIndex;
      const selectedText = selectedIndex !== undefined ? q.options[selectedIndex] : 'Unanswered';

      if (isCorrect) {
        score += 1;
        strongTopicsSet.add(q.topic);
      } else {
        weakTopicsSet.add(q.topic);
        // Automatically save wrong question to Mistake Bank
        addMistakeItem({
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          userWrongAnswer: selectedText,
          explanation: q.explanation,
          subject: currentNote.subject,
          topic: q.topic,
          sourceType: q.sourceType || 'ai_generated',
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

    const percentage = Math.round((score / questions.length) * 100);
    const result: QuizResult = {
      id: `qres-${Date.now()}`,
      noteId: currentNote.id,
      subject: currentNote.subject,
      topic: currentNote.topic,
      title: `${currentNote.subject}: ${currentNote.topic} Quiz`,
      date: new Date().toISOString(),
      totalQuestions: questions.length,
      score,
      percentage,
      answers: answersDetailed,
      weakTopics: Array.from(weakTopicsSet),
      strongTopics: Array.from(strongTopicsSet),
      recommendedNextSteps:
        weakTopicsSet.size > 0
          ? [
              `Review flashcards on ${Array.from(weakTopicsSet).join(', ')}`,
              `Ask StudyBuddy AI to clarify concepts in your Mistake Bank`,
            ]
          : ['Excellent mastery! Proceed to timed ExamPrep past questions.'],
    };

    setQuizResult(result);
    setQuizSubmitted(true);
    saveStoredQuizResult(result);
    if (onQuizCompleted) onQuizCompleted(result);
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    if (!confirm('Are you sure you want to delete this study note?')) return;
    const filtered = notes.filter((n) => n.id !== id);
    onSaveNotes(filtered);
    if (selectedNoteId === id) {
      setSelectedNoteId(filtered.length > 0 ? filtered[0].id : null);
    }
  };

  // Save manual edit of overview
  const handleSaveSummaryEdit = () => {
    if (!currentNote) return;
    const updated = notes.map((n) => {
      if (n.id === currentNote.id) {
        return {
          ...n,
          resources: {
            ...n.resources,
            summary: {
              ...n.resources.summary,
              overview: editedOverview,
            },
          },
        };
      }
      return n;
    });
    onSaveNotes(updated);
    setIsEditingSummary(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-indigo-600 font-bold px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md">
              Study Mode
            </span>
            <span className="text-xs text-slate-400 font-medium">
              School Note Summarizer & Flashcard Generator
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            My Study Notes & Resources
          </h1>
        </div>

        <button
          id="create-new-note-btn"
          onClick={() => {
            setIsCreatingNew(!isCreatingNew);
            setErrorMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs ${
            isCreatingNew
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
          }`}
        >
          {isCreatingNew ? (
            <span>Close Uploader</span>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Upload / Add New Note</span>
            </>
          )}
        </button>
      </div>

      {/* NEW NOTE CREATION & OCR UPLOAD MODAL/PANEL */}
      {isCreatingNew && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>AI School Note Processing Pipeline</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload PDF, handwritten scans, Word docs, photos, or paste raw lecture notes. LearnLab will extract and build interconnected summaries, flashcards, and quizzes.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Explicit Inputs Section (Mandated in Section 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject *
              </label>
              <select
                id="new-note-subject-select"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden"
              >
                {(SUBJECTS_BY_LEVEL[profile.educationLevel] || []).map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Class / Grade Level *
              </label>
              <input
                id="new-note-grade-input"
                type="text"
                value={newGradeLevel}
                onChange={(e) => setNewGradeLevel(e.target.value)}
                placeholder="e.g. SS 3, JSS 2, 100L"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Specific Topic *
              </label>
              <input
                id="new-note-topic-input"
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="e.g. Current Electricity & Ohm's Law"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Note Title (Optional)
            </label>
            <input
              id="new-note-title-input"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Chapter 4: Electric Circuits and Resistance"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 outline-hidden"
            />
          </div>

          {/* File Upload / OCR Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Drag & Drop / Selection */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-500 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center relative">
              <input
                id="note-file-upload-input"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <UploadCloud className="w-10 h-10 text-blue-500 mb-2" />
              <p className="text-xs font-bold text-slate-800">
                {selectedFile ? selectedFile.name : 'Upload PDF, Image, Word doc or Handwritten Notes'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports OCR for handwritten student notes & lecture camera captures (up to 25MB).
              </p>
              {selectedFile && (
                <span className="mt-2 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  ✓ File ready for processing
                </span>
              )}
            </div>

            {/* Paste Plain Text Area */}
            <div>
              <textarea
                id="note-paste-text-input"
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Or paste text directly from lecture slides, syllabus, or typed school notes here..."
                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
              ></textarea>
            </div>
          </div>

          {/* Processing CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="cancel-new-note-btn"
              type="button"
              onClick={() => {
                setIsCreatingNew(false);
                resetNewForm();
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              id="submit-process-notes-btn"
              type="button"
              disabled={isProcessing}
              onClick={handleProcessNote}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                isProcessing
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Extracting & Generating Resources...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Process Notes with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MAIN STUDY INTERFACE: Notes List (Left) + Note Study Hub (Right) */}
      {notes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Study Notes Yet</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Upload your first lecture note, PDF, or textbook chapter above to generate level-adapted AI summaries, active recall flashcards, and quizzes.
          </p>
          <button
            onClick={() => setIsCreatingNew(true)}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md hover:bg-blue-700 transition-all"
          >
            Upload Notes Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Notes Selector (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                My Note Library ({notes.length})
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {notes.map((note) => {
                const isSelected = note.id === selectedNoteId;
                return (
                  <div
                    key={note.id}
                    id={`note-item-${note.id}`}
                    onClick={() => {
                      setSelectedNoteId(note.id);
                      setQuizSubmitted(false);
                      setQuizAnswers({});
                      setQuizResult(null);
                      setActiveRecallEvaluation(null);
                      setActiveRecallInput('');
                      handleStopAudio();
                    }}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                        {note.subject}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-2 leading-snug">
                      {note.title}
                    </h4>

                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      Topic: {note.topic}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{note.resources?.flashcards?.length || 0} Flashcards</span>
                      <span>{note.resources?.quizzes?.length || 0} Quiz Qs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: Active Study Hub (8 cols) */}
          {currentNote && (
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              {/* Note Header & Audio Study Mode Controls */}
              <div className="p-6 bg-slate-50/70 border-b border-slate-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        {currentNote.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {currentNote.gradeLevel} • {currentNote.topic}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {currentNote.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Ask StudyBuddy with note context */}
                    <button
                      id="ask-studybuddy-note-context-btn"
                      onClick={() =>
                        onOpenStudyBuddy(
                          `Note on ${currentNote.subject} (${currentNote.topic}): ${currentNote.resources.summary.overview}`
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Ask StudyBuddy</span>
                    </button>

                    <button
                      id="delete-current-note-btn"
                      onClick={() => handleDeleteNote(currentNote.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audio Study Mode Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isPlayingAudio ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                      {isPlayingAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800">Audio Study Mode</span>
                      <p className="text-[10px] text-slate-400">Listen to AI Summary read aloud</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speed Controls */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[10px] font-bold text-slate-600">
                      {[0.75, 1.0, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            setAudioRate(rate);
                            if (isPlayingAudio) {
                              handleStopAudio();
                              setTimeout(handleToggleAudio, 100);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md ${audioRate === rate ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'hover:text-slate-900'}`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <button
                      id="toggle-audio-study-btn"
                      onClick={handleToggleAudio}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all shadow-md ${isPlayingAudio ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'}`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Read Aloud</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Resource Navigation Tabs */}
                <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pt-2">
                  {[
                    { id: 'summary', label: 'AI Summary' },
                    { id: 'flashcards', label: `Flashcards (${currentNote.resources.flashcards.length})` },
                    { id: 'quiz', label: `Quiz (${currentNote.resources.quizzes.length})` },
                    { id: 'guide', label: 'Study Guide' },
                    { id: 'cheatsheet', label: 'Cheat Sheet' },
                    { id: 'glossary', label: 'Glossary' },
                  ].map((tab) => {
                    const isActive = activeResourceTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        id={`study-tab-${tab.id}`}
                        onClick={() => setActiveResourceTab(tab.id as any)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Resource Content Area */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* 1. AI SUMMARY VIEW */}
                {activeResourceTab === 'summary' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Header + Manual Edit button */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        {currentNote.resources.summary.title}
                      </h3>
                      <button
                        id="edit-summary-btn"
                        onClick={() => {
                          setEditedOverview(currentNote.resources.summary.overview);
                          setIsEditingSummary(!isEditingSummary);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingSummary ? 'Cancel Edit' : 'Edit Summary'}</span>
                      </button>
                    </div>

                    {/* Overview Content / Edit Form */}
                    {isEditingSummary ? (
                      <div className="space-y-3">
                        <textarea
                          id="edit-summary-textarea"
                          rows={4}
                          value={editedOverview}
                          onChange={(e) => setEditedOverview(e.target.value)}
                          className="w-full p-3.5 rounded-2xl border border-blue-300 text-xs font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                          id="save-summary-edit-btn"
                          onClick={handleSaveSummaryEdit}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
                        >
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-slate-700 leading-relaxed font-medium">
                        {currentNote.resources.summary.overview}
                      </div>
                    )}

                    {/* High-Yield Key Points */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        High-Yield Key Points
                      </h4>
                      <div className="grid grid-cols-1 gap-2.5">
                        {currentNote.resources.summary.keyPoints.map((kp, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 flex items-start gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{kp}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Important Concepts & Explanations */}
                    {currentNote.resources.summary.importantConcepts?.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Important Concepts
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {currentNote.resources.summary.importantConcepts.map((ic, idx) => (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 text-xs space-y-1"
                            >
                              <span className="font-bold text-emerald-950 block">
                                {ic.concept}
                              </span>
                              <p className="text-slate-600 leading-relaxed">
                                {ic.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. FLASHCARDS (Traditional + Active Recall Modes) */}
                {activeResourceTab === 'flashcards' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {/* Mode Selector Pill */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
                        <button
                          id="flashcard-mode-traditional-btn"
                          onClick={() => setFlashcardMode('traditional')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            flashcardMode === 'traditional'
                              ? 'bg-white text-blue-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Traditional Flip
                        </button>
                        <button
                          id="flashcard-mode-active-recall-btn"
                          onClick={() => setFlashcardMode('active_recall')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            flashcardMode === 'active_recall'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          ⚡ Active Recall (AI Grading)
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-500">
                        Card {currentCardIndex + 1} of {currentNote.resources.flashcards.length}
                      </span>
                    </div>

                    {/* FLASHCARD DISPLAY */}
                    {currentNote.resources.flashcards.length > 0 && (
                      <div className="space-y-4">
                        {flashcardMode === 'traditional' ? (
                          /* TRADITIONAL FLIP CARD */
                          <div
                            id="traditional-flashcard"
                            onClick={() => setIsCardFlipped(!isCardFlipped)}
                            className={`min-h-[220px] rounded-3xl p-8 border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between select-none ${
                              isCardFlipped
                                ? 'bg-blue-900 text-white border-blue-800 shadow-xl'
                                : 'bg-slate-50 text-slate-900 border-slate-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                              <span className={isCardFlipped ? 'text-blue-300' : 'text-slate-400'}>
                                {isCardFlipped ? 'Answer' : 'Question'}
                              </span>
                              <span className={isCardFlipped ? 'text-blue-300' : 'text-blue-600'}>
                                Click to Flip ↷
                              </span>
                            </div>

                            <div className="my-auto text-center py-4">
                              <p className="text-base sm:text-lg font-bold leading-relaxed">
                                {isCardFlipped
                                  ? currentNote.resources.flashcards[currentCardIndex]?.answer
                                  : currentNote.resources.flashcards[currentCardIndex]?.question}
                              </p>
                              {isCardFlipped && currentNote.resources.flashcards[currentCardIndex]?.explanation && (
                                <p className="text-xs text-blue-200 mt-3 font-normal max-w-lg mx-auto">
                                  {currentNote.resources.flashcards[currentCardIndex].explanation}
                                </p>
                              )}
                            </div>

                            <div className="text-[11px] font-semibold text-center opacity-60">
                              Topic: {currentNote.resources.flashcards[currentCardIndex]?.topic}
                            </div>
                          </div>
                        ) : (
                          /* ACTIVE RECALL MODE (Type answer & AI evaluates) */
                          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                                Active Recall Challenge
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                Topic: {currentNote.resources.flashcards[currentCardIndex]?.topic}
                              </span>
                            </div>

                            <div className="p-4 bg-white rounded-2xl border border-slate-200 font-bold text-slate-900 text-sm sm:text-base">
                              {currentNote.resources.flashcards[currentCardIndex]?.question}
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Type your answer from memory:
                              </label>
                              <textarea
                                id="active-recall-input"
                                rows={3}
                                value={activeRecallInput}
                                onChange={(e) => setActiveRecallInput(e.target.value)}
                                placeholder="Type what you remember before revealing the answer..."
                                className="w-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-none bg-white"
                              />
                            </div>

                            <button
                              id="evaluate-recall-btn"
                              disabled={isEvaluatingRecall || !activeRecallInput.trim()}
                              onClick={handleEvaluateActiveRecall}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs ${
                                isEvaluatingRecall || !activeRecallInput.trim()
                                  ? 'bg-slate-300 cursor-not-allowed'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {isEvaluatingRecall ? 'Evaluating Understanding...' : 'Evaluate My Answer with AI'}
                            </button>

                            {/* Active Recall Result Card */}
                            {activeRecallEvaluation && (
                              <div
                                className={`p-4 rounded-2xl border animate-in fade-in duration-200 space-y-2 ${
                                  activeRecallEvaluation.isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                    : 'bg-amber-50 border-amber-200 text-amber-950'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold">
                                    {activeRecallEvaluation.isCorrect
                                      ? '✓ Correct Conceptual Understanding'
                                      : '⚠️ Developing Concept'}
                                  </span>
                                  <span className="text-xs font-black">
                                    Score: {activeRecallEvaluation.score}%
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed">
                                  {activeRecallEvaluation.feedback}
                                </p>
                                <div className="pt-2 border-t border-slate-200/50 text-[11px] text-slate-600">
                                  <span className="font-bold">Model Answer: </span>
                                  <span>{currentNote.resources.flashcards[currentCardIndex]?.answer}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Flashcard Navigation */}
                        <div className="flex items-center justify-between pt-2">
                          <button
                            id="prev-flashcard-btn"
                            disabled={currentCardIndex === 0}
                            onClick={() => {
                              setCurrentCardIndex((c) => Math.max(0, c - 1));
                              setIsCardFlipped(false);
                              setActiveRecallEvaluation(null);
                              setActiveRecallInput('');
                            }}
                            className={`px-4 py-2 rounded-xl border text-xs font-bold ${
                              currentCardIndex === 0
                                ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            Previous Card
                          </button>

                          <button
                            id="next-flashcard-btn"
                            disabled={currentCardIndex === currentNote.resources.flashcards.length - 1}
                            onClick={() => {
                              setCurrentCardIndex((c) =>
                                Math.min(currentNote.resources.flashcards.length - 1, c + 1)
                              );
                              setIsCardFlipped(false);
                              setActiveRecallEvaluation(null);
                              setActiveRecallInput('');
                            }}
                            className={`px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold ${
                              currentCardIndex === currentNote.resources.flashcards.length - 1
                                ? 'opacity-50 cursor-not-allowed'
                                : ''
                            }`}
                          >
                            Next Card →
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. QUIZ VIEW (Results at the end; wrong questions synced to Mistake Bank) */}
                {activeResourceTab === 'quiz' && (
                  <div className="space-y-6 animate-in fade-in duration-150">
                    {!quizSubmitted ? (
                      /* Taking Quiz */
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              Diagnostic Quiz: {currentNote.topic}
                            </h3>
                            <p className="text-[11px] text-slate-500">
                              Complete all questions. Comprehensive evaluation & explanations appear at the end.
                            </p>
                          </div>
                          <span className="text-xs font-bold text-blue-600">
                            {Object.keys(quizAnswers).length}/{currentNote.resources.quizzes.length} answered
                          </span>
                        </div>

                        <div className="space-y-6">
                          {currentNote.resources.quizzes.map((q, qIdx) => (
                            <div
                              key={q.id}
                              className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
                            >
                              <div className="flex items-start gap-2">
                                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                                  {q.question}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 gap-2 pt-1">
                                {q.options.map((opt, optIdx) => {
                                  const isSelected = quizAnswers[q.id] === optIdx;
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() =>
                                        setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })
                                      }
                                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                                        isSelected
                                          ? 'border-blue-600 bg-blue-50/90 text-blue-900 ring-1 ring-blue-500/20 font-bold'
                                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          id="submit-note-quiz-btn"
                          onClick={handleQuizSubmit}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all text-center"
                        >
                          Submit Quiz for Results
                        </button>
                      </div>
                    ) : (
                      /* QUIZ RESULTS VIEW */
                      <div className="space-y-6 animate-in fade-in duration-200">
                        {/* Score Overview Banner */}
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                              Quiz Evaluation Complete
                            </span>
                            <h3 className="text-2xl font-black text-white mt-1">
                              Score: {quizResult?.score} / {quizResult?.totalQuestions} ({quizResult?.percentage}%)
                            </h3>
                            <p className="text-xs text-blue-100/80 mt-1">
                              {quizResult && quizResult.percentage >= 75
                                ? 'Outstanding! High conceptual mastery demonstrated.'
                                : 'Good effort! Incorrect questions have been automatically added to your Mistake Bank for review.'}
                            </p>
                          </div>

                          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-2xl text-emerald-300 border border-white/20">
                            {quizResult?.percentage}%
                          </div>
                        </div>

                        {/* Weak Areas Section (Mandated in Section 14) */}
                        {quizResult?.weakTopics && quizResult.weakTopics.length > 0 && (
                          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                              <span>Detected Weak Areas:</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {quizResult.weakTopics.map((wt, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs"
                                >
                                  {wt}
                                </span>
                              ))}
                            </div>
                            <p className="text-[11px] text-amber-800 mt-1">
                              These questions have been saved to your Mistake Bank. Practice them to solidify understanding.
                            </p>
                          </div>
                        )}

                        {/* Question-by-Question Review with Explanations */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Detailed Question Review & Explanations
                          </h4>
                          {quizResult?.answers.map((ans, idx) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border space-y-2 ${
                                ans.isCorrect
                                  ? 'bg-emerald-50/40 border-emerald-200'
                                  : 'bg-rose-50/40 border-rose-200'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {idx + 1}. {ans.question}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    ans.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {ans.isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              </div>

                              <div className="text-xs text-slate-700 space-y-1">
                                <p>
                                  <span className="font-semibold text-slate-500">Your Answer: </span>
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

                              <div className="pt-2 border-t border-slate-200/50 text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl">
                                <span className="font-bold text-slate-800">Explanation: </span>
                                <span>{ans.explanation}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          id="retake-quiz-reset-btn"
                          onClick={() => {
                            setQuizSubmitted(false);
                            setQuizAnswers({});
                          }}
                          className="w-full py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                        >
                          Review Note & Flashcards Again
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. STUDY GUIDE (Markdown) */}
                {activeResourceTab === 'guide' && (
                  <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4 animate-in fade-in duration-150">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 whitespace-pre-wrap font-mono text-xs text-slate-800">
                      {currentNote.resources.studyGuideMarkdown}
                    </div>
                  </div>
                )}

                {/* 5. CHEAT SHEET */}
                {activeResourceTab === 'cheatsheet' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                    {currentNote.resources.cheatSheet?.map((cs, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                      >
                        <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          {cs.category}
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-700">
                          {cs.content.map((item, itemIdx) => (
                            <li key={itemIdx} className="flex items-start gap-2">
                              <span className="text-emerald-500 font-black">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. GLOSSARY */}
                {activeResourceTab === 'glossary' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                    {currentNote.resources.glossary?.map((g, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1"
                      >
                        <h4 className="text-xs font-bold text-slate-900">{g.term}</h4>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {g.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
