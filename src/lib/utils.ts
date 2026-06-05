import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a UTC ISO date string to the user's local timezone.
 * Uses the browser's Intl API — safe to call only on the client.
 */
export function formatMatchTime(
  utcIso: string,
  userTimezone?: string,
  format: 'short' | 'full' = 'short'
): string {
  const tz = userTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const date = new Date(utcIso)

  if (format === 'full') {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: tz,
      timeZoneName: 'short',
    }).format(date)
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  }).format(date)
}

/**
 * Format a countdown duration in ms to a human-readable string.
 */
export function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Bloqueado'
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

/**
 * Return browser timezone or 'UTC' fallback.
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

/**
 * Get rank movement label.
 */
export function getRankMovement(current: number, previous: number | null): 'up' | 'down' | 'same' | 'new' {
  if (previous === null) return 'new'
  if (current < previous) return 'up'
  if (current > previous) return 'down'
  return 'same'
}

/**
 * Safe JSON parse with fallback.
 */
export function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Phase display label.
 */
export function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    group: 'Fase de Grupos',
    round_of_32: 'Ronda de 32',
    round_of_16: 'Octavos de Final',
    quarter_final: 'Cuartos de Final',
    semi_final: 'Semifinales',
    third_place: 'Tercer y Cuarto Lugar',
    final: 'Final',
  }
  return map[phase] ?? phase
}

/**
 * Haptic feedback (mobile, if available).
 */
export function haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns: Record<string, number[]> = {
      light: [10],
      medium: [20],
      heavy: [40],
    }
    navigator.vibrate(patterns[type])
  }
}
