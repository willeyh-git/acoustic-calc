import type { PanelParams } from "../types/panelTypes";
import type {
	PanelGeometry,
	Sequence1D,
	Sequence2D,
	CutPiece,
	FrameProfile,
} from "../types/types";

export abstract class PanelBuilder<T extends PanelParams> {
	constructor(protected params: T) {}

	abstract generateSequence(): Sequence1D | Sequence2D;

	abstract buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry;

	build(): PanelGeometry {
		const sequence = this.generateSequence();
		return this.buildGeometry(sequence);
	}

	// Construction feature methods (Step 2)

	/**
	 * Calculate wall dimensions with kerf adjustments
	 */
	calculateWallThickness(kerf?: number): number {
		const baseThickness = this.params.wallThickness || 3; // Default 3mm
		return kerf ? baseThickness + kerf : baseThickness;
	}

	/**
	 * Get backing plate dimensions if enabled
	 */
	getBackingPlateDimensions(): Dimensions | null {
		if (!this.params.withBacking) return null;

		const thickness = this.params.backingPlateThickness || 9; // Default 9mm

		return {
			width: this.params.dimensions.width,
			height: this.params.dimensions.height,
			depth: thickness,
		};
	}

	/**
	 * Get edge frame pieces if enabled
	 */
	getEdgeFramePieces(frameProfile?: FrameProfile): CutPiece[] | null {
		if (!this.params.withFrame) return null;

		const profile = frameProfile || this.params.edgeFrameProfile || "square";
		const wallThickness = this.calculateWallThickness();

		// Calculate perimeter pieces (simplified - 4 sides)
		const width = this.params.dimensions.width;
		const height = this.params.dimensions.height;

		return [
			{
				width: width,
				height: wallThickness,
				quantity: 2, // Two long sides
				purpose: "frame",
				label: `Long side (${profile})`,
			},
			{
				width: height,
				height: wallThickness,
				quantity: 2, // Two short sides
				purpose: "frame",
				label: `Short side (${profile})`,
			},
		];
	}

	/**
	 * Calculate kerf offset for cutting tolerance
	 */
	getKerfOffset(kerf?: number): number {
		return kerf || this.params.kerf || 0.5; // Default 0.5mm
	}
}
