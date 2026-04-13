import { computeDiffusionRange, DEFAULT_SPEED_OF_SOUND } from "../helpers";
import type { DiffusionRange, Sequence1D, AbfusorResult } from "../types/types";

/**
 * Generate an Abfusor sequence based on a binary pattern.
 *
 * The Abfusor is a binary diffusion sequence where cells are either present (1) or absent (0).
 * Present cells use depthA, absent cells use depthB for acoustic diffusion calculations.
 *
 * @param pattern - Binary array of 0s and 1s defining the cell presence
 * @returns Sequence1D with values derived from the pattern
 */
function generateAbfusorSequence(pattern: number[]): Sequence1D {
  const values = Array.from({ length: pattern.length }, (_, i) => {
    if (pattern[i] === undefined || pattern[i] === null) {
      throw new Error("Pattern must contain defined values");
    }
    return pattern[i];
  });

  return {
    values,
    modulus: pattern.length,
  };
}

/**
 * Compute depths for each cell in the Abfusor sequence.
 *
 * Cells with value 1 (present) use depthA, cells with value 0 (absent) use depthB.
 * Depths are calculated based on the wavelength and cell position.
 *
 * @param sequence - The Abfusor sequence values
 * @param modulus - The length of the sequence
 * @param wavelength - Wavelength at design frequency
 * @param depthA - Depth for present cells (value 1)
 * @param depthB - Depth for absent cells (value 0)
 */
function computeAbfusorDepths(
  sequence: Sequence1D,
  modulus: number,
  wavelength: number,
  depthA: number,
  depthB: number,
): { depthsA: number[]; depthsB: number[] } {
  const depthsA = [];
  const depthsB = [];

  for (let i = 0; i < modulus; i++) {
    const value = sequence.values[i];
    if (value === undefined || value === null) {
      throw new Error("Sequence values must be defined");
    }

    if (value === 1) {
      depthsA.push((i * wavelength) / modulus + depthA);
    } else if (value === 0) {
      depthsB.push((i * wavelength) / modulus + depthB);
    }
  }

  return { depthsA, depthsB };
}

/**
 * Compute the diffusion range for an Abfusor sequence.
 *
 * The diffusion range is calculated based on the well width (derived from pattern length)
 * and the maximum depth used in the sequence.
 *
 * @param wellWidth - Width of each acoustic well (pattern length)
 * @param maxDepth - Maximum depth constraint
 * @param speedOfSound - Speed of sound in air (default 343 m/s at 20°C)
 */
function computeAbfusorDiffusionRange(
  wellWidth: number,
  maxDepth: number | null,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): DiffusionRange {
  if (maxDepth === null || maxDepth === undefined) {
    throw new Error("Max depth must be provided for diffusion range calculation");
  }

  return computeDiffusionRange(wellWidth, maxDepth, speedOfSound);
}

/**
 * Generate an Abfusor sequence with computed depths and diffusion range.
 *
 * This is the main function to create a complete Abfusor result including:
 * - The binary sequence values
 * - Depths for present cells (depthA)
 * - Depths for absent cells (depthB)
 * - Diffusion range based on well dimensions
 *
 * @param pattern - Binary array of 0s and 1s defining the cell presence
 * @param wavelength - Wavelength at design frequency
 * @param depthA - Depth for present cells (value 1)
 * @param depthB - Depth for absent cells (value 0)
 * @param speedOfSound - Speed of sound in air (default 343 m/s at 20°C)
 */
export function generateAbfusor(
  pattern: number[],
  wavelength: number,
  depthA: number,
  depthB: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): AbfusorResult {
  if (pattern.length === 0) {
    throw new Error("Pattern cannot be empty");
  }

  const sequence = generateAbfusorSequence(pattern);
  const modulus = pattern.length;

  const { depthsA, depthsB } = computeAbfusorDepths(sequence, modulus, wavelength, depthA, depthB);

  const maxDepth = Math.max(...depthsA, ...depthsB);
  const diffusionRange = computeAbfusorDiffusionRange(modulus, maxDepth, speedOfSound);

  return {
    sequence,
    depthsA,
    depthsB,
    diffusionRange,
  };
}

/**
 * Validate Abfusor results and provide feedback.
 */
export function validateAbfusorResults(result: AbfusorResult): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (result.sequence.values.some((v) => v !== 0 && v !== 1)) {
    errors.push("Sequence values must be binary (0 or 1)");
  }

  if (result.depthsA.length === 0 || result.depthsB.length === 0) {
    errors.push("At least one depth array must have values");
  }

  if (result.diffusionRange.minFrequency > result.diffusionRange.maxFrequency) {
    errors.push("Diffusion range is invalid: min frequency exceeds max frequency");
  }

  return { valid: errors.length === 0, errors };
}
