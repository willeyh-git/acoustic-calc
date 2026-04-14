import { describe, it, expect } from "vitest";
import { MaterialCalculator } from "../../core/materials/MaterialCalculator";
import type { PanelGeometry } from "../../core/types/types";

describe("MaterialCalculator", () => {
	let calculator: MaterialCalculator;

	beforeEach(() => {
		calculator = new MaterialCalculator();
	});

	describe("calculateUsage", () => {
		it("should calculate material usage for simple panel", () => {
			const geometry: PanelGeometry = {
				cells: [
					{ x: 0, y: 0, width: 500, height: 500 },
					{ x: 500.5, y: 0, width: 500, height: 500 },
				],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const usage = calculator.calculateUsage(geometry);

			expect(usage.totalAreaM2).toBeGreaterThan(0);
			expect(usage.byComponent.wells).toBeCloseTo(0.5, 2); // 2 cells * 0.25 m² each
			expect(usage.byComponent.backing).toBeCloseTo(0.5, 2); // 1m x 0.5m
		});

		it("should handle backing plate calculation", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const usageWithBacking = calculator.calculateUsage(geometry, true);
			const usageWithoutBacking = calculator.calculateUsage(geometry, false);

			expect(usageWithBacking.byComponent.backing).toBeGreaterThan(0);
			expect(usageWithoutBacking.byComponent.backing).toBeCloseTo(0, 2);
		});

		it("should handle frame calculation", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const usageWithFrame = calculator.calculateUsage(geometry, false, true);
			const usageWithoutFrame = calculator.calculateUsage(
				geometry,
				false,
				false,
			);

			expect(usageWithFrame.byComponent.frame).toBeGreaterThan(
				usageWithoutFrame.byComponent.frame,
			);
		});
	});

	describe("calculateWaste", () => {
		it("should calculate waste from cut list", () => {
			const cutList = [{ width: 50, height: 50, quantity: 4 }];

			const sheetSize = { width: 100, height: 100 };
			const waste = calculator.calculateWaste(cutList, sheetSize);

			// With perfect fit (4x50mm squares on one 100x100 sheet), waste should be minimal or zero
			expect(waste.sheetsUsed).toBeGreaterThanOrEqual(1);
			expect(waste.wastePercentage).toBeGreaterThanOrEqual(0);
		});

		it("should calculate waste percentage correctly", () => {
			const cutList = [
				{ width: 50, height: 50, quantity: 4 }, // Total area: 10,000 mm² = 0.01 m²
			];

			const sheetSize = { width: 100, height: 100 }; // Sheet area: 10,000 mm² = 0.01 m²
			const waste = calculator.calculateWaste(cutList, sheetSize);

			expect(waste.wastePercentage).toBeCloseTo(0, 1); // Should be minimal waste
		});
	});

	describe("estimateCost", () => {
		it("should estimate cost for material usage", () => {
			const estimatedCost = calculator.estimateCost("plywood-18mm", 1);

			expect(estimatedCost.total).toBeGreaterThan(0);
			expect(estimatedCost.currency).toBe("USD");
			expect(estimatedCost.breakdown.materials).toBeGreaterThan(0);
		});

		it("should include waste overhead in cost", () => {
			const estimatedCost = calculator.estimateCost("plywood-18mm", 1, 45, 15);

			expect(estimatedCost.breakdown.wasteOverhead).toBeGreaterThan(0);
			expect(estimatedCost.total).toBeGreaterThan(
				estimatedCost.breakdown.materials,
			);
		});

		it("should use correct material price", () => {
			const estimatedCost = calculator.estimateCost("mdf-15mm", 1, 35);

			expect(estimatedCost.breakdown.materials).toBeCloseTo(35, 0); // $35/m² * 1 m²
		});
	});

	describe("breakDownCosts", () => {
		it("should break down costs by component", () => {
			const geometry: PanelGeometry = {
				cells: [
					{ x: 0, y: 0, width: 500, height: 500 },
					{ x: 500.5, y: 0, width: 500, height: 500 },
				],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const breakdown = calculator.breakDownCosts(geometry, "plywood-18mm");

			expect(breakdown.wells).toBeGreaterThan(0);
			expect(breakdown.backingPlate).toBeGreaterThan(0);
			expect(breakdown.subtotal).toBeGreaterThan(0);
		});

		it("should include waste in breakdown", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const breakdown = calculator.breakDownCosts(geometry, "plywood-18mm");

			expect(breakdown.waste).toBeGreaterThanOrEqual(0);
			expect(breakdown.subtotal).toBeGreaterThanOrEqual(
				breakdown.wells + breakdown.backingPlate + breakdown.edgeFrame,
			);
		});
	});

	describe("getMaterialPrice", () => {
		it("should return correct price for known materials", () => {
			expect(calculator.getMaterialPrice("plywood-18mm")).toBe(45);
			expect(calculator.getMaterialPrice("mdf-15mm")).toBe(35);
			expect(calculator.getMaterialPrice("hardboard-9mm")).toBe(25);
		});

		it("should return default price for unknown materials", () => {
			const price = calculator.getMaterialPrice("unknown-material");
			expect(price).toBe(45); // Default price
		});
	});
});
