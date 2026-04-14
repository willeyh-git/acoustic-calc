import type { Dimensions } from "./types";

/**
 * Represents a single piece to be cut for construction
 */
export interface CutPiece extends Omit<Dimensions, "depth"> {
	quantity: number;
	label?: string;
	purpose?: "wall" | "backing" | "frame" | "well";
	materialType?: string;
}

/**
 * Represents a layout of pieces on a sheet material
 */
export interface Layout {
	sheetSize: Dimensions;
	pieces: CutPiece[];
	wastePercentage: number;
}

/**
 * Types of standard sheet materials available
 */
export type SheetMaterial =
	| "plywood-18mm"
	| "mdf-15mm"
	| "hardboard-9mm"
	| "medium-density-fiberboard";
