import type { PanelGeometry, CutPiece } from "../types/types";
import type { CostBreakdown, TotalCost, EstimatedCost } from "../types/types";
import { MaterialCalculator } from "../materials/MaterialCalculator";
import { getMaterial, getDefaultMaterial } from "../materials/MaterialDatabase";

/**
 * Estimates costs for acoustic panel construction
 */
export class CostEstimator {
	private calculator: MaterialCalculator;

	constructor() {
		this.calculator = new MaterialCalculator();
	}

	/**
	 * Estimate total cost for a panel geometry
	 */
	estimateTotalCost(
		geometry: PanelGeometry,
		materialType: string,
		includeLabor = false,
		laborRatePerHour = 50,
		laborHours = 2,
	): TotalCost {
		const breakdown = this.breakDownCosts(geometry, materialType);

		return this.calculator.calculateTotalCost(
			breakdown,
			laborRatePerHour,
			laborHours,
		);
	}

	/**
	 * Get detailed cost breakdown by component
	 */
	breakDownCosts(
		geometry: PanelGeometry,
		materialType: string,
		pricePerM2 = 45,
	): CostBreakdown {
		const calculator = new MaterialCalculator();

		return calculator.breakDownCosts(geometry, materialType, pricePerM2);
	}

	/**
	 * Get estimated cost without full breakdown
	 */
	getEstimatedCost(
		materialType: string,
		usageM2: number,
		pricePerM2 = 45,
	): EstimatedCost {
		return this.calculator.estimateCost(materialType, usageM2, pricePerM2);
	}

	/**
	 * Get material price for a specific type
	 */
	getMaterialPrice(materialType: string, defaultPrice = 45): number {
		const material =
			getMaterial(materialType) || getDefaultMaterial(materialType);

		if (material?.pricePerM2 !== undefined) {
			return material.pricePerM2;
		}

		return defaultPrice;
	}

	/**
	 * Calculate cost with custom pricing
	 */
	calculateWithCustomPricing(
		breakdown: CostBreakdown,
		materialPrices: Record<string, number>,
		laborRatePerHour = 50,
		laborHours = 2,
	): TotalCost {
		const materials = breakdown.subtotal;
		const wasteOverhead = breakdown.waste;

		// Apply custom pricing adjustments
		let adjustedMaterials = materials;
		for (const component of ["wells", "backingPlate", "edgeFrame"]) {
			if (breakdown[component as keyof CostBreakdown] > 0) {
				const materialId = `material-${component}`;
				if (materialPrices[materialId]) {
					adjustedMaterials +=
						breakdown[component as keyof CostBreakdown] *
						((materialPrices[materialId] -
							this.getMaterialPrice(materialType)) /
							this.getMaterialPrice(materialType));
				}
			}
		}

		const labor = laborRatePerHour * laborHours;
		const total = adjustedMaterials + wasteOverhead + labor;

		return {
			materials: adjustedMaterials,
			wasteOverhead,
			labor,
			total,
			currency: "USD",
		};
	}

	/**
	 * Get cost per unit area
	 */
	getCostPerM2(geometry: PanelGeometry, materialType: string): number {
		const breakdown = this.breakDownCosts(geometry, materialType);
		const usage = new MaterialCalculator().calculateUsage(geometry);

		if (usage.totalAreaM2 > 0) {
			return breakdown.subtotal / usage.totalAreaM2;
		}

		return 0;
	}

	/**
	 * Compare costs between different materials
	 */
	compareMaterials(
		geometry: PanelGeometry,
		materialTypes: string[],
	): { materialType: string; totalCost: number; costPerM2: number }[] {
		return materialTypes.map((type) => ({
			materialType: type,
			totalCost: this.estimateTotalCost(geometry, type).total,
			costPerM2: this.getCostPerM2(geometry, type),
		}));
	}

	/**
	 * Get cost summary for display
	 */
	getCostSummary(
		geometry: PanelGeometry,
		materialType: string,
		laborRatePerHour = 50,
		laborHours = 2,
	): {
		total: number;
		breakdown: {
			materials: number;
			wasteOverhead: number;
			labor?: number;
		};
	} {
		const totalCost = this.estimateTotalCost(
			geometry,
			materialType,
			true,
			laborRatePerHour,
			laborHours,
		);

		return {
			total: totalCost.total,
			breakdown: {
				materials: totalCost.materials,
				wasteOverhead: totalCost.wasteOverhead,
				labor: totalCost.labor || undefined,
			},
		};
	}

	/**
	 * Format cost for display
	 */
	formatCurrency(amount: number): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(amount);
	}
}
