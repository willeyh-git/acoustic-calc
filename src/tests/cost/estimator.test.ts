import { describe, it, expect } from "vitest";
import { CostEstimator } from "../../core/cost/CostEstimator";
import type { PanelGeometry } from "../../core/types/types";

describe("CostEstimator", () => {
	let estimator: CostEstimator;

	beforeEach(() => {
		estimator = new CostEstimator();
	});

	describe("estimateTotalCost", () => {
		it("should estimate total cost for panel geometry", () => {
			const geometry: PanelGeometry = {
				cells: [
					{ x: 0, y: 0, width: 500, height: 500 },
					{ x: 500.5, y: 0, width: 500, height: 500 },
				],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const totalCost = estimator.estimateTotalCost(geometry, "plywood-18mm");

			expect(totalCost.total).toBeGreaterThan(0);
			expect(totalCost.currency).toBe("USD");
			expect(totalCost.materials).toBeGreaterThan(0);
		});

		it("should include labor cost when requested", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const totalCostWithLabor = estimator.estimateTotalCost(
				geometry,
				"plywood-18mm",
				true,
			);
			const totalCostWithoutLabor = estimator.estimateTotalCost(
				geometry,
				"plywood-18mm",
				false,
			);

			expect(totalCostWithLabor.total).toBeGreaterThanOrEqual(
				totalCostWithoutLabor.total,
			);
		});

		it("should use custom labor rate and hours", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const totalCost = estimator.estimateTotalCost(
				geometry,
				"plywood-18mm",
				true,
				75,
				3,
			);

			expect(totalCost.labor).toBeGreaterThan(0);
			expect(totalCost.labor).toBeCloseTo(225, 0); // $75/hour * 3 hours = $225 (not $2250)
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

			const breakdown = estimator.breakDownCosts(geometry, "plywood-18mm");

			expect(breakdown.wells).toBeGreaterThan(0);
			expect(breakdown.backingPlate).toBeGreaterThan(0);
			expect(breakdown.subtotal).toBeGreaterThan(0);
		});

		it("should include waste in breakdown", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const breakdown = estimator.breakDownCosts(geometry, "plywood-18mm");

			expect(breakdown.waste).toBeGreaterThanOrEqual(0);
			expect(breakdown.subtotal).toBeGreaterThanOrEqual(
				breakdown.wells + breakdown.backingPlate + breakdown.edgeFrame,
			);
		});

		it("should use custom price per m²", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const breakdown = estimator.breakDownCosts(geometry, "mdf-15mm", 30);

			expect(breakdown.wells).toBeGreaterThan(0);
		});
	});

	describe("getMaterialPrice", () => {
		it("should return correct price for known materials", () => {
			expect(estimator.getMaterialPrice("plywood-18mm")).toBe(45);
			expect(estimator.getMaterialPrice("mdf-15mm")).toBe(35);
			expect(estimator.getMaterialPrice("hardboard-9mm")).toBe(25);
		});

		it("should return default price for unknown materials", () => {
			const price = estimator.getMaterialPrice("unknown-material");
			expect(price).toBe(45); // Default price
		});
	});

	describe("compareMaterials", () => {
		it("should compare costs between different materials", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const comparison = estimator.compareMaterials(geometry, [
				"plywood-18mm",
				"mdf-15mm",
			]);

			expect(comparison).toHaveLength(2);
			comparison.forEach((item) => {
				expect(item.totalCost).toBeGreaterThan(0);
				expect(item.costPerM2).toBeGreaterThan(0);
			});
		});
	});

	describe("getCostSummary", () => {
		it("should provide cost summary for display", () => {
			const geometry: PanelGeometry = {
				cells: [{ x: 0, y: 0, width: 500, height: 500 }],
				boundingBox: { width: 1000, height: 500, depth: 18 },
			};

			const summary = estimator.getCostSummary(geometry, "plywood-18mm");

			expect(summary.total).toBeGreaterThan(0);
			expect(summary.breakdown.materials).toBeGreaterThan(0);
		});
	});

	describe("formatCurrency", () => {
		it("should format currency correctly", () => {
			const formatted = estimator.formatCurrency(1234.56);

			expect(formatted).toContain("$");
			expect(formatted).toMatch(/\d{3}\.\d{2}/);
		});
	});
});
