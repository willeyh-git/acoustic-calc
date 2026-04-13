import { DEFAULT_SPEED_OF_SOUND } from "../helpers";
import type { DiffusionRange, Material, Dimensions } from "../types/types";

/**
 * Helmholtz Resonator Math Module
 *
 * Calculates resonant frequencies and bandwidth for Helmholtz resonators.
 * Helmholtz resonators work like a "mass-spring" system where air in the neck
 * acts as mass and the cavity volume acts as a spring.
 */

/**
 * Calculate Helmholtz resonator frequency.
 *
 * Formula: f = (c / 2π) * √(A / (V * L))
 * Where:
 * - c = speed of sound in air
 * - A = cross-sectional area of the neck
 * - V = volume of the cavity
 * - L = effective length of the neck (including end correction)
 *
 * @param neckArea - Cross-sectional area of the neck (m²)
 * @param cavityVolume - Volume of the cavity (m³)
 * @param neckLength - Length of the neck (m)
 * @param neckDiameter - Diameter of the neck (m) for end correction calculation
 * @param speedOfSound - Speed of sound in air (default 343 m/s)
 *
 * @returns Resonant frequency in Hz
 */
export function computeHelmholtzFrequency(
	neckArea: number,
	cavityVolume: number,
	neckLength: number,
	neckDiameter?: number,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): number {
	if (neckArea <= 0) {
		throw new Error("Neck area must be positive");
	}

	if (cavityVolume <= 0) {
		throw new Error("Cavity volume must be positive");
	}

	if (neckLength <= 0) {
		throw new Error("Neck length must be positive");
	}

	const effectiveLength = neckLength + neckDiameter; // End correction: add one diameter

	// Helmholtz frequency formula
	const angularFrequency =
		speedOfSound * Math.sqrt(neckArea / (cavityVolume * effectiveLength));
	const frequency = angularFrequency / (2 * Math.PI);

	return frequency;
}

/**
 * Calculate bandwidth/Q factor for a Helmholtz resonator.
 *
 * The Q factor determines how narrow or broad the absorption peak is.
 * Higher Q means narrower, more selective absorption.
 *
 * @param neckArea - Cross-sectional area of the neck (m²)
 * @param cavityVolume - Volume of the cavity (m³)
 * @param neckLength - Length of the neck (m)
 * @param neckDiameter - Diameter of the neck (m)
 * @param viscosity - Air viscosity (default 1.8e-5 Pa·s)
 * @returns Bandwidth information including Q factor and bandwidth in Hz
 */
export function computeHelmholtzBandwidth(
	neckArea: number,
	cavityVolume: number,
	neckLength: number,
	neckDiameter: number,
	viscosity = 1.8e-5, // Air viscosity at 20°C (Pa·s)
): {
	QFactor: number;
	bandwidthHz: number;
	minFrequency: number;
	maxFrequency: number;
} {
	if (neckArea <= 0) {
		throw new Error("Neck area must be positive");
	}

	if (cavityVolume <= 0) {
		throw new Error("Cavity volume must be positive");
	}

	const effectiveLength = neckLength + neckDiameter; // End correction

	// Calculate Q factor using viscous losses in the neck
	// Higher viscosity or longer necks increase damping (lower Q)
	const neckPerimeter = Math.PI * neckDiameter;
	const surfaceArea = neckPerimeter * neckLength;

	// Characteristic impedance of air
	const rho0 = 1.21; // Air density at 20°C (kg/m³)
	const c0 = DEFAULT_SPEED_OF_SOUND;

	// Calculate Q factor (simplified model)
	// Q is inversely proportional to viscous losses
	const viscousLossFactor = (viscosity * surfaceArea) / neckArea;

	// Base Q for ideal Helmholtz resonator
	const baseQ = 10; // Typical starting value

	// Adjust Q based on viscous losses
	const adjustedQ = baseQ / (1 + viscousLossFactor * 0.01);

	// Calculate center frequency
	const angularFrequency =
		c0 * Math.sqrt(neckArea / (cavityVolume * effectiveLength));
	const centerFrequency = angularFrequency / (2 * Math.PI);

	// Bandwidth is inversely proportional to Q
	const bandwidthHz = centerFrequency / adjustedQ;

	return {
		QFactor: adjustedQ,
		bandwidthHz,
		minFrequency: centerFrequency - bandwidthHz / 2,
		maxFrequency: centerFrequency + bandwidthHz / 2,
	};
}

/**
 * Calculate optimal neck dimensions for a target frequency.
 *
 * For a given cavity volume and target frequency, calculate the required
 * neck area and length to achieve that resonance.
 *
 * @param targetFrequency - Target resonant frequency in Hz
 * @param cavityVolume - Volume of the cavity (m³)
 * @param neckDiameter - Desired neck diameter (m)
 * @param speedOfSound - Speed of sound in air (default 343 m/s)
 *
 * @returns Object with calculated neck area and length
 */
export function computeOptimalHelmholtzDimensions(
	targetFrequency: number,
	cavityVolume: number,
	neckDiameter?: number,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): {
	neckArea: number;
	neckLength: number;
} {
	if (targetFrequency <= 0) {
		throw new Error("Target frequency must be positive");
	}

	if (cavityVolume <= 0) {
		throw new Error("Cavity volume must be positive");
	}

	const angularFrequency = targetFrequency * 2 * Math.PI;

	// Rearrange Helmholtz formula to solve for neck area/length relationship
	// f² = (c² / 4π²) * A / (V * L_eff)
	// where L_eff = L + D (end correction)

	const c0 = speedOfSound;
	const constant = Math.pow(c0, 2) / (4 * Math.PI * Math.PI);

	// If neck diameter is specified, calculate required area
	if (neckDiameter > 0) {
		const neckRadius = neckDiameter / 2;
		const neckArea = Math.PI * Math.pow(neckRadius, 2);

		// Solve for effective length
		const effectiveLength =
			(constant * neckArea) /
			(cavityVolume * angularFrequency * angularFrequency);

		// Subtract end correction to get actual neck length
		const neckLength = effectiveLength - neckDiameter;

		return {
			neckArea,
			neckLength: Math.max(0.01, neckLength), // Minimum 1cm for practical reasons
		};
	} else {
		// If diameter not specified, provide default proportions
		const optimalNeckDiameter = Math.pow(cavityVolume * 0.5, 1 / 3); // Rough estimate
		return computeOptimalHelmholtzDimensions(
			targetFrequency,
			cavityVolume,
			optimalNeckDiameter,
			speedOfSound,
		);
	}
}

