import { describe, it, expect } from "vitest";
import { CutListGenerator } from "../../core/cutList/CutListGenerator";
import type { PanelCell } from "../../core/types/types";

describe("CutListGenerator", () => {
	let generator: CutListGenerator;

	beforeEach(() => {
		generator = new CutListGenerator();
	});

	describe("generateCutList", () => {
		it("should generate cut list for QRD panel cells", () => {
			const cells: PanelCell[] = [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50.5, y: 0, width: 50, height: 50 },
				{ x: 101, y: 0, width: 50, height: 50 },
			];

			const cutList = generator.generateCutList(cells);

			expect(cutList).toHaveLength(1);
			expect(cutList[0].quantity).toBe(3);
			expect(cutList[0].width).toBeCloseTo(50, 1);
			expect(cutList[0].height).toBeCloseTo(50, 1);
		});

		it("should handle different sized cells", () => {
			const cells: PanelCell[] = [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50.5, y: 0, width: 100, height: 100 },
			];

			const cutList = generator.generateCutList(cells);

			expect(cutList).toHaveLength(2);
			expect(cutList[0].quantity).toBe(1);
			expect(cutList[1].quantity).toBe(1);
		});

		it("should apply kerf adjustments", () => {
			const cells: PanelCell[] = [{ x: 0, y: 0, width: 50, height: 50 }];

			const cutListWithKerf = generator.generateCutListWithKerf(
				cells,
				undefined,
				2,
			);

			expect(cutListWithKerf).toHaveLength(1);
			expect(cutListWithKerf[0].width).toBeCloseTo(48, 1); // 50 - 2mm kerf
			expect(cutListWithKerf[0].height).toBeCloseTo(48, 1);
		});

		it("should group identical cells", () => {
			const cells: PanelCell[] = [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50.5, y: 0, width: 50, height: 50 },
				{ x: 101, y: 0, width: 50, height: 50 },
				{ x: 151.5, y: 0, width: 50, height: 50 },
			];

			const cutList = generator.generateCutList(cells);

			expect(cutList).toHaveLength(1);
			expect(cutList[0].quantity).toBe(4);
		});
	});

	describe("groupByDimensions", () => {
		it("should group pieces by dimensions", () => {
			const cutPieces = [
				{ width: 50, height: 50, quantity: 2 },
				{ width: 100, height: 100, quantity: 3 },
				{ width: 50, height: 50, quantity: 1 }, // Same as first
			];

			const groups = generator.groupByDimensions(cutPieces);

			expect(groups.size).toBe(2);

			const group1 = groups.get("50.00x50.00");
			expect(group1).toBeDefined();
			if (group1) {
				expect(group1.reduce((sum, p) => sum + p.quantity, 0)).toBe(3);
			}

			const group2 = groups.get("100.00x100.00");
			expect(group2).toBeDefined();
			if (group2) {
				expect(group2[0].quantity).toBe(3);
			}
		});
	});

	describe("calculateTotalMaterial", () => {
		it("should calculate total material needed", () => {
			const cutList = [
				{ width: 50, height: 50, quantity: 4 },
				{ width: 100, height: 100, quantity: 2 },
			];

			const result = generator.calculateTotalMaterial(cutList);

			expect(result.areaM2).toBeGreaterThan(0);
			expect(result.widthRequired).toBeGreaterThanOrEqual(100.5); // Max dimension + kerf
			expect(result.heightRequired).toBeGreaterThanOrEqual(100.5);
		});

		it("should account for kerf in dimensions", () => {
			const cutList = [{ width: 50, height: 50, quantity: 1 }];

			const resultWithKerf = generator.calculateTotalMaterial(cutList, 2);
			const resultWithoutKerf = generator.calculateTotalMaterial(cutList, 0);

			expect(resultWithKerf.widthRequired).toBeGreaterThanOrEqual(52);
			expect(resultWithoutKerf.widthRequired).toBeCloseTo(50, 1);
		});
	});

	describe("optimizeNesting", () => {
		it("should optimize nesting for similar pieces", () => {
			const cutPieces = [
				{ width: 50, height: 50, quantity: 6 }, // Should fit on 2 sheets of 100x100
				{ width: 100, height: 100, quantity: 2 },
			];

			const sheetSize = { width: 1000, height: 1000 };
			const result = generator.optimizeNesting(cutPieces, sheetSize);

			expect(result.sheetsNeeded).toBeGreaterThanOrEqual(1);
			expect(result.layout.length).toBeGreaterThan(0);
		});

		it("should calculate waste percentage", () => {
			const cutPieces = [{ width: 50, height: 50, quantity: 4 }];

			const sheetSize = { width: 100, height: 100 };
			const result = generator.optimizeNesting(cutPieces, sheetSize);

			expect(result.layout[0].wastePercentage).toBeGreaterThanOrEqual(0);
			expect(result.layout[0].wastePercentage).toBeLessThan(100);
		});
	});

	describe("getComponentCutList", () => {
		it("should filter by component purpose", () => {
			const cutList = [
				{ width: 50, height: 50, quantity: 2, purpose: "wall" },
				{ width: 10, height: 10, quantity: 4, purpose: "backing" },
			];

			const walls = generator.getComponentCutList(cutList, "wall");
			const backing = generator.getComponentCutList(cutList, "backing");

			expect(walls).toHaveLength(1);
			expect(backing).toHaveLength(1);
		});
	});
});
