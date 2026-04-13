import { computeDiffusionRange, DEFAULT_SPEED_OF_SOUND, frequencyToWavelength } from "../helpers";
import type { DiffusionRange, Sequence1D } from "../types/types";

export function generateQrdSequence(prime: number): Sequence1D {
  const values = Array.from({ length: prime }, (_, n) => (n * n) % prime);

  return {
    values,
    modulus: prime,
  };
}

export function computeQrdDepths(
  sequence: Sequence1D,
  wavelength: number,
  maxDepth?: number,
): number[] {
  const depths = sequence.values.map((v) => (v * wavelength) / (2 * sequence.modulus));

  if (!maxDepth) return depths;

  return depths.map((d) => Math.min(d, maxDepth));
}

export interface QrdResult {
  sequence: Sequence1D;
  depths: number[];
  wavelength: number;
  diffusion: DiffusionRange;
}

export function computeQrd(
  prime: number,
  designFrequency: number,
  wellWidth: number,
  maxDepth?: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND,
): QrdResult {
  const sequence = generateQrdSequence(prime);

  const wavelength = frequencyToWavelength(designFrequency, speedOfSound);

  const depths = computeQrdDepths(sequence, wavelength, maxDepth);

  const actualMaxDepth = Math.max(...depths);

  const diffusion = computeDiffusionRange(wellWidth, actualMaxDepth, speedOfSound);

  return {
    sequence,
    depths,
    wavelength,
    diffusion,
  };
}
