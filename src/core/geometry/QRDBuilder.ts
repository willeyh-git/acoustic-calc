import type { QrdParams } from "../types/panelTypes";
import type {
	PanelGeometry,
	Sequence1D,
	Sequence2D,
	PanelCell,
} from "../types/types";
import { PanelBuilder } from "./panelBuilder";
import { computeQrd, generateQrdSequence } from "../math/qrd";

export class QrdBuilder extends PanelBuilder<QrdParams> {
	public generateSequence(): Sequence1D | Sequence2D {
		const {
			prime,
			designFrequency,
			speedOfSound = 343,
			wellWidth,
			maxDepth,
		} = this.params;

		// Generate QRD sequence
		const sequence = generateQrdSequence(prime);

		// Calculate wavelength at design frequency
		const wavelength = speedOfSound / designFrequency;

		return sequence;
	}

	public buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry {
		const { prime, wellWidth, maxDepth, unit } = this.params;

		// Compute depths for each well position
		let depths: number[];

		if (sequence instanceof Object && "values" in sequence) {
			// This is a 1D or 2D sequence - use QRD computation
			const qrdResult = computeQrd(
				prime,
				this.params.designFrequency,
				wellWidth,
				maxDepth,
				this.params.speedOfSound || 343,
			);
			depths = qrdResult.depths;
		} else {
			// Fallback to manual depth calculation
			const wavelength =
				(this.params.speedOfSound || 343) / this.params.designFrequency;
			depths = sequence.values.map((v) => (v * wavelength) / prime);

			if (!maxDepth) {
				maxDepth = Math.max(...depths);
			} else {
				depths = depths.map((d) => Math.min(d, maxDepth));
			}
		}

		// Generate cell positions based on QRD layout
		const cells: PanelCell[] = [];

		for (let i = 0; i < prime; i++) {
			const cellX = i * wellWidth;

			cells.push({
				x: cellX,
				y: 0, // Single row for QRD
				width: wellWidth,
				height: wellWidth,
				depth: depths[i] || 0,
				wallLeft: cellX,
				wallRight: cellX + wellWidth,
			});
		}

		// Calculate bounding box
		const totalSize = prime * wellWidth;
		const boundingBox = {
			width: totalSize,
			height: wellWidth,
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
