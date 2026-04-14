import type { PanelGeometry, CutPiece, Dimensions } from "../types/types";
import type {
	MaterialUsage,
	WasteAnalysis,
	EstimatedCost,
	CostBreakdown,
	TotalCost,
} from "../types/types";

/**
 * Calculates material usage and waste for acoustic panels
 */
export class MaterialCalculator {
	/**
	 * Calculate total material usage from panel geometry
	 */
	calculateUsage(
		geometry: PanelGeometry,
		includeBacking = true,
		includeFrame = false,
	): MaterialUsage {
		let wellsArea = 0;
		let backingArea = 0;
		let frameArea = 0;

		for (const cell of geometry.cells) {
			wellsArea += cell.width * cell.height;
		}

		if (includeBacking && geometry.boundingBox.depth > 0) {
			backingArea = geometry.boundingBox.width * geometry.boundingBox.height;
		}

		if (includeFrame) {
			frameArea = this.calculateFrameArea(geometry);
		}

		const totalAreaM2 = (wellsArea + backingArea + frameArea) / 1_000_000; // Convert mm² to m²

		return {
			totalAreaM2,
			byComponent: {
				wells: wellsArea / 1_000_000,
				backing: backingArea / 1_000_000,
				frame: frameArea / 1_000_000,
				waste: 0, // Will be calculated separately
			},
		};
	}

	private calculateFrameArea(geometry: PanelGeometry): number {
		const perimeter = geometry.boundingBox.width + geometry.boundingBox.height;
		const frameThickness = 5; // Default 5mm frame thickness

		return (perimeter * frameThickness) / 1_000_000; // Convert mm² to m²
	}

	/**
	 * Calculate waste from cut list and sheet material
	 */
	calculateWaste(
		cutList: CutPiece[],
		sheetSize: Dimensions,
		defaultPricePerM2 = 45,
	): WasteAnalysis {
		const totalArea = this.calculateTotalArea(cutList);
		const sheetArea = sheetSize.width * sheetSize.height;

		let sheetsUsed = Math.ceil(totalArea / (sheetArea / 1_000_000));

		if (sheetsUsed === 0) {
			sheetsUsed = 1;
		}

		const totalSheetArea = sheetsUsed * sheetArea;
		const wasteArea = Math.max(
			0,
			totalSheetArea - (totalArea + sheetsUsed * 500_000),
		); // Assume 500,000 mm² per sheet for kerf/waste

		const wastePercentage =
			totalArea > 0 ? Math.max(0, (wasteArea / totalSheetArea) * 100) : 0;

		return {
			totalWasteM2: Math.max(0, wasteArea / 1_000_000),
			wastePercentage,
			sheetsUsed,
			sheetsRemaining:
				sheetsUsed > 0
					? sheetsUsed - Math.ceil(totalArea / (sheetArea / 1_000_000))
					: 0,
		};
	}

	private calculateTotalArea(cutList: CutPiece[]): number {
		return cutList.reduce((total, piece) => {
			return total + piece.width * piece.height * piece.quantity;
		}, 0);
	}

	/**
	 * Estimate cost based on material type and usage
	 */
	estimateCost(
		materialType: string,
		usage: number, // in m²
		pricePerUnit = 45, // Default $45 per m²
		wasteOverheadPercentage = 10,
	): EstimatedCost {
		const materialPrice = this.getMaterialPrice(materialType, pricePerUnit);

		const materialsCost = usage * materialPrice;
		const wasteOverhead = materialsCost * (wasteOverheadPercentage / 100);
		const total = materialsCost + wasteOverhead;

		return {
			total,
			currency: "USD",
			breakdown: {
				materials: materialsCost,
				wasteOverhead,
				labor: undefined, // Can be added later
			},
		};
	}

	private getMaterialPrice(materialType: string, defaultPrice = 45): number {
		const prices: Record<string, number> = {
			"plywood-18mm": 45,
			"mdf-15mm": 35,
			"hardboard-9mm": 25,
			"medium-density-fiberboard": 30,
		};

		return prices[materialType] || defaultPrice;
	}

	/**
	 * Calculate cost breakdown by component
	 */
	breakDownCosts(
		geometry: PanelGeometry,
		materialType: string,
		pricePerM2 = 45,
	): CostBreakdown {
		const usage = this.calculateUsage(geometry);
		const materialPrice = this.getMaterialPrice(materialType, pricePerM2);

		const wellsCost = usage.byComponent.wells * materialPrice;
		const backingCost = usage.byComponent.backing * materialPrice;
		const frameCost = usage.byComponent.frame * materialPrice;
		const wasteCost =
			(usage.totalAreaM2 -
				usage.byComponent.wells -
				usage.byComponent.backing -
				usage.byComponent.frame) *
			materialPrice;

		return {
			wells: wellsCost,
			backingPlate: backingCost,
			edgeFrame: frameCost,
			waste: wasteCost,
			subtotal: wellsCost + backingCost + frameCost + wasteCost,
		};
	}

	/**
	 * Calculate total cost including labor (optional)
	 */
	calculateTotalCost(
		breakdown: CostBreakdown,
		laborRatePerHour = 50,
		laborHours = 2,
	): TotalCost {
		const materials = breakdown.subtotal;
		const wasteOverhead = breakdown.waste;
		const labor = laborRatePerHour * laborHours;

		return {
			materials,
			wasteOverhead,
			labor,
			total: materials + wasteOverhead + labor,
			currency: "USD",
		};
	}

	/**
	 * Get material price for a specific type
	 */
	getMaterialPrice(materialType: string, defaultPrice = 45): number {
		const prices: Record<string, number> = {
			"plywood-18mm": 45,
			"mdf-15mm": 35,
			"hardboard-9mm": 25,
			"medium-density-fiberboard": 30,
		};

		return prices[materialType] || defaultPrice;
	}
}
