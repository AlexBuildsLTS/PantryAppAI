/**
 * PROJECT CRADLE: AUTHENTICATION UTILS
 */

export const calculatePasswordStrength = (password: string) => {
  let score = 0;
  if (!password) return 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;
  return score;
};

export const getStrengthColor = (score: number) => {
  if (score <= 25) return '#FC8181'; // Red
  if (score <= 50) return '#F6AD55'; // Orange
  if (score <= 75) return '#4FD1C7'; // Primary Teal
  return '#9AE6B4'; // Success Sage
};

// CRITICAL FIX: Explicitly exporting this function for the Sign-Up validator
export const checkRequirements = (password: string) => ({
  length: password.length >= 8,
  symbol: /[^A-Za-z0-9]/.test(password),
  uppercase: /[A-Z]/.test(password)
});