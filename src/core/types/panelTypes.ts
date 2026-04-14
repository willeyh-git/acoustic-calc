import type { Material, Dimensions, Unit } from "./types.ts";

export type PanelType = "qrd" | "prd" | "skyline" | "abfusor" | "absorber";

export interface BasePanelParams {
	type: PanelType;
	unit: Unit;

	dimensions: Dimensions;
	material: Material;

	cellSize: number;

	withBacking?: boolean;
	withFrame?: boolean;

	// Construction features (Step 2)
	wallThickness?: number; // Default: 3mm
	backingPlateThickness?: number; // Optional backing plate
	edgeFrameProfile?: FrameProfile; // 'square' | 'round' | 'flat'
	kerf?: number; // Cutting tolerance (default: 0.5mm)
}

export interface QrdParams extends BasePanelParams {
	type: "qrd";

	prime: number;
	designFrequency: number;
	speedOfSound?: number;

	wellWidth: number;
	maxDepth?: number;

	wallThickness?: number;
	flapThickness?: number;

	// Construction features (Step 2)
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface SkylineParams extends BasePanelParams {
	type: "skyline";

	gridSize: number;
	prime: number;
	designFrequency: number;

	wellWidth: number;
	maxDepth?: number;
	speedOfSound?: number;

	// Construction features (Step 2)
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface AbfusorParams extends BasePanelParams {
	type: "abfusor";

	pattern?: number[]; // binary (0/1)
	depthA: number;
	depthB: number;

	// Construction features (Step 2)
	wallThickness?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface AbsorberParams extends BasePanelParams {
	type: "absorber";

	absorberType: "porous" | "helmholtz";

	cavityDepth?: number;
	holeDiameter?: number;
	holeSpacing?: number;

	// Construction features (Step 2)
	wallThickness?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export type PanelParams =
	| QrdParams
	| SkylineParams
	| AbfusorParams
	| AbsorberParams;

// Type-specific validation interfaces (for backward compatibility)
export interface QrdValidationParams extends BasePanelParams {
	type: "qrd";
	prime: number;
	designFrequency: number;
	speedOfSound?: number;
	wellWidth: number;
	maxDepth?: number;
	wallThickness?: number;
	flapThickness?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface SkylineValidationParams extends BasePanelParams {
	type: "skyline";
	gridSize: number;
	prime: number;
	designFrequency: number;
	speedOfSound?: number;
	wellWidth: number;
	maxDepth?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface AbfusorValidationParams extends BasePanelParams {
	type: "abfusor";
	pattern?: number[];
	depthA: number;
	depthB: number;
	wallThickness?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}

export interface AbsorberValidationParams extends BasePanelParams {
	type: "absorber";
	absorberType: "porous" | "helmholtz";
	cavityDepth?: number;
	holeDiameter?: number;
	holeSpacing?: number;
	wallThickness?: number;
	backingPlateThickness?: number;
	edgeFrameProfile?: FrameProfile;
	kerf?: number;
}
