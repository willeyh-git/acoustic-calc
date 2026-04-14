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
		const wallThickness = this.calculateWallThickness();
		const kerfOffset = this.getKerfOffset();

		for (let i = 0; i < prime; i++) {
			const cellX = i * wellWidth + kerfOffset / 2;

			cells.push({
				x: cellX,
				y: 0, // Single row for QRD
				width: wellWidth - wallThickness,
				height: wellWidth - wallThickness,
				depth: depths[i] || 0,
				wallLeft: cellX,
				wallRight: cellX + (wellWidth - wallThickness),
				backingThickness: this.params.backingPlateThickness,
				frameProfile: this.params.edgeFrameProfile,
				kerfOffset: kerfOffset,
			});
		}

		// Calculate bounding box with construction features
		const totalSize = prime * wellWidth;
		const backingThickness = this.params.backingPlateThickness || 0;
		const boundingBox = {
			width: totalSize,
			height: wellWidth,
			depth: maxDepth || backingThickness || 0,
		};

		return {
			cells,
			boundingBox,
			metadata: {
				diffusion: this.getDiffusionRange(),
				wallThickness: wallThickness,
				backingPlateThickness: backingThickness,
				edgeFrameProfile: this.params.edgeFrameProfile,
				kerf: kerfOffset,
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
