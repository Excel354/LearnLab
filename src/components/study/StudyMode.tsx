import React, { useState, useRef, useEffect } from 'react';
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
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  Search,
  Plus,
  Camera,
  X,
  Eye,
  GripVertical,
  RefreshCw,
} from 'lucide-react';
import {
  StudyNote,
  StudentProfile,
  Flashcard,
  QuizQuestion,
  QuizResult,
  StudyResource,
  UploadedStudyFile,
} from '../../types';
import { SUBJECTS_BY_LEVEL } from '../../data/curriculumData';
import { addMistakeItem, saveStoredQuizResult } from '../../utils/storage';
import { formatMathPowerText } from '../../utils/mathFormat';

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
    'summary' | 'flashcards' | 'quiz' | 'guide' | 'checklist' | 'cheatsheet' | 'glossary'
  >('summary');

  // New Note Form State (File-First: Subject, Topic & Grade are optional metadata)
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newGradeLevel, setNewGradeLevel] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedStudyFile[]>([]);
  const [isDraggingOverDropzone, setIsDraggingOverDropzone] = useState(false);
  const [draggedPageIndex, setDraggedPageIndex] = useState<number | null>(null);
  const [dragOverPageIndex, setDragOverPageIndex] = useState<number | null>(null);
  const [previewFileModal, setPreviewFileModal] = useState<UploadedStudyFile | null>(null);
  const [showTopicReminderModal, setShowTopicReminderModal] = useState(false);
  const [pendingConsistencyWarning, setPendingConsistencyWarning] = useState<{
    note: StudyNote;
    warning: string;
    unrelatedTopics: string[];
  } | null>(null);

  // Camera Capture Modal State for Multi-Page Scanning
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoPreview, setCapturedPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const multiFileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

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

  // Attach active camera stream to <video> whenever stream or modal state updates
  useEffect(() => {
    if (isCameraModalOpen && cameraStream && !capturedPhotoPreview && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraModalOpen, cameraStream, capturedPhotoPreview]);

  // Ensure camera stream stops cleanly on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Helper: Optimize large images while preserving crisp handwriting/OCR readability
  const readFileAsStudyPage = (
    file: File,
    source: 'file' | 'camera' = 'file'
  ): Promise<UploadedStudyFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));

      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        const lowerName = file.name.toLowerCase();
        const isImage =
          file.type.startsWith('image/') ||
          /\.(png|jpe?g|webp|bmp|gif)$/i.test(lowerName);

        let finalBase64 = rawBase64;
        let finalType = file.type || 'application/octet-stream';

        // Compress very large images (> 1.5MB) gently so multi-page uploads stay fast & crisp
        if (isImage && file.size > 1.5 * 1024 * 1024) {
          try {
            const optimized = await new Promise<string>((imgResolve, imgReject) => {
              const img = new Image();
              img.onload = () => {
                const maxDim = 1800;
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                  if (width >= height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  imgReject(new Error('Canvas context unavailable'));
                  return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                imgResolve(canvas.toDataURL('image/jpeg', 0.86));
              };
              img.onerror = () => imgReject(new Error('Image decode skipped'));
              img.src = rawBase64;
            });
            finalBase64 = optimized;
            finalType = 'image/jpeg';
          } catch {
            // Fall back to original rawBase64 if browser cannot decode (e.g. HEIC)
          }
        }

        // Read text preview for .txt files
        let textPreview: string | undefined;
        if (file.type === 'text/plain' || lowerName.endsWith('.txt')) {
          try {
            textPreview = await file.text();
          } catch {
            textPreview = undefined;
          }
        }

        resolve({
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          type: finalType,
          size: file.size,
          base64: finalBase64,
          textPreview: textPreview ? textPreview.slice(0, 220) : undefined,
          source,
        });
      };

      reader.readAsDataURL(file);
    });
  };

  // Multi-File Upload Handler (PDF, Images, Camera Gallery, DOCX, DOC, TXT)
  const handleFilesAdded = async (
    fileList: FileList | File[] | null,
    source: 'file' | 'camera' = 'file'
  ) => {
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    const oversizedFiles: string[] = [];
    const validFiles: File[] = [];

    for (const file of filesArray) {
      if (file.size > 25 * 1024 * 1024) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    }

    if (oversizedFiles.length > 0) {
      setErrorMessage(
        `Some file(s) exceed the 25MB limit and were skipped: ${oversizedFiles.join(', ')}`
      );
    } else {
      setErrorMessage(null);
    }

    if (validFiles.length === 0) return;

    try {
      const processedPages = await Promise.all(
        validFiles.map((file) => readFileAsStudyPage(file, source))
      );

      setUploadedFiles((prev) => {
        const next = [...prev, ...processedPages];
        return next;
      });
    } catch (err: any) {
      console.error('Error reading uploaded files:', err);
      setErrorMessage(err?.message || 'Could not read one or more selected files.');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFilesAdded(e.target.files, 'file');
    e.target.value = '';
  };

  const handleNativeCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleFilesAdded(e.target.files, 'camera');
    e.target.value = '';
  };

  // Camera Scanner Controls
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const startStudyCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    setCapturedPhotoPreview(null);
    setIsCameraModalOpen(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1600 }, height: { ideal: 1200 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Study camera access error:', err);
      setCameraError(
        'Could not open live camera preview. Please allow camera permissions or use the "Take Photo with Device Camera" button below.'
      );
    }
  };

  const closeCameraModal = () => {
    stopCameraStream();
    setCapturedPhotoPreview(null);
    setCameraError(null);
    setIsCameraModalOpen(false);
  };

  const snapStudyPagePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedPhotoPreview(dataUrl);
      stopCameraStream();
    }
  };

  const saveCapturedPhotoPage = (andSnapAnother: boolean) => {
    if (!capturedPhotoPreview) return;
    const approxBytes = Math.round((capturedPhotoPreview.length * 3) / 4);
    const nextNumber = uploadedFiles.length + 1;
    const newPage: UploadedStudyFile = {
      id: `cam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: `Captured Page ${nextNumber}.jpg`,
      type: 'image/jpeg',
      size: approxBytes,
      base64: capturedPhotoPreview,
      source: 'camera',
    };
    setUploadedFiles((prev) => [...prev, newPage]);
    setErrorMessage(null);

    if (andSnapAnother) {
      setCapturedPhotoPreview(null);
      startStudyCamera(cameraFacing);
    } else {
      closeCameraModal();
    }
  };

  // Reorder & Remove Uploaded Pages
  const moveUploadedPage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= uploadedFiles.length) return;
    setUploadedFiles((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const removeUploadedPage = (id: string) => {
    setUploadedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePageDragStart = (index: number) => {
    setDraggedPageIndex(index);
  };

  const handlePageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverPageIndex !== index) {
      setDragOverPageIndex(index);
    }
  };

  const handlePageDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPageIndex === null || draggedPageIndex === targetIndex) {
      setDraggedPageIndex(null);
      setDragOverPageIndex(null);
      return;
    }
    setUploadedFiles((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(draggedPageIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setDraggedPageIndex(null);
    setDragOverPageIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Step 1 CTA: Validate & Show "One Topic at a Time!" Confirmation Popup
  const handleContinueClick = () => {
    if (!pastedText.trim() && uploadedFiles.length === 0) {
      setErrorMessage(
        'Please upload at least one study document, photo, or paste note text to continue.'
      );
      return;
    }
    setErrorMessage(null);
    setShowTopicReminderModal(true);
  };

  // Submit Note(s) for AI Processing (Multi-Page Unified Topic Architecture)
  const handleProcessNote = async () => {
    if (!pastedText.trim() && uploadedFiles.length === 0) {
      setErrorMessage('Please upload a study document, image, or paste note text to summarize.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        text: pastedText.trim(),
        subject: newSubject.trim() || undefined,
        gradeLevel: newGradeLevel.trim() || profile.grade || undefined,
        topic: newTopic.trim() || undefined,
        files: uploadedFiles.map((f) => ({
          fileData: f.base64,
          mimeType: f.type,
          fileName: f.name,
        })),
      };

      const response = await fetch('/api/ai/process-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to process study materials.');
      }

      // Extract subject, topic, and title from AI detection if not manually provided
      const finalSubject =
        newSubject.trim() ||
        data.detectedSubject ||
        data.resources?.detectedSubject ||
        profile.subjects[0] ||
        'General';
      const finalTopic =
        newTopic.trim() ||
        data.detectedTopic ||
        data.resources?.detectedTopic ||
        'Study Topic';
      const finalTitle =
        newTitle.trim() ||
        data.resources?.summary?.title ||
        (uploadedFiles.length === 1
          ? uploadedFiles[0].name.replace(/\.[^/.]+$/, '')
          : `${finalSubject}: ${finalTopic}`);

      const enrichedResources: StudyResource = {
        ...data.resources,
        isSingleTopicConsistent: data.isSingleTopicConsistent !== false,
        topicConsistencyWarning: data.topicConsistencyWarning || '',
        detectedUnrelatedTopics: data.detectedUnrelatedTopics || [],
      };

      const newNote: StudyNote = {
        id: `note-${Date.now()}`,
        userId: profile.id,
        title: finalTitle,
        subject: finalSubject,
        gradeLevel: (newGradeLevel.trim() as any) || profile.grade,
        educationLevel: profile.educationLevel,
        topic: finalTopic,
        detectedTopics: data.detectedTopics || data.resources?.detectedTopics,
        sourceFileType:
          uploadedFiles.length > 1
            ? `${uploadedFiles.length} PAGES`
            : uploadedFiles.length === 1
              ? uploadedFiles[0].name.split('.').pop()?.toUpperCase() || 'FILE'
              : 'TEXT',
        rawText:
          pastedText ||
          (uploadedFiles.length > 0
            ? `Processed from ${uploadedFiles.length} file(s): ${uploadedFiles
                .map((f, idx) => `Page ${idx + 1}: ${f.name}`)
                .join(', ')}`
            : ''),
        fileNames: uploadedFiles.length > 0 ? uploadedFiles.map((f) => f.name) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resources: enrichedResources,
      };

      // If AI detected unrelated topics across uploaded pages, warn the user before finalizing
      if (data.isSingleTopicConsistent === false && data.topicConsistencyWarning) {
        setPendingConsistencyWarning({
          note: newNote,
          warning: data.topicConsistencyWarning,
          unrelatedTopics: Array.isArray(data.detectedUnrelatedTopics)
            ? data.detectedUnrelatedTopics
            : [],
        });
        return;
      }

      const updated = [newNote, ...notes];
      onSaveNotes(updated);
      setSelectedNoteId(newNote.id);
      setIsCreatingNew(false);
      resetNewForm();
    } catch (err: any) {
      console.error('Error in handleProcessNote:', err);
      setErrorMessage(
        err.message ||
          'We could not process these study materials. Please ensure the files contain legible text or clear photos, or paste your notes directly.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetNewForm = () => {
    setNewTitle('');
    setNewSubject('');
    setNewTopic('');
    setNewGradeLevel('');
    setShowOptionalFields(false);
    setPastedText('');
    setUploadedFiles([]);
    setShowTopicReminderModal(false);
    setPendingConsistencyWarning(null);
    setPreviewFileModal(null);
    setErrorMessage(null);
    closeCameraModal();
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

      {/* NEW NOTE CREATION & MULTI-PAGE UPLOAD PANEL (FILE-FIRST ARCHITECTURE) */}
      {isCreatingNew && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-indigo-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>File-First Note Summarizer & Study Generator</span>
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold whitespace-nowrap">
                Document-Driven AI
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Upload or capture multiple pages of your notes, PDF slides, Word documents, textbook scans, or gallery photos for one topic. LearnLab combines all pages in order to generate unified summaries, flashcards, quizzes, and study guides.
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

          {/* Hidden Multi-File & Native Camera Inputs */}
          <input
            ref={multiFileInputRef}
            id="note-file-upload-input"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.doc,.docx,.txt"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={nativeCameraInputRef}
            id="note-native-camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleNativeCameraChange}
            className="hidden"
          />

          {/* PRIMARY STEP: Upload Multiple Pages/Files or Paste Notes */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                Step 1: Upload or Capture Study Pages (One Topic)
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Supports Multiple Images, Camera Captures, PDF, DOCX, DOC & TXT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Multi-File Dropzone + Camera Action */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingOverDropzone(true);
                }}
                onDragLeave={() => setIsDraggingOverDropzone(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setIsDraggingOverDropzone(false);
                  await handleFilesAdded(e.dataTransfer.files, 'file');
                }}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center ${
                  isDraggingOverDropzone
                    ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
                    : uploadedFiles.length > 0
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20'
                }`}
              >
                <UploadCloud
                  className={`w-9 h-9 mb-2 ${
                    uploadedFiles.length > 0 ? 'text-emerald-600' : 'text-indigo-500'
                  }`}
                />
                <p className="text-xs font-bold text-slate-800">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} ${
                        uploadedFiles.length === 1 ? 'Page / File' : 'Pages / Files'
                      } Selected`
                    : 'Upload PDF, Word (.docx), Photos or Handwritten Notes'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Select multiple photos/pages at once or capture pages one by one. Max 25MB per file.
                </p>

                <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                  <button
                    id="browse-multi-files-btn"
                    type="button"
                    onClick={() => multiFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shadow-xs transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>
                      {uploadedFiles.length > 0 ? 'Add More Files' : 'Select Files / Photos'}
                    </span>
                  </button>

                  <button
                    id="open-study-camera-btn"
                    type="button"
                    onClick={() => startStudyCamera('environment')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold shadow-xs transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture with Camera</span>
                  </button>
                </div>
              </div>

              {/* Paste Plain Text Area */}
              <div className="flex flex-col">
                <textarea
                  id="note-paste-text-input"
                  rows={5}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Or paste text directly from lecture slides, syllabus, or typed school notes here (optional if files are uploaded)..."
                  className="w-full h-full p-3.5 rounded-2xl border border-slate-300 text-xs font-medium text-slate-800 outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                ></textarea>
              </div>
            </div>

            {/* UPLOADED PAGES / FILES PREVIEW & REORDER QUEUE */}
            {uploadedFiles.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-bold">
                      {uploadedFiles.length}{' '}
                      {uploadedFiles.length === 1 ? 'Page Uploaded' : 'Pages Uploaded'}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      Combined in order into 1 study topic
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      id="add-more-files-queue-btn"
                      onClick={() => multiFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-bold text-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add More Pages</span>
                    </button>
                    <button
                      type="button"
                      id="add-camera-page-queue-btn"
                      onClick={() => startStudyCamera('environment')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-[11px] font-bold text-slate-700 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Snap Page</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Preview your pages below. Drag cards or use the arrows to arrange pages in the exact reading order (Page 1 to Page {uploadedFiles.length}).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {uploadedFiles.map((fileItem, index) => {
                    const isImage =
                      fileItem.type.startsWith('image/') ||
                      /\.(png|jpe?g|webp|heic|heif|bmp|gif)$/i.test(fileItem.name);
                    const isPdf =
                      fileItem.type === 'application/pdf' ||
                      fileItem.name.toLowerCase().endsWith('.pdf');
                    const isDragTarget =
                      dragOverPageIndex === index && draggedPageIndex !== index;

                    return (
                      <div
                        key={fileItem.id}
                        draggable
                        onDragStart={() => handlePageDragStart(index)}
                        onDragOver={(e) => handlePageDragOver(e, index)}
                        onDragLeave={() => setDragOverPageIndex(null)}
                        onDrop={(e) => handlePageDrop(e, index)}
                        onDragEnd={() => {
                          setDraggedPageIndex(null);
                          setDragOverPageIndex(null);
                        }}
                        className={`group relative rounded-2xl bg-white border p-3 transition-all flex flex-col gap-2.5 ${
                          isDragTarget
                            ? 'border-indigo-500 ring-2 ring-indigo-200 scale-[1.01]'
                            : draggedPageIndex === index
                              ? 'opacity-60 border-indigo-300'
                              : 'border-slate-200 hover:border-indigo-300 shadow-2xs'
                        }`}
                      >
                        {/* Top row: Page Order Badge + Drag Handle + Remove */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <GripVertical
                              className="w-3.5 h-3.5 text-slate-400 cursor-grab active:cursor-grabbing"
                              aria-hidden="true"
                            />
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-extrabold">
                              Page {index + 1}
                            </span>
                            {fileItem.source === 'camera' && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                                Camera
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeUploadedPage(fileItem.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title={`Remove Page ${index + 1}`}
                            aria-label={`Remove ${fileItem.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Preview Thumbnail / Document Card */}
                        {isImage ? (
                          <button
                            type="button"
                            onClick={() => setPreviewFileModal(fileItem)}
                            className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group/thumb text-left"
                            title="Click to inspect full page"
                          >
                            <img
                              src={fileItem.base64}
                              alt={`Page ${index + 1}: ${fileItem.name}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover/thumb:bg-slate-900/35 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover/thumb:opacity-100 transition-opacity px-2.5 py-1 rounded-lg bg-white/95 text-slate-900 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                                <Eye className="w-3 h-3" />
                                Preview
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="w-full h-32 rounded-xl bg-slate-50 border border-slate-200/80 p-3 flex flex-col justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isPdf
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold uppercase">
                                  {fileItem.name.split('.').pop() || 'DOC'}
                                </span>
                                <p className="text-[11px] font-bold text-slate-800 truncate mt-0.5">
                                  {fileItem.name}
                                </p>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                              {fileItem.textPreview
                                ? fileItem.textPreview
                                : isPdf
                                  ? 'PDF document ready for full multi-page analysis'
                                  : 'Study document ready for extraction'}
                            </p>
                          </div>
                        )}

                        {/* Filename + Reorder Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 truncate">
                              {fileItem.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatFileSize(fileItem.size)}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveUploadedPage(index, -1)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                index === 0
                                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                              }`}
                              title="Move Earlier"
                              aria-label={`Move ${fileItem.name} earlier`}
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={index === uploadedFiles.length - 1}
                              onClick={() => moveUploadedPage(index, 1)}
                              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                                index === uploadedFiles.length - 1
                                  ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                              }`}
                              title="Move Later"
                              aria-label={`Move ${fileItem.name} later`}
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECONDARY / OPTIONAL STEP: Optional information (Class, Subject, Topic) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              id="toggle-optional-fields-btn"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <span>{showOptionalFields ? '▼ Hide optional information' : '▶ Add optional information (Class, Subject, Topic)'}</span>
              <span className="text-[11px] font-normal text-slate-400">
                — AI automatically detects these if left blank
              </span>
            </button>

            {showOptionalFields && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                <p className="text-[11px] text-slate-500 font-medium">
                  <strong>Optional Context:</strong> If you choose to provide your Class, Subject, and Topic, LearnLab uses that information as additional context to calibrate depth, not as the primary source.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Subject (Optional)
                    </label>
                    <select
                      id="new-note-subject-select"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:border-indigo-500 outline-hidden"
                    >
                      <option value="">Auto-detect from file</option>
                      {(SUBJECTS_BY_LEVEL[profile.educationLevel] || []).map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Class / Grade (Optional)
                    </label>
                    <input
                      id="new-note-grade-input"
                      type="text"
                      value={newGradeLevel}
                      onChange={(e) => setNewGradeLevel(e.target.value)}
                      placeholder={`e.g. ${profile.grade || 'SS 3'}`}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Specific Topic (Optional)
                    </label>
                    <input
                      id="new-note-topic-input"
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Auto-detect from file"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Note Title (Optional)
                  </label>
                  <input
                    id="new-note-title-input"
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Defaults to document name or detected title"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Processing CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <p className="text-[11px] text-slate-400">
              {uploadedFiles.length > 0
                ? `${uploadedFiles.length} ${
                    uploadedFiles.length === 1 ? 'file/page' : 'files/pages'
                  } queued to combine into one complete study material.`
                : 'LearnLab generates summary, flashcards, quizzes & study guides strictly from your uploaded material.'}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                id="cancel-new-note-btn"
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  resetNewForm();
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                id="submit-process-notes-btn"
                type="button"
                disabled={isProcessing}
                onClick={handleContinueClick}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  isProcessing
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25 active:scale-98'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Combining & Analyzing Pages...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
                        {currentNote.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        {currentNote.gradeLevel} • {currentNote.topic}
                      </span>
                      {currentNote.fileNames && currentNote.fileNames.length > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-[10px] font-medium flex items-center gap-1"
                          title={currentNote.fileNames.join(' → ')}
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span>
                            {currentNote.fileNames.length === 1
                              ? `File: ${currentNote.fileNames[0]}`
                              : `${currentNote.fileNames.length} Pages Combined`}
                          </span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {currentNote.title}
                    </h2>
                    {currentNote.detectedTopics && currentNote.detectedTopics.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Analyzed Sections:</span>
                        {currentNote.detectedTopics.map((dt, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold">
                            {dt}
                          </span>
                        ))}
                      </div>
                    )}
                    {currentNote.resources?.isSingleTopicConsistent === false &&
                      currentNote.resources?.topicConsistencyWarning && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Topic Consistency Notice: </span>
                            <span>{currentNote.resources.topicConsistencyWarning}</span>
                          </div>
                        </div>
                      )}
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
                    { id: 'checklist', label: `Checklist (${currentNote.resources.revisionChecklist?.length || 0})` },
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
                                  ? formatMathPowerText(currentNote.resources.flashcards[currentCardIndex]?.answer)
                                  : formatMathPowerText(currentNote.resources.flashcards[currentCardIndex]?.question)}
                              </p>
                              {isCardFlipped && currentNote.resources.flashcards[currentCardIndex]?.explanation && (
                                <p className="text-xs text-blue-200 mt-3 font-normal max-w-lg mx-auto">
                                  {formatMathPowerText(currentNote.resources.flashcards[currentCardIndex].explanation)}
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
                              {formatMathPowerText(currentNote.resources.flashcards[currentCardIndex]?.question)}
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
                                  <span>{formatMathPowerText(currentNote.resources.flashcards[currentCardIndex]?.answer)}</span>
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
                                  {formatMathPowerText(q.question)}
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
                                      {formatMathPowerText(opt)}
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
                                  {idx + 1}. {formatMathPowerText(ans.question)}
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
                                    {formatMathPowerText(ans.selectedAnswer)}
                                  </span>
                                </p>
                                {!ans.isCorrect && (
                                  <p>
                                    <span className="font-semibold text-slate-500">Correct Answer: </span>
                                    <span className="text-emerald-700 font-bold">{formatMathPowerText(ans.correctAnswer)}</span>
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-200/50 text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-xl">
                                <span className="font-bold text-slate-800">Explanation: </span>
                                <span>{formatMathPowerText(ans.explanation)}</span>
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

                {/* 5. REVISION CHECKLIST */}
                {activeResourceTab === 'checklist' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                          Revision Mastery Checklist
                        </h4>
                        <p className="text-[11px] text-indigo-700 mt-0.5">
                          Concrete milestones extracted directly from your uploaded material.
                        </p>
                      </div>
                      <span className="text-xs font-bold text-indigo-700">
                        {currentNote.resources.revisionChecklist?.filter((c) => c.completed).length || 0} / {currentNote.resources.revisionChecklist?.length || 0} Completed
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentNote.resources.revisionChecklist?.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            const updatedNotes = notes.map((n) => {
                              if (n.id === currentNote.id) {
                                const newChecklist = [...(n.resources.revisionChecklist || [])];
                                newChecklist[idx] = {
                                  ...newChecklist[idx],
                                  completed: !newChecklist[idx].completed,
                                };
                                return {
                                  ...n,
                                  resources: { ...n.resources, revisionChecklist: newChecklist },
                                };
                              }
                              return n;
                            });
                            onSaveNotes(updatedNotes);
                          }}
                          className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center gap-3 cursor-pointer transition-all ${
                            item.completed
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through'
                              : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              item.completed
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300 bg-slate-50'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="flex-1">{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. CHEAT SHEET */}
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

      {/* 1. IMPORTANT TOPIC REMINDER POPUP ("One Topic at a Time!") */}
      {showTopicReminderModal && (
        <div
          id="topic-reminder-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  One Topic at a Time!
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Please ensure that the uploaded file(s) contain only ONE topic. If your topic covers multiple pages, you can upload all those pages together. LearnLab will combine them into one complete study material.
                </p>
              </div>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="px-3.5 py-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-indigo-900">
                  Ready to combine into 1 topic:
                </span>
                <span className="font-extrabold text-indigo-700">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'Page / File' : 'Pages / Files'}
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                id="topic-reminder-go-back-btn"
                type="button"
                onClick={() => setShowTopicReminderModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Go Back
              </button>
              <button
                id="topic-reminder-continue-btn"
                type="button"
                onClick={() => {
                  setShowTopicReminderModal(false);
                  handleProcessNote();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. AI UNRELATED TOPICS WARNING MODAL */}
      {pendingConsistencyWarning && (
        <div
          id="unrelated-topics-warning-modal"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Unrelated Topics Detected
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pendingConsistencyWarning.warning}
                </p>
              </div>
            </div>

            {pendingConsistencyWarning.unrelatedTopics.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Separate Topics Detected Across Pages:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {pendingConsistencyWarning.unrelatedTopics.map((topicName, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 text-[11px] font-bold"
                    >
                      {topicName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              For the clearest summaries, flashcards, and quizzes, we recommend going back and keeping only pages from one topic at a time.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-1">
              <button
                id="consistency-edit-pages-btn"
                type="button"
                onClick={() => setPendingConsistencyWarning(null)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                Go Back & Edit Pages
              </button>
              <button
                id="consistency-save-anyway-btn"
                type="button"
                onClick={() => {
                  const noteToSave = pendingConsistencyWarning.note;
                  const updated = [noteToSave, ...notes];
                  onSaveNotes(updated);
                  setSelectedNoteId(noteToSave.id);
                  setIsCreatingNew(false);
                  resetNewForm();
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Keep Combined Study Material Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MULTI-PAGE CAMERA CAPTURE MODAL */}
      {isCameraModalOpen && (
        <div
          id="study-camera-modal"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Capture Note Pages</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} page(s) added so far`
                    : 'Snap handwritten or printed pages in order'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCameraModal}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close camera"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {cameraError && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-2">
                  <p>{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      closeCameraModal();
                      nativeCameraInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold"
                  >
                    Take Photo with Device Camera
                  </button>
                </div>
              )}

              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] w-full flex items-center justify-center">
                {capturedPhotoPreview ? (
                  <img
                    src={capturedPhotoPreview}
                    alt="Captured note page preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {capturedPhotoPreview ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCapturedPhotoPreview(null);
                        startStudyCamera(cameraFacing);
                      }}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                      Retake
                    </button>
                    <button
                      id="camera-add-snap-next-btn"
                      type="button"
                      onClick={() => saveCapturedPhotoPage(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all"
                    >
                      Add & Snap Next Page
                    </button>
                    <button
                      id="camera-add-done-btn"
                      type="button"
                      onClick={() => saveCapturedPhotoPage(false)}
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                    >
                      Add & Done
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={closeCameraModal}
                      className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const nextFacing =
                          cameraFacing === 'environment' ? 'user' : 'environment';
                        setCameraFacing(nextFacing);
                        startStudyCamera(nextFacing);
                      }}
                      className="p-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                      title="Switch Camera"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      id="study-camera-snap-btn"
                      type="button"
                      disabled={!cameraStream}
                      onClick={snapStudyPagePhoto}
                      className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all ${
                        cameraStream
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20'
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>Snap Page</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FULL-PAGE IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewFileModal && (
        <div
          id="page-preview-lightbox-modal"
          onClick={() => setPreviewFileModal(null)}
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {previewFileModal.name}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {formatFileSize(previewFileModal.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFileModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={previewFileModal.base64}
                alt={previewFileModal.name}
                className="max-w-full max-h-[68vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
