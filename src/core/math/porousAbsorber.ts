import { DEFAULT_SPEED_OF_SOUND } from "../helpers";
import type { DiffusionRange, Material, Dimensions } from "../types/types";

/**
 * Porous Absorber Math Module
 *
 * Calculates absorption coefficients and resonant frequencies for porous absorbers.
 * Porous absorbers work by converting sound energy into heat through friction as air
 * moves through the material's pores.
 */

/**
 * Calculate absorption coefficient using Delany-Bazley model approximation.
 *
 * The absorption coefficient (α) ranges from 0 to 1, where:
 * - α = 0 means no absorption (sound reflects completely)
 * - α = 1 means perfect absorption (no reflection)
 *
 * @param frequency - Frequency in Hz
 * @param flowResistivity - Flow resistivity of the material (Pa·s/m²), typically 10,000-100,000
 * @param porosity - Porosity of the material (0 to 1), typically 0.8-0.95
 * @param thickness - Thickness of the absorber in meters
 * @param density - Density of the porous material (kg/m³)
 *
 * @returns Absorption coefficient at the given frequency
 */
export function computeAbsorptionCoefficient(
	frequency: number,
	flowResistivity: number,
	porosity: number,
	thickness: number,
	density?: number,
): number {
	if (frequency <= 0) {
		throw new Error("Frequency must be positive");
	}

	if (flowResistivity <= 0 || flowResistivity > 1000000) {
		throw new Error("Flow resistivity must be between 0 and 1,000,000 Pa·s/m²");
	}

	if (porosity <= 0 || porosity >= 1) {
		throw new Error("Porosity must be between 0 and 1");
	}

	if (thickness <= 0) {
		throw new Error("Thickness must be positive");
	}

	const k = flowResistivity; // Flow resistivity
	const rho0 = density || 1.21; // Air density at 20°C (kg/m³)
	const c0 = DEFAULT_SPEED_OF_SOUND; // Speed of sound in air (m/s)

	// Characteristic length scale
	const lambda = Math.sqrt(rho0 / k);

	// Dimensionless frequency parameter
	const fc = (frequency * thickness) / c0;

	// Simplified Delany-Bazley model for absorption coefficient
	// This is an approximation - full implementation requires complex calculations

	// Absorption increases with:
	// 1. Higher frequencies (more cycles through material)
	// 2. Greater thickness (more material to absorb sound)
	// 3. Optimal flow resistivity (~20,000-50,000 Pa·s/m² for most materials)

	const baseAbsorption = Math.min(1, fc * 0.5); // Absorption increases with frequency

	// Thickness effect - thicker is generally better up to a point
	const thicknessFactor = Math.min(1, thickness / (fc * 2));

	// Flow resistivity optimization curve
	// Peak absorption typically around 30,000-40,000 Pa·s/m²
	const optimalResistivity = 35000;
	const resistivityFactor = Math.exp(
		-Math.pow(k - optimalResistivity, 2) / (2 * 10000000),
	);

	// Porosity effect - higher porosity generally better for absorption
	const porosityFactor = porosity;

	// Combined absorption coefficient
	let alpha =
		baseAbsorption * thicknessFactor * resistivityFactor * porosityFactor;

	// Ensure value is between 0 and 1
	return Math.max(0, Math.min(1, alpha));
}

/**
 * Calculate resonant frequencies for a porous absorber.
 *
 * Porous materials have natural resonances where absorption peaks occur.
 * These are typically at quarter-wavelength multiples of the material thickness.
 *
 * @param frequency - Frequency in Hz to analyze
 * @param thickness - Thickness of the absorber in meters
 * @param speedOfSound - Speed of sound in air (default 343 m/s)
 *
 * @returns Object containing resonant frequencies and absorption characteristics
 */
export function computePorousResonances(
	frequency: number,
	thickness: number,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): {
	resonantFrequencies: number[];
	quarterWavelengthFreq: number;
	halfWavelengthFreq: number;
} {
	if (frequency <= 0) {
		throw new Error("Frequency must be positive");
	}

	if (thickness <= 0) {
		throw new Error("Thickness must be positive");
	}

	const wavelength = speedOfSound / frequency;

	// Quarter-wavelength resonance (fundamental mode)
	// This is where the absorber is most effective
	const quarterWavelengthFreq = speedOfSound / (4 * thickness);

	// Half-wavelength resonance (second harmonic)
	const halfWavelengthFreq = speedOfSound / (2 * thickness);

	// Third harmonic
	const thirdHarmonicFreq = 3 * quarterWavelengthFreq;

	return {
		resonantFrequencies: [
			quarterWavelengthFreq,
			halfWavelengthFreq,
			thirdHarmonicFreq,
		],
		quarterWavelengthFreq,
		halfWavelengthFreq,
	};
}

/**
 * Calculate optimal thickness for a target frequency range.
 *
 * For best absorption at a specific frequency, the absorber thickness should be
 * approximately 1/4 of the wavelength at that frequency.
 *
 * @param targetFrequency - Target frequency in Hz where you want peak absorption
 * @param speedOfSound - Speed of sound in air (default 343 m/s)
 * @returns Optimal thickness in meters and millimeters
 */
