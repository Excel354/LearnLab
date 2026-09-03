export const AVATAR_PALETTE = [
  '#4F46E5', // Indigo
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#D97706', // Warm Amber
  '#E11D48', // Vibrant Rose
  '#7C3AED', // Deep Violet
  '#0891B2', // Cyan Teal
  '#DB2777', // Magenta Pink
  '#EA580C', // Orange
  '#0D9488', // Teal
];

/**
 * Returns a consistent yet randomized vibrant color for user avatars based on
 * a student's name, email, or a saved color preference.
 */
export function getAvatarColor(identifier?: string, fallbackSeed?: string): string {
  const seed = identifier || fallbackSeed || 'scholar';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

/**
 * Generates a purely random vibrant avatar color from the palette.
 */
export function getRandomAvatarColor(): string {
  const randomIndex = Math.floor(Math.random() * AVATAR_PALETTE.length);
  return AVATAR_PALETTE[randomIndex];
}
