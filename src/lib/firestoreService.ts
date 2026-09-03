import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  Unsubscribe,
  getDocs,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';
import {
  StudentProfile,
  StudyNote,
  StudyPlannerTask,
  MistakeItem,
  ExamCountdownItem,
  QuizResult,
} from '../types';

/**
 * Recursively cleans any payload before saving to Firestore:
 * - Strips any object keys whose value is `undefined` (which Firestore setDoc/updateDoc strictly rejects)
 * - Retains Firestore FieldValues (such as deleteField() or serverTimestamp())
 * - Retains Dates, primitives, and recursively cleans Arrays and Objects
 */
export function cleanFirestorePayload<T = any>(obj: any): T {
  if (obj === undefined) {
    return undefined as unknown as T;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  // Preserve Date instances
  if (obj instanceof Date) {
    return obj as unknown as T;
  }
  // Preserve Firestore FieldValue instances (deleteField, serverTimestamp, etc.)
  if (
    typeof (obj as any).isEqual === 'function' ||
    (obj as any)._methodName !== undefined ||
    obj.constructor?.name === 'FieldValue'
  ) {
    return obj;
  }
  // Sanitize Arrays
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestorePayload(item)) as unknown as T;
  }
  // Sanitize standard objects
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = cleanFirestorePayload(value);
    }
  }
  return result as T;
}

/**
 * Save or update student profile in Firestore
 */
