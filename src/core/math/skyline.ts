import { computeDiffusionRange, DEFAULT_SPEED_OF_SOUND, isPrime } from "../helpers";
import type { DiffusionRange, Sequence2D } from "../types/types";

/**
 * Generate Skyline sequence for 2D quadratic residue diffuser.
 *
 * Skyline diffusion uses a skyline pattern where each row has increasing
 * well depths to improve low-frequency response and aesthetic appeal.
 *
 * @param gridSize - Number of wells per row (must be prime)
 * @param modulus - The prime modulus for QRD calculation
 * @returns 2D sequence with skyline pattern
 */
export function generateSkylineSequence(gridSize: number, modulus: number): Sequence2D {
  const rows = [];

  // Generate skyline pattern for each row
  for (let i = 0; i < gridSize; i++) {
    const rowValues = [];

    // Each row has increasing offset to create skyline effect
    const rowOffset = (i * gridSize) % modulus;

    for (let j = 0; j < gridSize; j++) {
      // Calculate position with skyline offset
      const pos = ((i + j) * gridSize + rowOffset) % modulus;
      rowValues.push(pos);
    }

    rows.push(rowValues);
  }

  return {
    values: rows,
    modulus,
  };
}

/**
 * Compute depths for Skyline diffuser wells.
 *
 * @param sequence - The skyline 2D sequence
 * @param wavelength - Wavelength at design frequency
 * @param maxDepth - Maximum depth constraint (optional)
 * @returns Array of depth values for each well position
 */
export function computeSkylineDepths(
  sequence: Sequence2D,
  wavelength: number,
  gridSize: number,
  maxDepth?: number,
): number[][] {
  const depths = [];

  for (const row of sequence.values) {
    const rowDepths = row.map((v) => (v * wavelength) / gridSize);

    if (!maxDepth) {
      depths.push(rowDepths);
    } else {
      depths.push(rowDepths.map((d) => Math.min(d, maxDepth)));
    }
  }

  return depths;
}

/**
 * Compute Skyline diffuser geometry.
 *
 * @param gridSize - Number of wells per row (must be prime)
 * @param designFrequency - Target frequency for optimal diffusion
 * @param wellWidth - Width of each acoustic well
 * @param maxDepth - Maximum depth constraint (optional)
 * @param speedOfSound - Speed of sound in air (default 343 m/s at 20°C)
 */
export interface SkylineResult {
  sequence: Sequence2D;
  depths: number[][];
  wavelength: number;
  diffusion: DiffusionRange;
}

export function computeSkyline(
  gridSize: number,
  designFrequency: number,
  wellWidth: number,
  maxDepth?: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): SkylineResult {
  // Generate skyline sequence using QRD pattern
  const sequence = generateSkylineSequence(gridSize, gridSize);

  // Calculate wavelength at design frequency
  const wavelength = speedOfSound / designFrequency;

  // Compute depths for each well position
  const depths = computeSkylineDepths(sequence, wavelength, gridSize, maxDepth);

  // Calculate actual maximum depth used
  const flatDepths = depths.flat();
  const actualMaxDepth = Math.max(...flatDepths);

  // Compute diffusion range based on well dimensions
  const diffusion = computeDiffusionRange(wellWidth, actualMaxDepth, speedOfSound);

  return {
    sequence,
    depths,
    wavelength,
    diffusion,
  };
}

/**
 * Validate Skyline parameters.
 */
export function validateSkylineParams(params: {
  gridSize: number;
  wellWidth: number;
  frequency: number;
}): string[] {
  const errors: string[] = [];

  if (params.gridSize < 3) {
    errors.push("Grid size must be ≥ 3");
  }

  if (!isPrime(params.gridSize)) {
    errors.push(`Grid size ${params.gridSize} is not a prime number`);
  }

  if (params.wellWidth <= 0) {
    errors.push("Well width must be > 0");
  }

  if (params.frequency <= 0) {
    errors.push("Frequency must be > 0");
  }

  return errors;
}
