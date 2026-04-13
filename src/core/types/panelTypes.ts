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
}

export interface SkylineParams extends BasePanelParams {
	type: "skyline";

	gridSize: number;
	prime: number;
	designFrequency: number;

	wellWidth: number;
	maxDepth?: number;
	speedOfSound?: number;
}

export interface AbfusorParams extends BasePanelParams {
	type: "abfusor";

	pattern?: number[]; // binary (0/1)
	depthA: number;
	depthB: number;
}

export interface AbsorberParams extends BasePanelParams {
	type: "absorber";

	absorberType: "porous" | "helmholtz";

	cavityDepth?: number;
	holeDiameter?: number;
	holeSpacing?: number;
}

export type PanelParams =
	| QrdParams
	| SkylineParams
	| AbfusorParams
	| AbsorberParams;
