import type { Dimensions } from "../types/types";

/**
 * Physical properties for different material types
 */
export interface MaterialDefinition {
	id: string;
	name: string;
	type: "wood" | "composite" | "metal";

	// Physical properties
	density: number; // kg/m³
	thicknesses: ThicknessOption[];
	kerf?: number; // Cutting loss in mm

	// Pricing (optional)
	pricePerM2?: number; // USD per square meter
	pricePerUnit?: number; // USD per standard unit

	// Availability
	available: boolean;
}

/**
 * Thickness options for a material
 */
export interface ThicknessOption {
	thickness: number; // in mm
	name: string;
	priceMultiplier?: number; // Price adjustment factor
}

/**
 * Default material definitions with common properties
 */
const DEFAULT_MATERIALS: Record<string, MaterialDefinition> = {
	"plywood-18mm": {
		id: "plywood-18mm",
		name: "Plywood 18mm",
		type: "wood",
		density: 700,
		thicknesses: [
			{ thickness: 9, name: "9mm" },
			{ thickness: 12, name: "12mm" },
			{ thickness: 18, name: "18mm", priceMultiplier: 1.0 },
			{ thickness: 25, name: "25mm" },
		],
		kerf: 3, // Table saw kerf
		pricePerM2: 45,
		available: true,
	},

	"mdf-15mm": {
		id: "mdf-15mm",
		name: "MDF 15mm",
		type: "composite",
		density: 650,
		thicknesses: [
			{ thickness: 9, name: "9mm" },
			{ thickness: 12, name: "12mm" },
			{ thickness: 15, name: "15mm", priceMultiplier: 1.0 },
			{ thickness: 18, name: "18mm" },
		],
		kerf: 3, // Table saw kerf
		pricePerM2: 35,
		available: true,
	},

	"hardboard-9mm": {
		id: "hardboard-9mm",
		name: "Hardboard 9mm",
		type: "composite",
		density: 800,
		thicknesses: [
			{ thickness: 6, name: "6mm" },
			{ thickness: 9, name: "9mm", priceMultiplier: 1.0 },
			{ thickness: 12, name: "12mm" },
		],
		kerf: 2, // Laser cutter kerf
		pricePerM2: 25,
		available: true,
	},

	"medium-density-fiberboard": {
		id: "medium-density-fiberboard",
		name: "Medium Density Fiberboard (MDF)",
		type: "composite",
		density: 700,
		thicknesses: [
			{ thickness: 12, name: "12mm" },
			{ thickness: 15, name: "15mm", priceMultiplier: 1.0 },
			{ thickness: 18, name: "18mm" },
			{ thickness: 25, name: "25mm" },
		],
		kerf: 3, // Table saw kerf
		pricePerM2: 30,
		available: true,
	},
};

/**
 * Database of common acoustic panel materials (populated at runtime)
 */
export const MATERIALS = {} as Record<string, MaterialDefinition>;

// Initialize MATERIALS after DEFAULT_MATERIALS is defined
Object.assign(MATERIALS, DEFAULT_MATERIALS);

/**
 * Get material definition by ID
 */
export function getMaterial(id: string): MaterialDefinition | undefined {
	return MATERIALS[id];
}

/**
 * Get all available materials
 */
export function getAllMaterials(): MaterialDefinition[] {
	return Object.values(MATERIALS).filter((m) => m.available);
}

/**
 * Get material thickness options
 */
export function getMaterialThicknesses(
	materialId: string,
): ThicknessOption[] | undefined {
	const material = MATERIALS[materialId];
	return material?.thicknesses;
}

/**
 * Get default material by ID
 */
export function getDefaultMaterial(id: string): MaterialDefinition | undefined {
	return DEFAULT_MATERIALS[id];
}

/**
 * Calculate sheet dimensions for a given material thickness
 */
export function getSheetDimensions(thickness: number): Dimensions {
	// Standard sheet sizes based on thickness
	if (thickness <= 12) {
		return { width: 2400, height: 1200 }; // 4x8 feet for thinner materials
	} else if (thickness <= 18) {
		return { width: 2440, height: 1220 }; // Standard plywood size
	} else {
		return { width: 2440, height: 1220 }; // Large format for thicker materials
	}
}

/**
 * Get recommended material for panel type
 */
export function getRecommendedMaterial(panelType: string): string | undefined {
	const recommendations: Record<string, string> = {
		qrd: "plywood-18mm",
		skyline: "mdf-15mm",
		abfusor: "hardboard-9mm",
		absorber: "medium-density-fiberboard",
	};

	return recommendations[panelType] || "plywood-18mm";
}
