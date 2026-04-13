import type { AbsorberParams } from "../types/panelTypes";
import type {
	PanelGeometry,
	DiffusionRange,
	HelmholtzResult,
} from "../types/types";
import { PanelBuilder } from "./panelBuilder";
import {
	computeHelmholtzResonator,
	validateHelmholtzResonatorResults,
} from "../math/helmholtz";

export class HelmholtzAbsorberBuilder extends PanelBuilder<AbsorberParams> {
	public generateSequence():
		| import("../types/types").Sequence1D
		| import("../types/types").Sequence2D {
		// Helmholtz resonators don't have a sequence - they're uniform across the surface
		return {
			values: [],
			modulus: 0,
		};
	}

	public buildGeometry(
		sequence:
			| import("../types/types").Sequence1D
			| import("../types/types").Sequence2D,
	): PanelGeometry {
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

		if (!cavityDepth || !holeDiameter) {
			throw new Error(
				"Cavity depth and hole diameter are required for Helmholtz absorber",
			);
		}

		const designFrequency = this.params.designFrequency || 500; // Default to 500Hz if not specified
		const speedOfSound = this.params.speedOfSound || 343;

		// Calculate geometric properties
		const neckRadius = holeDiameter / 2;
		const neckArea = Math.PI * Math.pow(neckRadius, 2); // m²

		// Estimate cavity volume based on depth and panel area
		const panelArea = dimensions.width * dimensions.height;
		const cavityVolume = panelArea * (cavityDepth / 1000); // Convert mm to meters

		// Calculate neck length (typically the thickness of the perforated plate)
		const neckLength = material.thickness / 1000 || 0.005; // Default 5mm if not specified

		// Compute Helmholtz resonator characteristics
		const helmholtzResult: HelmholtzResult = computeHelmholtzResonator({
			neckArea,
			cavityVolume,
			neckLength,
			neckDiameter: holeDiameter / 1000, // Convert mm to meters
			targetFrequency: designFrequency,
			speedOfSound,
		});

		// Validate results
		const validation = validateHelmholtzResonatorResults(helmholtzResult);
		if (!validation.valid) {
			console.warn("Helmholtz resonator errors:", validation.errors.join(", "));
		}

		// Calculate wavelength at design frequency
		const wavelength = speedOfSound / designFrequency;

		// Generate cell positions - uniform coverage for Helmholtz absorber
		const cells: import("../types/types").PanelCell[] = [];

		// Create a grid of cells covering the dimensions
		const rows = Math.ceil(dimensions.height / cellSize);
		const cols = Math.ceil(dimensions.width / cellSize);

		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < cols; j++) {
				const cellX = j * cellSize;
				const cellY = i * cellSize;

				cells.push({
					x: cellX,
					y: cellY,
					width: cellSize,
					height: cellSize,
					depth: cavityDepth, // Helmholtz absorber depth is uniform
				});
			}
		}

		// Calculate bounding box
		const boundingBox = {
			width: dimensions.width,
			height: dimensions.height,
			depth: cavityDepth,
		};

		return {
			cells,
			boundingBox,
			metadata: {
				diffusion: this.getDiffusionRange(helmholtzResult),
				prd: helmholtzResult,
			},
		};
	}

	private getDiffusionRange(helmholtzResult: HelmholtzResult): DiffusionRange {
		const { bandwidth } = helmholtzResult;

		return {
			minFrequency: bandwidth.minFrequency,
			maxFrequency: bandwidth.maxFrequency,
		};
	}
}
