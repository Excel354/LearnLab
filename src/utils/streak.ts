import { StudentProfile } from '../types';

/**
 * Returns today's calendar date in local timezone formatted as YYYY-MM-DD.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the difference in full calendar days between two YYYY-MM-DD date strings.
 * Returns >0 if currentDateStr is after lastDateStr.
 * Returns 0 if they are on the same calendar day.
 * Returns 1 if currentDateStr is exactly the day after lastDateStr.
 */
export function calculateConsecutiveDaysDifference(
  lastDateStr: string,
  currentDateStr: string
): number {
  if (!lastDateStr || !currentDateStr) return -1;
  const [y1, m1, d1] = lastDateStr.split('-').map(Number);
  const [y2, m2, d2] = currentDateStr.split('-').map(Number);
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return -1;
  }
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utc2 - utc1) / msPerDay);
}

/**
 * Updates a student profile's streak based strictly on consecutive daily logins.
 * 
 * Rules:
 * 1. If this is the user's first login or streak was 0: streak becomes 1.
 * 2. If the user already logged in today (difference = 0 days): streak does not increment.
 * 3. If the user logged in yesterday (difference = 1 day): streak increments by 1.
 * 4. If the user missed one or more days (difference > 1 day): streak resets to 1 (active for today).
 */
export function updateLoginStreak(profile: StudentProfile): {
  updatedProfile: StudentProfile;
  streakChanged: boolean;
} {
  const todayStr = getLocalDateString();
  const lastDate = profile.lastActiveDate;
  const currentStreak = typeof profile.studyStreakDays === 'number' ? profile.studyStreakDays : 0;

  // Case 1: First login recorded, or previous streak was 0
  if (!lastDate || currentStreak === 0) {
    const updatedProfile: StudentProfile = {
      ...profile,
      studyStreakDays: 1,
      lastActiveDate: todayStr,
    };
    return {
      updatedProfile,
      streakChanged: currentStreak !== 1 || lastDate !== todayStr,
    };
  }

  const diff = calculateConsecutiveDaysDifference(lastDate, todayStr);

  // Case 2: Already logged in today
  if (diff === 0) {
    // Keep current streak intact, ensure today's date is recorded
    return {
      updatedProfile: {
        ...profile,
        lastActiveDate: todayStr,
      },
      streakChanged: false,
    };
  }

  // Case 3: Logged in yesterday (consecutive day)
  if (diff === 1) {
    const newStreak = currentStreak + 1;
    return {
      updatedProfile: {
        ...profile,
        studyStreakDays: newStreak,
        lastActiveDate: todayStr,
      },
      streakChanged: true,
    };
  }

  // Case 4: Missed 1 or more days (broken streak) or clock change
  return {
    updatedProfile: {
      ...profile,
      studyStreakDays: 1,
      lastActiveDate: todayStr,
    },
    streakChanged: true,
  };
}
