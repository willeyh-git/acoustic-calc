import type { SkylineParams } from "../types/panelTypes";
import type {
	PanelGeometry,
	Sequence1D,
	Sequence2D,
	PanelCell,
} from "../types/types";
import { PanelBuilder } from "./panelBuilder";
import { computeSkyline, generateSkylineSequence } from "../math/skyline";

export class SkylineBuilder extends PanelBuilder<SkylineParams> {
	public generateSequence(): Sequence1D | Sequence2D {
		const {
			gridSize,
			prime,
			designFrequency,
			speedOfSound = 343,
		} = this.params;

		// Generate skyline sequence
		const sequence = generateSkylineSequence(gridSize, prime);

		return sequence;
	}

	public buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry {
		const { gridSize, wellWidth, maxDepth } = this.params;

		// Compute depths for each well position
		let depths: number[][];

		if (sequence instanceof Object && "values" in sequence) {
			// This is a 2D sequence
			const skylineResult = computeSkyline(
				gridSize,
				this.params.designFrequency,
				wellWidth,
				maxDepth,
				this.params.speedOfSound || 343,
			);
			depths = skylineResult.depths;
		} else {
			// Fallback to 1D sequence
			throw new Error("Skyline requires a 2D sequence");
		}

		// Generate cell positions based on grid layout
		const cells: PanelCell[] = [];

		for (let i = 0; i < gridSize; i++) {
			for (let j = 0; j < gridSize; j++) {
				// Calculate cell position in the grid
				const cellX = j * wellWidth;
				const cellY = i * wellWidth;

				cells.push({
					x: cellX,
					y: cellY,
					width: wellWidth,
					height: wellWidth,
					depth: maxDepth || 0,
				});
			}
		}

		// Calculate bounding box
		const totalSize = gridSize * wellWidth;
		const boundingBox = {
			width: totalSize,
			height: totalSize,
			depth: maxDepth || 0,
		};

		return {
			cells,
			boundingBox,
			metadata: {
				diffusion: this.getDiffusionRange(),
			},
		};
	}

	private getDiffusionRange() {
		const {
			designFrequency,
			wellWidth,
			maxDepth,
			speedOfSound = 343,
		} = this.params;

		// Calculate actual max depth if not provided
		const actualMaxDepth = maxDepth || speedOfSound / designFrequency;

		return {
			minFrequency: speedOfSound / (2 * actualMaxDepth),
			maxFrequency: speedOfSound / (2 * wellWidth),
		};
	}
}
