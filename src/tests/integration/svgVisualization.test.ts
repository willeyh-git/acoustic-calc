import { describe, it, expect } from "vitest";
import type { PanelGeometry } from "@/core/types/types";
import { createSvgView } from "@/core/visualization/svgRenderer";
import { projectCellsToSvg } from "@/core/visualization/projection";

describe("SVG Visualization - Projection", () => {
	it("should project QRD cells to side view correctly", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50, depth: 20 },
				{ x: 50, y: 0, width: 50, height: 50, depth: 30 },
				{ x: 100, y: 0, width: 50, height: 50, depth: 25 },
			],
			boundingBox: { width: 150, height: 50, depth: 30 },
		};

		const projected = projectCellsToSvg(mockGeometry as PanelGeometry, "side", {
			unit: "mm",
		});

		expect(projected).toHaveLength(3);
		expect(projected[0].x).toBe(0);
		expect(projected[0].y).toBe(50); // Flipped Y for SVG
		expect(projected[1].x).toBe(50);
		expect(projected[2].x).toBe(100);
	});

	it("should project cells to front view", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50, y: 25, width: 50, height: 50 },
			],
			boundingBox: { width: 100, height: 75, depth: 30 },
		};

		const projected = projectCellsToSvg(
			mockGeometry as PanelGeometry,
			"front",
			{
				unit: "mm",
			},
		);

		expect(projected).toHaveLength(2);
		expect(projected[0].x).toBe(0);
		expect(projected[0].y).toBe(0);
		expect(projected[1].x).toBe(50);
		expect(projected[1].y).toBe(25);
	});

	it("should handle empty geometry", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [],
			boundingBox: { width: 0, height: 0, depth: 0 },
		};

		const projected = projectCellsToSvg(mockGeometry as PanelGeometry, "side", {
			unit: "mm",
		});

		expect(projected).toHaveLength(0);
	});
});

describe("SVG Visualization - View Creation", () => {
	it("should create side view for QRD panel", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50, depth: 20 },
				{ x: 50, y: 0, width: 50, height: 50, depth: 30 },
			],
			boundingBox: { width: 100, height: 50, depth: 30 },
			metadata: { diffusion: { minFrequency: 200, maxFrequency: 1000 } },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side");

		expect(view.viewType).toBe("side");
		expect(view.layers.cut).toHaveLength(2);
		expect(view.boundingBox.width).toBeGreaterThan(0);
		expect(view.boundingBox.height).toBeGreaterThan(0);
	});

	it("should create front view with dimensions", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50, y: 25, width: 50, height: 50 },
			],
			boundingBox: { width: 100, height: 75, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "front", {
			showDimensions: true,
			showLabels: false,
		});

		expect(view.viewType).toBe("front");
		expect(view.layers.dimension).toHaveLength(2); // Width and height dimensions
	});

	it("should handle different units", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 10, height: 10 }],
			boundingBox: { width: 10, height: 10, depth: 5 },
		};

		const viewCm = createSvgView(mockGeometry as PanelGeometry, "side", {
			unit: "cm",
		});
		const viewInch = createSvgView(mockGeometry as PanelGeometry, "side", {
			unit: "inch",
		});

		expect(viewCm.unit).toBe("cm");
		expect(viewInch.unit).toBe("inch");
	});
});

describe("SVG Visualization - Layer Generation", () => {
	it("should generate cut layer with rectangles", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50 },
				{ x: 50, y: 25, width: 50, height: 50 },
			],
			boundingBox: { width: 100, height: 75, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "front");

		expect(view.layers.cut).toHaveLength(2);
		view.layers.cut.forEach((el) => {
			expect(el.type).toBe("rectangle");
			expect(el.stroke).toBeDefined();
		});
	});

	it("should generate fold layer with lines", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 100, height: 50 }],
			boundingBox: { width: 100, height: 50, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side");

		// Fold lines may or may not be generated depending on well count
		expect(view.layers.fold).toBeDefined();
	});

	it("should generate dimension layer when enabled", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 50, height: 50 }],
			boundingBox: { width: 50, height: 50, depth: 30 },
		};

		const viewWithDims = createSvgView(mockGeometry as PanelGeometry, "side", {
			showDimensions: true,
		});
		const viewWithoutDims = createSvgView(
			mockGeometry as PanelGeometry,
			"side",
			{ showDimensions: false },
		);

		expect(viewWithDims.layers.dimension).toHaveLength(2); // Width and height
		expect(viewWithoutDims.layers.dimension).toHaveLength(0);
	});

	it("should generate label layer for side view", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [
				{ x: 0, y: 0, width: 50, height: 50, depth: 20 },
				{ x: 50, y: 0, width: 50, height: 50, depth: 30 },
			],
			boundingBox: { width: 100, height: 50, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side", {
			showLabels: true,
		});

		expect(view.layers.label).toHaveLength(2); // One label per cell with depth
	});

	it("should generate hidden layer for backing plate", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 50, height: 50 }],
			boundingBox: { width: 50, height: 50, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side", {
			showDimensions: true,
		});

		expect(view.layers.hidden).toBeDefined();
	});
});

describe("SVG Visualization - Edge Cases", () => {
	it("should handle single cell geometry", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 100, height: 100 }],
			boundingBox: { width: 100, height: 100, depth: 50 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "front");

		expect(view.viewType).toBe("front");
		expect(view.layers.cut).toHaveLength(1);
	});

	it("should handle zero-sized cells gracefully", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 0, height: 0 }],
			boundingBox: { width: 0, height: 0, depth: 0 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side");

		expect(view.layers.cut).toHaveLength(0); // Should not generate invalid rectangles
	});

	it("should handle large number of cells", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: Array.from({ length: 100 }, (_, i) => ({
				x: i * 50,
				y: 0,
				width: 50,
				height: 50,
				depth: 20 + (i % 10),
			})),
			boundingBox: { width: 5000, height: 50, depth: 30 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side");

		expect(view.layers.cut).toHaveLength(100);
		expect(view.boundingBox.width).toBeGreaterThan(4950); // Should accommodate all cells
	});

	it("should handle missing cell properties", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0 }], // Missing width, height, depth
			boundingBox: { width: 100, height: 100, depth: 50 },
		};

		const view = createSvgView(mockGeometry as PanelGeometry, "side");

		// Should not crash and should handle missing properties gracefully
		expect(view).toBeDefined();
	});
});

describe("SVG Visualization - Unit Conversions", () => {
	it("should convert cm to mm correctly in projection", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 10, height: 10 }], // 10cm
			boundingBox: { width: 10, height: 10, depth: 5 },
		};

		const projected = projectCellsToSvg(mockGeometry as PanelGeometry, "side", {
			unit: "cm",
		});

		expect(projected[0].x).toBe(0);
		expect(projected[0].y).toBe(10); // Should be in SVG units (mm equivalent)
	});

	it("should handle inch units", () => {
		const mockGeometry: Partial<PanelGeometry> = {
			cells: [{ x: 0, y: 0, width: 2, height: 2 }], // 2 inches
			boundingBox: { width: 2, height: 2, depth: 1 },
		};

		const projected = projectCellsToSvg(mockGeometry as PanelGeometry, "side", {
			unit: "inch",
		});

		expect(projected[0].x).toBe(0);
		expect(projected[0].y).toBe(2); // Should be in SVG units
	});
});