/**
 * Calculate absorption coefficient for a Helmholtz resonator at a given frequency.
 *
 * The absorption coefficient peaks sharply at the resonant frequency and drops off quickly.
 *
 * @param frequency - Frequency to evaluate (Hz)
 * @param resonantFrequency - Resonant frequency of the resonator (Hz)
 * @param QFactor - Quality factor of the resonator
 * @returns Absorption coefficient (0 to 1)
 */
export function computeHelmholtzAbsorptionCoefficient(
	frequency: number,
	resonantFrequency: number,
	QFactor: number,
): number {
	if (frequency <= 0 || resonantFrequency <= 0 || QFactor <= 0) {
		throw new Error("All parameters must be positive");
	}

	// Normalized frequency deviation from resonance
	const delta = (frequency - resonantFrequency) / resonantFrequency;

	// Absorption coefficient using Lorentzian line shape
	// This gives a peak at resonance with width determined by Q factor
	let alpha = 1 / (1 + Math.pow(2 * delta * QFactor, 2));

	// Ensure value is between 0 and 1
	return Math.max(0, Math.min(1, alpha));
}

/**
 * Calculate multiple resonances for a Helmholtz array.
 *
 * When multiple Helmholtz resonators are arranged in an array, they can create
 * additional resonances due to coupling effects.
 *
 * @param numberOfResonators - Number of resonators in the array
 * @param singleResonatorFreq - Resonant frequency of a single resonator (Hz)
 * @returns Array of coupled resonance frequencies
 */
export function computeCoupledResonances(
	numberOfResonators: number,
	singleResonatorFreq: number,
): number[] {
	if (numberOfResonators <= 0) {
		throw new Error("Number of resonators must be positive");
	}

	if (singleResonatorFreq <= 0) {
		throw new Error("Single resonator frequency must be positive");
	}

	const resonances: number[] = [];

	// Fundamental resonance (all resonators in phase)
	resonances.push(singleResonatorFreq);

	// Coupled modes - frequencies split based on array size
	for (let i = 1; i < numberOfResonators; i++) {
		const couplingFactor = Math.cos((Math.PI * i) / numberOfResonators);
		const coupledFreq = singleResonatorFreq * (1 + couplingFactor * 0.1); // Small splitting effect

		resonances.push(coupledFreq);
	}

	return resonances;
}

/**
 * Main function to compute Helmholtz resonator characteristics.
 *
 * This is the primary entry point for calculating all absorption properties.
 *
 * @param params - Parameters object containing all required values
 * @returns HelmholtzResult with frequency and bandwidth data
 */
export function computeHelmholtzResonator(params: {
	neckArea?: number;
	cavityVolume?: number;
	neckLength?: number;
	neckDiameter?: number;
	targetFrequency?: number;
	speedOfSound?: number;
}): import("../types/types").HelmholtzResult {
	const {
		neckArea,
		cavityVolume,
		neckLength,
		neckDiameter,
		targetFrequency,
		speedOfSound = DEFAULT_SPEED_OF_SOUND,
	} = params;

	if ((!targetFrequency && !neckArea) || !cavityVolume || !neckLength) {
		throw new Error(
			"Either targetFrequency with neck/cavity dimensions, or all geometric parameters are required",
		);
	}

	let resonantFrequency: number;

	if (targetFrequency) {
		const optimal = computeOptimalHelmholtzDimensions(
			targetFrequency,
			cavityVolume || 0.01,
			neckDiameter,
		);
		resonantFrequency = targetFrequency;
	} else {
		resonantFrequency = computeHelmholtzFrequency(
			neckArea!,
			cavityVolume!,
			neckLength!,
			neckDiameter,
			speedOfSound,
		);
	}

	const bandwidth = computeHelmholtzBandwidth(
		neckArea || 0.01,
		cavityVolume || 0.01,
		neckLength || 0.01,
		neckDiameter || 0.05,
	);

	return {
		resonantFrequency,
		bandwidth,
		materialProperties: {
			neckArea: neckArea || Math.PI * Math.pow((neckDiameter || 0.05) / 2, 2),
			cavityVolume: cavityVolume || 0.01,
			neckLength: neckLength || 0.05,
			neckDiameter: neckDiameter || 0.05,
		},
	};
}

/**
 * Validate Helmholtz resonator results.
 */
export function validateHelmholtzResonatorResults(
	result: import("../types/types").HelmholtzResult,
): {
	valid: boolean;
	errors: string[];
	warnings?: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (result.resonantFrequency <= 0) {
		errors.push("Resonant frequency must be positive");
	}

	if (result.bandwidth.QFactor <= 0) {
		errors.push("Q factor must be positive");
	}

	if (result.materialProperties.cavityVolume <= 0) {
		errors.push("Cavity volume must be positive");
	}

	if (result.materialProperties.neckLength <= 0) {
		errors.push("Neck length must be positive");
	}

	return { valid: errors.length === 0, errors, warnings };
}
