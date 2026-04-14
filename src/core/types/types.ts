import type { PRDResult } from "../math/prd";
import type { SkylineResult } from "../math/skyline";

export type Unit = "mm" | "cm" | "inch";

export interface Dimensions {
	width: number;
	height: number;
	depth?: number;
}

export interface DiffusionRange {
	minFrequency: number;
	maxFrequency: number;
}

export interface Material {
	thickness: number;
	kerf?: number;
	density?: number;
}

interface BaseSequence {
	modulus: number;
}

export interface Sequence1D extends BaseSequence {
	values: number[];
}

export interface Sequence2D extends BaseSequence {
	values: number[][];
}

export interface AcousticInfo {
	wavelength: number;
	frequency: number;
	maxDiffusionFreq?: number;
	minDiffusionFreq?: number;
}

export type FrameProfile = "square" | "round" | "flat";

export interface PanelCell extends Dimensions {
	x: number;
	y: number;

	// Optional construction data
	wallLeft?: number;
	wallRight?: number;
	wallTop?: number;
	wallBottom?: number;

	// Construction features (Step 2)
	backingThickness?: number;
	frameProfile?: FrameProfile;
	kerfOffset?: number;
}

export type FrameProfile = "square" | "round" | "flat";

export interface CutPiece extends Omit<Dimensions, "depth"> {
	quantity: number;
	label?: string;
	purpose?: "wall" | "backing" | "frame" | "well";
	materialType?: string;
}

export interface Layout {
	sheetSize: Dimensions;
	pieces: CutPiece[];
	wastePercentage: number;
}

export type SheetMaterial =
	| "plywood-18mm"
	| "mdf-15mm"
	| "hardboard-9mm"
	| "medium-density-fiberboard";

export interface PanelGeometry {
	cells: PanelCell[];

	boundingBox: Dimensions;

	metadata?: {
		materialUsage?: number;
		cutList?: CutPiece[];
		diffusion?: DiffusionRange;
		prd?: PRDResult;
		skyline?: SkylineResult;

		// Construction features (Step 2)
		wallThickness?: number;
		backingPlateThickness?: number;
		edgeFrameProfile?: FrameProfile;
		kerf?: number;
	};
}

export interface PanelParamsBase {
	type: string;
	unit: Unit;
	dimensions: Dimensions;
	material: Material;
	cellSize: number;
	withBacking?: boolean;
	withFrame?: boolean;
}

export interface PRDResult {
	powerRatio: number;
	diffusionRange: DiffusionRange;
	wavelength: number;
}

export interface AbfusorResult {
	sequence: Sequence1D;
	depthsA: number[];
	depthsB: number[];
	diffusionRange: DiffusionRange;
}

export interface PorousMaterialProperties {
	thickness: number;
	flowResistivity?: number;
	porosity?: number;
	density?: number;
}

export interface PorousResult {
	frequency: number;
	absorptionCoefficient: number;
	resonantFrequencies: number[];
	bandwidth: {
		centerFrequency: number;
		bandwidthHz: number;
		minFrequency: number;
		maxFrequency: number;
	};
	materialProperties: PorousMaterialProperties;
}

export interface HelmholtzMaterialProperties {
	neckArea?: number;
	cavityVolume?: number;
	neckLength?: number;
	neckDiameter?: number;
}

export interface HelmholtzResult {
	resonantFrequency: number;
	bandwidth: {
		QFactor: number;
		bandwidthHz: number;
		minFrequency: number;
		maxFrequency: number;
	};
	materialProperties: HelmholtzMaterialProperties;
}

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings?: string[];
}

// Cost estimation interfaces (Step 2)
export interface MaterialUsage {
	totalAreaM2: number;
	byComponent: {
		wells: number;
		backing: number;
		frame: number;
		waste: number;
	};
}

export interface WasteAnalysis {
	totalWasteM2: number;
	wastePercentage: number;
	sheetsUsed: number;
	sheetsRemaining: number;
}

export interface EstimatedCost {
	total: number;
	currency: string;
	breakdown: {
		materials: number;
		wasteOverhead: number;
		labor?: number;
	};
}

export interface CostBreakdown {
	wells: number;
	backingPlate: number;
	edgeFrame: number;
	waste: number;
	subtotal: number;
}

export interface TotalCost {
	materials: number;
	wasteOverhead: number;
	labor?: number;
	total: number;
	currency: string;
}
