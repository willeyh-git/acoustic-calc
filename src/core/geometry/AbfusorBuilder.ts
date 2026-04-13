import type { AbfusorParams } from "../types/panelTypes";
import type { PanelGeometry, Sequence1D, PanelCell } from "../types/types";
import { PanelBuilder } from "./panelBuilder";
import { generateAbfusor, validateAbfusorResults } from "../math/abfusor";

export class AbfusorBuilder extends PanelBuilder<AbfusorParams> {
	public generateSequence(): Sequence1D | Sequence2D {
		const { pattern } = this.params;

		if (!pattern || pattern.length === 0) {
			throw new Error("Pattern is required for Abfusor");
		}

		// Validate binary pattern
		for (const value of pattern) {
			if (value !== 0 && value !== 1) {
				throw new Error("Pattern values must be binary (0 or 1)");
			}
		}

		return {
			values: pattern,
			modulus: pattern.length,
		};
	}

	public buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry {
		const { depthA, depthB } = this.params;

		if (!depthA || !depthB) {
			throw new Error("Both depthA and depthB are required for Abfusor");
		}

		// Compute depths using the math function
		const wavelength =
			(this.params.speedOfSound || 343) / this.params.designFrequency;
		const abfusorResult = generateAbfusor(
			sequence.values,
			wavelength,
			depthA,
			depthB,
			this.params.speedOfSound || 343,
		);

		// Generate cell positions based on binary pattern layout
		const cells: PanelCell[] = [];

		for (let i = 0; i < sequence.modulus; i++) {
			const cellX = i * this.params.cellSize;
			const value = sequence.values[i];

			cells.push({
				x: cellX,
				y: 0, // Single row for Abfusor
				width: this.params.cellSize,
				height: this.params.cellSize,
				depth:
					value === 1 ? abfusorResult.depthsA[i] : abfusorResult.depthsB[i],
				wallLeft: cellX,
				wallRight: cellX + this.params.cellSize,
			});
		}

		// Calculate bounding box
		const totalSize = sequence.modulus * this.params.cellSize;
		const maxDepth = Math.max(
			...abfusorResult.depthsA,
			...abfusorResult.depthsB,
		);
		const boundingBox = {
			width: totalSize,
			height: this.params.cellSize,
			depth: maxDepth,
		};

		return {
			cells,
			boundingBox,
			metadata: {
				diffusion: abfusorResult.diffusionRange,
			},
		};
	}

	private getDiffusionRange() {
		const { designFrequency, cellSize, speedOfSound = 343 } = this.params;

		// Calculate actual max depth based on pattern length and depths
		const actualMaxDepth = ((this.params.pattern?.length || 1) * cellSize) / 2;

		return {
			minFrequency: speedOfSound / (2 * actualMaxDepth),
			maxFrequency: speedOfSound / (2 * cellSize),
		};
	}
}
