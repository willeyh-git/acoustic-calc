import type { AbsorberParams } from "../types/panelTypes";
import type {
	PanelGeometry,
	DiffusionRange,
	PorousResult,
	PanelCell,
	Sequence1D,
	Sequence2D,
} from "../types/types";
import { PanelBuilder } from "./panelBuilder";
import {
	computePorousAbsorber,
	validatePorousAbsorberResults,
} from "../math/porousAbsorber";

export class PorousAbsorberBuilder extends PanelBuilder<AbsorberParams> {
	public generateSequence(): Sequence1D | Sequence2D {
		// Porous absorbers don't have a sequence - they're uniform across the surface
		return {
			values: [],
			modulus: 0,
		};
	}

	public buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry {
		const {
			cavityDepth,
			holeDiameter,
			holeSpacing,
			dimensions,
			material,
			cellSize,
			withBacking = false,
			withFrame = false,
		} = this.params;

		if (!cavityDepth) {
			throw new Error("Cavity depth is required for porous absorber");
		}

		const designFrequency = this.params.designFrequency || 500; // Default to 500Hz if not specified
		const speedOfSound = this.params.speedOfSound || 343;

		// Compute absorption characteristics at design frequency
		const porousResult: PorousResult = computePorousAbsorber({
			frequency: designFrequency,
			thickness: cavityDepth / 1000, // Convert mm to meters if needed
			speedOfSound,
		});

		// Validate results
		const validation = validatePorousResonances(porousResult);
		if (!validation.valid) {
			console.warn(
				"Porous absorber warnings:",
				validation.warnings?.join(", "),
			);
		}

		// Calculate wavelength at design frequency
		const wavelength = speedOfSound / designFrequency;

		// Generate cell positions - uniform coverage for porous absorber
		const cells: PanelCell[] = [];
		const wallThickness = this.calculateWallThickness();
		const kerfOffset = this.getKerfOffset();

		// Create a grid of cells covering the dimensions
		const rows = Math.ceil(dimensions.height / cellSize);
		const cols = Math.ceil(dimensions.width / cellSize);

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				const cellX = j * cellSize + kerfOffset / 2;
				const cellY = i * cellSize + kerfOffset / 2;

				cells.push({
					x: cellX,
					y: cellY,
					width: cellSize - wallThickness,
					height: cellSize - wallThickness,
					depth: cavityDepth, // Porous absorber depth is uniform
					wallLeft: cellX,
					wallRight: cellX + (cellSize - wallThickness),
					wallTop: cellY,
					wallBottom: cellY + (cellSize - wallThickness),
					backingThickness: this.params.backingPlateThickness,
					frameProfile: this.params.edgeFrameProfile,
					kerfOffset: kerfOffset,
				});
			}
		}

		// Calculate bounding box with construction features
		const backingThickness = this.params.backingPlateThickness || 0;
		const maxDepth = Math.max(cavityDepth, backingThickness);
		const boundingBox = {
			width: dimensions.width,
			height: dimensions.height,
			depth: maxDepth,
		};

		return {
			cells,
			boundingBox,
			metadata: {
				diffusion: this.getDiffusionRange(porousResult),
				prd: porousResult,
				wallThickness: wallThickness,
				backingPlateThickness: backingThickness,
				edgeFrameProfile: this.params.edgeFrameProfile,
				kerf: kerfOffset,
			},
		};
	}

	private getDiffusionRange(porousResult: PorousResult): DiffusionRange {
		const { bandwidth } = porousResult;

		return {
			minFrequency: bandwidth.minFrequency,
			maxFrequency: bandwidth.maxFrequency,
		};
	}
}

/**
 * Validate porous absorber resonances.
 */
export function validatePorousResonances(result: PorousResult): {
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
