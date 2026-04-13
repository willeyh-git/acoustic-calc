import { isPrime } from "../helpers";
import type { Sequence1D, Sequence2D, PanelParams } from "../types/types";

/**
 * Validate QRD parameters.
 */
export function validateQrdParams(params: any): string[] {
	const errors: string[] = [];

	if (!isPrime(params.prime)) {
		errors.push(`Prime number ${params.prime} is not a prime`);
	}

	if (params.prime < 3) {
		errors.push("Prime must be ≥ 3");
	}

	if (params.wellWidth <= 0) {
		errors.push("Well width must be > 0");
	}

	if (params.designFrequency <= 0) {
		errors.push("Design frequency must be > 0");
	}

	return errors;
}

/**
 * Validate Skyline parameters.
 */
export function validateSkylineParams(params: any): string[] {
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

	if (params.designFrequency <= 0) {
		errors.push("Design frequency must be > 0");
	}

	return errors;
}

/**
 * Validate sequence values.
 */
export function validateSequence(sequence: Sequence1D | Sequence2D): string[] {
	const errors: string[] = [];

	if (!sequence.values) {
		errors.push("Sequence must have values");
		return errors;
	}

	// Check for undefined/null values in 1D sequence
	if (Array.isArray(sequence.values)) {
		const nullCount = sequence.values.filter(
			(v): v is number => typeof v === "number" && !isNaN(v),
		).length;

		if (nullCount !== sequence.values.length) {
			errors.push("Sequence contains undefined or null values");
		}

		// Check for negative values
		const negativeCount = sequence.values.filter(
			(v): v is number => typeof v === "number" && v < 0,
		).length;

		if (negativeCount > 0) {
			errors.push(`Sequence contains ${negativeCount} negative values`);
		}

		// Check for duplicate values in 1D sequence
		const uniqueValues = new Set(
			sequence.values.filter((v): v is number => typeof v === "number"),
		);
		if (uniqueValues.size !== sequence.values.length) {
			errors.push("Sequence contains duplicate values");
		}
	}

	// Check for undefined/null values in 2D sequence
	if (!Array.isArray(sequence.values)) {
		for (const row of sequence.values) {
			if (!Array.isArray(row)) {
				errors.push("2D sequence rows must be arrays");
				break;
			}

			const nullCount = row.filter(
				(v): v is number => typeof v === "number" && !isNaN(v),
			).length;

			if (nullCount !== row.length) {
				errors.push("Sequence contains undefined or null values in rows");
				break;
			}

			// Check for negative values in rows
			const negativeCount = row.filter(
				(v): v is number => typeof v === "number" && v < 0,
			).length;

			if (negativeCount > 0) {
				errors.push(
					`Sequence contains ${negativeCount} negative values in rows`,
				);
				break;
			}
		}
	}

	return errors;
}

/**
 * Validate depth calculations.
 */
export function validateDepths(depths: number | number[]): string[] {
	const errors: string[] = [];

	if (Array.isArray(depths)) {
		// Check for negative depths
		const negativeCount = depths.filter(
			(d): d is number => typeof d === "number" && d < 0,
		).length;

		if (negativeCount > 0) {
			errors.push(`Found ${negativeCount} negative depth values`);
		}

		// Check for NaN or Infinity
		const invalidCount = depths.filter(
			(d): boolean => typeof d === "number" && (isNaN(d) || !isFinite(d)),
		).length;

		if (invalidCount > 0) {
			errors.push(
				`Found ${invalidCount} invalid depth values (NaN or Infinity)`,
			);
		}

		// Check for zero depths (might be valid but worth noting)
		const zeroCount = depths.filter(
			(d): boolean => typeof d === "number" && d === 0,
		).length;

		if (zeroCount > 0) {
			errors.push(`Found ${zeroCount} zero depth values`);
		}
	} else if (typeof depths === "number") {
		if (depths < 0 || isNaN(depths) || !isFinite(depths)) {
			errors.push("Depth value is invalid");
		}

		if (depths === 0) {
			errors.push("Depth cannot be zero");
		}
	}

	return errors;
}

/**
 * Validate panel parameters.
 */
export function validatePanelParams(params: PanelParams): string[] {
	const errors: string[] = [];

	// Check required fields
	if (!params.type) {
		errors.push("Panel type is required");
	}

	if (!params.dimensions) {
		errors.push("Dimensions are required");
	} else {
		validateDimensions(params.dimensions, errors);
	}

	if (!params.material) {
		errors.push("Material is required");
	}

	// Type-specific validation
	switch (params.type) {
		case "qrd":
			return [...errors, ...validateQrdParams(params)];

		case "skyline":
			return [...errors, ...validateSkylineParams(params)];

		default:
			errors.push(`Unsupported panel type: ${params.type}`);
	}

	return errors;
}

/**
 * Validate dimensions.
 */
function validateDimensions(dimensions: any, errors: string[]): void {
	if (!dimensions.width || dimensions.width <= 0) {
		errors.push("Width must be > 0");
	}

	if (!dimensions.height || dimensions.height <= 0) {
		errors.push("Height must be > 0");
	}

	if (dimensions.depth !== undefined && dimensions.depth < 0) {
		errors.push("Depth cannot be negative");
	}
}

/**
 * Validate cell positions.
 */
export function validateCells(cells: any[]): string[] {
	const errors: string[] = [];

	for (let i = 0; i < cells.length; i++) {
		const cell = cells[i];

		if (!cell.x || !cell.y) {
			errors.push(`Cell ${i}: x and y coordinates are required`);
			continue;
		}

		if (typeof cell.x !== "number" || typeof cell.y !== "number") {
			errors.push(`Cell ${i}: x and y must be numbers`);
			continue;
		}

		if (cell.x < 0 || cell.y < 0) {
			errors.push(`Cell ${i}: coordinates cannot be negative`);
		}

		// Check for duplicate positions
		const existing = cells
			.slice(0, i)
			.find((c) => c.x === cell.x && c.y === cell.y);

		if (existing) {
			errors.push(`Cell ${i}: duplicate position at (${cell.x}, ${cell.y})`);
		}
	}

	return errors;
}

/**
 * Comprehensive validation for a complete panel build.
 */
export function validatePanelBuild(
	params: PanelParams,
	sequence?: any,
	depths?: any,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Validate parameters
	const paramErrors = validatePanelParams(params);
	errors.push(...paramErrors);

	if (errors.length > 0) {
		return { valid: false, errors, warnings };
	}

	// Validate sequence if provided
	if (sequence) {
		const seqErrors = validateSequence(sequence);
		errors.push(...seqErrors);
	}

	// Validate depths if provided
	if (depths !== undefined && depths !== null) {
		const depthErrors = validateDepths(depths);
		errors.push(...depthErrors);

		// Warning for very small depths
		if (Array.isArray(depths)) {
			const minDepth = Math.min(...depths);
			if (minDepth < 0.1) {
				warnings.push(
					"Minimum depth is very small (< 0.1), may affect performance",
				);
			}
		} else if (typeof depths === "number" && depths < 0.1) {
			warnings.push("Depth is very small (< 0.1), may affect performance");
		}
	}

	return { valid: errors.length === 0, errors, warnings };
}

/**
 * ValidationResult interface.
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings?: string[];
}