export async function syncUserProfile(profile: StudentProfile): Promise<void> {
  if (!profile.id) return;
  const path = `users/${profile.id}`;
  try {
    const docRef = doc(db, 'users', profile.id);
    const dataToSave: Record<string, any> = {
      ...profile,
      updatedAt: new Date().toISOString(),
    };

    // If photoURL is falsy or undefined, use deleteField() so Firestore deletes or omits the key cleanly
    if (!profile.photoURL) {
      dataToSave.photoURL = deleteField();
    }

    const cleaned = cleanFirestorePayload(dataToSave);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Save or update a study note in Firestore
 */
export async function syncStudyNote(userId: string, note: StudyNote): Promise<void> {
  if (!userId || !note.id) return;
  const path = `users/${userId}/notes/${note.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'notes', note.id);
    const cleaned = cleanFirestorePayload({
      ...note,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a study note from Firestore
 */
export async function deleteStudyNoteFromFirestore(userId: string, noteId: string): Promise<void> {
  if (!userId || !noteId) return;
  const path = `users/${userId}/notes/${noteId}`;
  try {
    const docRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update a study task in Firestore
 */
export async function syncPlannerTask(userId: string, task: StudyPlannerTask): Promise<void> {
  if (!userId || !task.id) return;
  const path = `users/${userId}/tasks/${task.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'tasks', task.id);
    const cleaned = cleanFirestorePayload({
      ...task,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a study task from Firestore
 */
export async function deletePlannerTaskFromFirestore(userId: string, taskId: string): Promise<void> {
  if (!userId || !taskId) return;
  const path = `users/${userId}/tasks/${taskId}`;
  try {
    const docRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update a mistake item in Firestore
 */
export async function syncMistakeItem(userId: string, mistake: MistakeItem): Promise<void> {
  if (!userId || !mistake.id) return;
  const path = `users/${userId}/mistakes/${mistake.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'mistakes', mistake.id);
    const cleaned = cleanFirestorePayload({
      ...mistake,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete a mistake item from Firestore
 */
export async function deleteMistakeFromFirestore(userId: string, mistakeId: string): Promise<void> {
  if (!userId || !mistakeId) return;
  const path = `users/${userId}/mistakes/${mistakeId}`;
  try {
    const docRef = doc(db, 'users', userId, 'mistakes', mistakeId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save or update an exam countdown item in Firestore
 */
export async function syncCountdownItem(userId: string, countdown: ExamCountdownItem): Promise<void> {
  if (!userId || !countdown.id) return;
  const path = `users/${userId}/countdowns/${countdown.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'countdowns', countdown.id);
    const cleaned = cleanFirestorePayload({
      ...countdown,
      userId,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete an exam countdown from Firestore
 */
export async function deleteCountdownFromFirestore(userId: string, countdownId: string): Promise<void> {
  if (!userId || !countdownId) return;
  const path = `users/${userId}/countdowns/${countdownId}`;
  try {
    const docRef = doc(db, 'users', userId, 'countdowns', countdownId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save a completed quiz result to Firestore
 */
export async function syncQuizResult(userId: string, quizResult: QuizResult): Promise<void> {
  if (!userId || !quizResult.id) return;
  const path = `users/${userId}/quizHistory/${quizResult.id}`;
  try {
    const docRef = doc(db, 'users', userId, 'quizHistory', quizResult.id);
    const cleaned = cleanFirestorePayload({
      ...quizResult,
      userId,
      createdAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to all user data collections in real time
 */
export function subscribeToUserData(
  userId: string,
  callbacks: {
    onProfile?: (profile: StudentProfile) => void;
    onNotes?: (notes: StudyNote[]) => void;
    onTasks?: (tasks: StudyPlannerTask[]) => void;
    onMistakes?: (mistakes: MistakeItem[]) => void;
    onCountdowns?: (countdowns: ExamCountdownItem[]) => void;
    onQuizHistory?: (history: QuizResult[]) => void;
  }
): () => void {
  const unsubscribes: Unsubscribe[] = [];

  // Profile listener
  if (callbacks.onProfile) {
    const profilePath = `users/${userId}`;
    const unsubProfile = onSnapshot(
      doc(db, 'users', userId),
      (snap) => {
        if (snap.exists()) {
          callbacks.onProfile?.(snap.data() as StudentProfile);
        } else {
          callbacks.onProfile?.(null as any);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, profilePath);
      }
    );
    unsubscribes.push(unsubProfile);
  }

  // Notes listener
  if (callbacks.onNotes) {
    const notesPath = `users/${userId}/notes`;
    const unsubNotes = onSnapshot(
      collection(db, 'users', userId, 'notes'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as StudyNote);
        callbacks.onNotes?.(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, notesPath);
      }
    );
    unsubscribes.push(unsubNotes);
  }

  // Tasks listener
  if (callbacks.onTasks) {
    const tasksPath = `users/${userId}/tasks`;
    const unsubTasks = onSnapshot(
      collection(db, 'users', userId, 'tasks'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as StudyPlannerTask);
        callbacks.onTasks?.(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, tasksPath);
      }
    );
    unsubscribes.push(unsubTasks);
  }

  // Mistakes listener
  if (callbacks.onMistakes) {
    const mistakesPath = `users/${userId}/mistakes`;
    const unsubMistakes = onSnapshot(
      collection(db, 'users', userId, 'mistakes'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as MistakeItem);
        callbacks.onMistakes?.(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, mistakesPath);
      }
    );
    unsubscribes.push(unsubMistakes);
  }

  // Countdowns listener
  if (callbacks.onCountdowns) {
    const countdownsPath = `users/${userId}/countdowns`;
    const unsubCountdowns = onSnapshot(
      collection(db, 'users', userId, 'countdowns'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as ExamCountdownItem);
        callbacks.onCountdowns?.(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, countdownsPath);
      }
    );
    unsubscribes.push(unsubCountdowns);
  }

  // Quiz History listener
  if (callbacks.onQuizHistory) {
    const quizPath = `users/${userId}/quizHistory`;
    const unsubQuiz = onSnapshot(
      collection(db, 'users', userId, 'quizHistory'),
      (snap) => {
        const items = snap.docs.map((d) => d.data() as QuizResult);
        callbacks.onQuizHistory?.(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, quizPath);
      }
    );
    unsubscribes.push(unsubQuiz);
  }

  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

/**
 * Permanently erase all user-specific data from Firestore
 * Scoped strictly to the authenticated user's ID
 * Removes notes, tasks, mistakes, countdowns, and quizHistory collections
 */
export async function eraseAllUserFirestoreData(userId: string): Promise<void> {
  if (!userId) return;
  const subcollections = ['notes', 'tasks', 'mistakes', 'countdowns', 'quizHistory'];

  for (const subcol of subcollections) {
    const colPath = `users/${userId}/${subcol}`;
    try {
      const colRef = collection(db, 'users', userId, subcol);
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, colPath);
      throw error;
    }
  }
}

