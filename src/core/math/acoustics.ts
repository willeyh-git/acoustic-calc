import type { Sequence1D } from "../types/types";

export function scaleDepths(sequence: Sequence1D, wavelength: number, maxDepth?: number): number[] {
  const depths = sequence.values.map((v) => (v * wavelength) / (2 * sequence.modulus));

  if (!maxDepth) return depths;

  return depths.map((d) => Math.min(d, maxDepth));
}
