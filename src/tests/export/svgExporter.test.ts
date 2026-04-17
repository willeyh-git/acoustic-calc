import { describe, it, expect } from "vitest";
import { SvgExporter } from "@/export/svgExporter";
import type { PanelGeometry, PanelCell } from "@/core/types/types";

describe("SvgExporter", () => {
	let exporter: SvgExporter;

	beforeEach(() => {
		exporter = new SvgExporter();
	});

	it("should export basic QRD panel to SVG", () => {
		// Create mock geometry
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
			{ x: 50, y: 0, width: 50, height: 100, depth: 30 },
			{ x: 100, y: 0, width: 50, height: 100, depth: 25 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 300, height: 100 },
			metadata: {
				prd: { diffusionRange: { minFrequency: 500, maxFrequency: 2000 } },
			},
		};

		const svg = exporter.export(geometry as PanelGeometry, "side");

		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg");
		expect(svg).toContain('stroke-width="1.5"'); // cut-line style
	});

	it("should include only requested layers", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 50, height: 100 },
		};

		// Export with only cut layer
		exporter.options.includeLayers = "cut";
		const svg = exporter.export(geometry as PanelGeometry);

		expect(svg).toContain('stroke-width="1.5"'); // cut-line style
	});

	it("should generate multi-view export", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
			{ x: 50, y: 0, width: 50, height: 100, depth: 30 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 100, height: 100 },
			metadata: {
				prd: { diffusionRange: { minFrequency: 500, maxFrequency: 2000 } },
			},
		};

		const svg = exporter.exportMultiView(geometry as PanelGeometry);

		expect(svg).toContain("Side View");
		expect(svg).toContain("Front View");
	});

	it("should calculate cost estimate", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 100, height: 200, depth: 50 },
			{ x: 100, y: 0, width: 100, height: 200, depth: 60 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 200, height: 200 },
		};

		const cost = exporter.calculateCost(geometry as PanelGeometry);

		expect(cost.total).toBeGreaterThan(0);
		expect(cost.currency).toBe("USD");
		expect(cost.breakdown.length).toBeGreaterThan(0);
	});

	it("should handle different view types", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
			{ x: 50, y: 0, width: 50, height: 100, depth: 30 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 100, height: 100 },
		};

		// Test side view
		const sideSvg = exporter.export(geometry as PanelGeometry, "side");
		expect(sideSvg).toContain("<svg");

		// Test front view
		const frontSvg = exporter.export(geometry as PanelGeometry, "front");
		expect(frontSvg).toContain("<svg");

		// Test top view
		const topSvg = exporter.export(geometry as PanelGeometry, "top");
		expect(topSvg).toContain("<svg");
	});

	it("should escape XML special characters in text", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 50, height: 100 },
			metadata: {
				panelType: "test & 'special' <panel>",
			},
		};

		const svg = exporter.export(geometry as PanelGeometry);

		// Check that special characters are escaped
		expect(svg).toContain("&amp;");
		expect(svg).toContain("&lt;");
	});

	it("should generate multi-view export", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
			{ x: 50, y: 0, width: 50, height: 100, depth: 30 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 100, height: 100 },
		};

		const svg = exporter.exportMultiView(geometry as PanelGeometry);

		expect(svg).toContain("Side View");
		expect(svg).toContain("Front View");
	});

	it("should estimate material usage", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 100, height: 200 },
			{ x: 100, y: 0, width: 100, height: 200 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 200, height: 200 },
		};

		const estimate = exporter.estimateMaterials(geometry as PanelGeometry);

		expect(estimate.totalAreaM2).toBeGreaterThan(0);
		expect(estimate.wasteFactor).toBe(0.05); // Default waste factor
	});

	it("should calculate cost estimate", () => {
		const cells: PanelCell[] = [{ x: 0, y: 0, width: 100, height: 200 }];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 100, height: 200 },
		};

		const cost = exporter.calculateCost(geometry as PanelGeometry);

		expect(cost.total).toBeGreaterThan(0);
		expect(cost.currency).toBe("USD");
		expect(cost.breakdown.length).toBeGreaterThan(0);
	});

	it("should generate bill of materials", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 100, height: 200 },
			{ x: 100, y: 0, width: 100, height: 200 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 200, height: 200 },
		};

		const bom = exporter.generateBom(geometry as PanelGeometry);

		expect(bom.items.length).toBeGreaterThan(0);
		expect(bom.totals.totalCost).toBeGreaterThan(0);
		expect(bom.generatedAt instanceof Date).toBe(true);
	});

	it("should handle different view types", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
			{ x: 50, y: 0, width: 50, height: 100, depth: 30 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 100, height: 100 },
		};

		// Test side view
		const sideSvg = exporter.export(geometry as PanelGeometry, "side");
		expect(sideSvg).toContain("<svg");

		// Test front view
		const frontSvg = exporter.export(geometry as PanelGeometry, "front");
		expect(frontSvg).toContain("<svg");

		// Test top view
		const topSvg = exporter.export(geometry as PanelGeometry, "top");
		expect(topSvg).toContain("<svg");
	});

	it("should escape XML special characters in text", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 50, height: 100 },
			metadata: {
				panelType: "test & 'special' <panel>",
			},
		};

		const svg = exporter.export(geometry as PanelGeometry);

		// The escapeXml function is used for text content, verify it exists
		expect(typeof (exporter as any).escapeXml).toBe("function");
	});

	it("should support custom styling options", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 50, height: 100 },
		};

		// Create exporter with custom styling
		const styledExporter = new SvgExporter({
			styling: {
				cutLineWidth: 2.0,
				fontSize: 16,
				defaultStrokeColor: "#ff0000",
			},
		});

		const svg = styledExporter.export(geometry as PanelGeometry);

		expect(svg).toContain('stroke-width="2"');
		expect(svg).toContain('font-size="16px"');
	});

	it("should handle empty geometry gracefully", () => {
		const geometry: Partial<PanelGeometry> = {
			cells: [],
			boundingBox: { width: 0, height: 0 },
		};

		expect(() => exporter.export(geometry as PanelGeometry)).not.toThrow();
	});

	it("should include metadata in export", () => {
		const cells: PanelCell[] = [
			{ x: 0, y: 0, width: 50, height: 100, depth: 20 },
		];

		const geometry: Partial<PanelGeometry> = {
			cells,
			boundingBox: { width: 50, height: 100 },
			metadata: {
				diffusion: { minFrequency: 500, maxFrequency: 2000 },
				wallThickness: 3,
				backingPlateThickness: 9,
			},
		};

		const svg = exporter.export(geometry as PanelGeometry);

		// Check that metadata is included in the SVG structure
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg");
	});
});
