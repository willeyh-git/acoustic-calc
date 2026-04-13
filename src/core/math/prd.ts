import {
	computeDiffusionRange,
	DEFAULT_SPEED_OF_SOUND,
	frequencyToWavelength,
} from "../helpers";
import type { DiffusionRange, Sequence1D } from "../types/types";

export interface PRDResult {
	powerRatio: number;
	diffusionRange: DiffusionRange;
	wavelength: number;
}

/**
 * Generate QRD sequence values.
 */
function generateQrdSequence(prime: number): Sequence1D {
	const values = Array.from({ length: prime }, (_, n) => (n * n) % prime);

	return {
		values,
		modulus: prime,
	};
}

/**
 * Compute Power Ratio Difference (PRD) for acoustic panel design.
 *
 * PRD calculates the difference between maximum and minimum power ratios
 * across the diffusion range, providing insight into frequency response uniformity.
 *
 * @param sequence - The QRD sequence values
 * @param modulus - The prime modulus of the sequence
 * @param wellWidth - Width of each acoustic well
 * @param wavelength - Wavelength at design frequency
 * @param maxDepth - Maximum depth constraint (optional)
 * @param speedOfSound - Speed of sound in air (default 343 m/s at 20°C)
 */
function computePRD(
	sequence: Sequence1D,
	modulus: number,
	wellWidth: number,
	wavelength: number,
	maxDepth?: number | null,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): PRDResult {
	// Calculate depths based on sequence values and wavelength
	const depths = Array.from({ length: modulus }, (_, i) => {
		const value = sequence.values[i];
		if (value === undefined || value === null) {
			throw new Error("Sequence values must be defined");
		}
		return (value * wavelength) / modulus;
	});

	// Use provided maxDepth or calculate from depths
	const finalMaxDepth =
		maxDepth !== undefined && maxDepth !== null
			? maxDepth
			: Math.max(...depths);

	// Compute power ratios for each depth
	const powerRatios = depths.map((depth) => {
		return computePowerRatio(depth, speedOfSound, wellWidth);
	});

	// Calculate PRD as the difference between max and min power ratios
	const maxPR = Math.max(...powerRatios);
	const minPR = Math.min(...powerRatios);
	const prdValue = maxPR - minPR;

	// Compute diffusion range based on well dimensions
	const diffusionRange = computeDiffusionRange(
		wellWidth,
		finalMaxDepth,
		speedOfSound,
	);

	return {
		powerRatio: prdValue,
		diffusionRange,
		wavelength,
	};
}

/**
 * Compute the power ratio for a given depth.
 *
 * The power ratio represents how efficiently energy is distributed
 * across the acoustic panel at a specific depth/frequency.
 */
function computePowerRatio(
	depth: number,
	speedOfSound: number,
	wellWidth: number,
): number {
	// Calculate frequency from depth using the base wavelength unit
	const frequency = speedOfSound / (depth * wellWidth);

	// Compute power ratio based on depth and wavelength relationship
	// Higher ratios indicate better energy distribution
	const wavelength = speedOfSound / frequency;
	const ratio = (wavelength * wellWidth) / (speedOfSound * 2);

	return Math.max(0, ratio);
}

/**
 * Compute PRD for a QRD sequence with optional depth constraints.
 */
export function computePRDFromQrd(
	prime: number,
	designFrequency: number,
	wellWidth: number,
	maxDepth?: number,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): PRDResult {
	// Generate QRD sequence first
	const sequence = generateQrdSequence(prime);

	// Calculate wavelength based on design frequency
	const wavelength = frequencyToWavelength(designFrequency, speedOfSound);

	return computePRD(
		sequence,
		prime,
		wellWidth,
		wavelength,
		maxDepth,
		speedOfSound,
	);
}

/**
 * Validate PRD results and provide feedback.
 */
export function validatePRDResults(result: PRDResult): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (result.powerRatio < 0) {
		errors.push("Power ratio cannot be negative");
	}

	if (result.diffusionRange.minFrequency > result.diffusionRange.maxFrequency) {
		errors.push(
			"Diffusion range is invalid: min frequency exceeds max frequency",
		);
	}

	return { valid: errors.length === 0, errors };
}