export function computeOptimalThickness(
	targetFrequency: number,
	speedOfSound = DEFAULT_SPEED_OF_SOUND,
): {
	thicknessMeters: number;
	thicknessMillimeters: number;
	wavelengthAtTarget: number;
} {
	if (targetFrequency <= 0) {
		throw new Error("Target frequency must be positive");
	}

	const wavelength = speedOfSound / targetFrequency;
	const optimalThickness = wavelength / 4;

	return {
		thicknessMeters: optimalThickness,
		thicknessMillimeters: optimalThickness * 1000,
		wavelengthAtTarget: wavelength,
	};
}

/**
 * Calculate absorption bandwidth for a porous absorber.
 *
 * The bandwidth indicates the range of frequencies where significant absorption occurs.
 * Typically defined as the -3dB points around the peak absorption frequency.
 *
 * @param thickness - Thickness of the absorber in meters
 * @param flowResistivity - Flow resistivity (Pa·s/m²)
 * @param porosity - Porosity of material (0 to 1)
 * @returns Bandwidth information including center frequency and range
 */
export function computeAbsorptionBandwidth(
	thickness: number,
	flowResistivity: number,
	porosity: number,
): {
	centerFrequency: number;
	bandwidthHz: number;
	minFrequency: number;
	maxFrequency: number;
} {
	if (thickness <= 0) {
		throw new Error("Thickness must be positive");
	}

	const speedOfSound = DEFAULT_SPEED_OF_SOUND;

	// Center frequency is the quarter-wavelength resonance
	const centerFrequency = speedOfSound / (4 * thickness);

	// Bandwidth depends on flow resistivity and porosity
	// Higher resistivity typically narrows bandwidth
	// Higher porosity typically widens bandwidth

	const baseBandwidthFactor = 0.3; // Typical bandwidth factor for porous absorbers

	// Adjust based on material properties
	const resistivityAdjustment = Math.max(
		0,
		Math.min(1, (flowResistivity - 20000) / 50000),
	);
	const porosityAdjustment = Math.max(0, Math.min(1, porosity - 0.8));

	const bandwidthFactor =
		baseBandwidthFactor *
		(1 + resistivityAdjustment * 0.5 + porosityAdjustment * 0.3);

	// Calculate frequency range
	const bandwidthHz = centerFrequency * bandwidthFactor;
	const minFrequency = centerFrequency - bandwidthHz / 2;
	const maxFrequency = centerFrequency + bandwidthHz / 2;

	return {
		centerFrequency,
		bandwidthHz,
		minFrequency: Math.max(0, minFrequency),
		maxFrequency,
	};
}

/**
 * Main function to compute porous absorber characteristics.
 *
 * This is the primary entry point for calculating all absorption properties.
 *
 * @param params - Parameters object containing all required values
 * @returns PorousResult with absorption coefficient and resonance data
 */
export function computePorousAbsorber(params: {
	frequency: number;
	thickness: number;
	flowResistivity?: number;
	porosity?: number;
	density?: number;
	speedOfSound?: number;
}): import("../types/types").PorousResult {
	const {
		frequency,
		thickness,
		flowResistivity = 30000, // Default typical value
		porosity = 0.9, // Default high porosity
		density = 150, // Default kg/m³ for common porous materials
		speedOfSound = DEFAULT_SPEED_OF_SOUND,
	} = params;

	if (frequency <= 0) {
		throw new Error("Frequency must be positive");
	}

	if (thickness <= 0) {
		throw new Error("Thickness must be positive");
	}

	const absorptionCoefficient = computeAbsorptionCoefficient(
		frequency,
		flowResistivity,
		porosity,
		thickness,
		density,
	);

	const resonances = computePorousResonances(
		frequency,
		thickness,
		speedOfSound,
	);
	const bandwidth = computeAbsorptionBandwidth(
		thickness,
		flowResistivity,
		porosity,
	);

	return {
		frequency,
		absorptionCoefficient,
		resonantFrequencies: resonances.resonantFrequencies,
		bandwidth,
		materialProperties: {
			thickness,
			flowResistivity,
			porosity,
			density,
		},
	};
}

/**
 * Validate porous absorber results.
 */
export function validatePorousAbsorberResults(
	result: import("../types/types").PorousResult,
): {
	valid: boolean;
	errors: string[];
	warnings?: string[];
} {
	const errors: string[] = [];
	const warnings: string[] = [];

	if (result.absorptionCoefficient < 0 || result.absorptionCoefficient > 1) {
		errors.push("Absorption coefficient must be between 0 and 1");
	}

	if (result.resonantFrequencies.length === 0) {
		warnings.push("No resonant frequencies calculated");
	}

	if (result.bandwidth.centerFrequency <= 0) {
		errors.push("Center frequency must be positive");
	}

	if (result.materialProperties.thickness <= 0) {
		errors.push("Thickness must be positive");
	}

	return { valid: errors.length === 0, errors, warnings };
}
