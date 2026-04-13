import type { DiffusionRange } from "./types/types";

export const DEFAULT_SPEED_OF_SOUND: number = 343; // ms (air) at 20c

export function frequencyToWavelength(
  frequency: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): number {
  return speedOfSound / frequency;
}

export function computeDiffusionRange(
  wellWidth: number,
  maxDepth: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): DiffusionRange {
  const maxFrequency = speedOfSound / (2 * wellWidth);
  const minFrequency = speedOfSound / (2 * maxDepth);

  return {
    minFrequency,
    maxFrequency,
  };
}

export function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export function validateQrdParams(prime: number, wellWidth: number, frequency: number): string[] {
  const errors: string[] = [];

  if (!isPrime(prime)) errors.push("Prime number must be a prime");
  if (prime < 3) errors.push("Prime must be ≥ 3");
  if (wellWidth <= 0) errors.push("Well width must be > 0");
  if (frequency <= 0) errors.push("Frequency must be > 0");

  return errors;
}
