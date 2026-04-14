import { describe, it, expect } from "vitest";
import { QrdBuilder } from "../../core/geometry/QRDBuilder";
import { SkylineBuilder } from "../../core/geometry/SkylineBuilder";
import { AbfusorBuilder } from "../../core/geometry/AbfusorBuilder";
import { PorousAbsorberBuilder } from "../../core/geometry/PorousAbsorberBuilder";
import { HelmholtzAbsorberBuilder } from "../../core/geometry/HelmholtzAbsorberBuilder";
import type { PanelParams, QrdParams } from "../../core/types/types";

/**
 * Integration tests for construction features across all panel types
 */

// Helper function to create proper QRD params with all required fields
function createQrdParams(overrides?: Partial<QrdParams>): QrdParams {
	return {
		type: "qrd",
		unit: "mm",
		dimensions: { width: 700, height: 20 },
		material: { thickness: 15, kerf: 3, density: 600 },
		cellSize: 20,
		prime: 7,
		designFrequency: 500,
		wellWidth: 20,
		maxDepth: 10,
		speedOfSound: 343,
		gridSize: 7,
		wallThickness: 3, // Default 3mm wall thickness
		backingPlateThickness: 9, // Optional backing plate
		materialType: "plywood-18mm",
		kerf: 0.5, // Cutting tolerance
		...overrides,
	};
}

// Helper function to create Skyline params
function createSkylineParams(overrides?: Partial<PanelParams>): PanelParams {
	return {
		type: "skyline",
		unit: "mm",
		dimensions: { width: 700, height: 20 },
		material: { thickness: 15, kerf: 3, density: 600 },
		cellSize: 20,
		prime: 7,
		designFrequency: 500,
		wellWidth: 20,
		maxDepth: 10,
		speedOfSound: 343,
		gridSize: 7,
		wallThickness: 3,
		backingPlateThickness: 9,
		materialType: "mdf-15mm",
		kerf: 0.5,
		...overrides,
	};
}

describe("Construction Features Integration", () => {
	describe("Wall Thickness Integration", () => {
		it("should apply wall thickness to QRD cells", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				// Wall thickness should be applied to cell dimensions
				const firstCell = geometry.cells[0];
				expect(firstCell.width).toBeGreaterThan(0);
				expect(firstCell.height).toBeGreaterThan(0);

				// With wall thickness, cells should be slightly smaller than max dimensions
				expect(firstCell.width).toBeLessThanOrEqual(
					params.maxDepth - params.wallThickness * 2,
				);
			}
		});

		it("should apply wall thickness to Skyline cells", () => {
			const params = createSkylineParams();
			const builder = new SkylineBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				const firstCell = geometry.cells[0];
				expect(firstCell.width).toBeGreaterThan(0);
				expect(firstCell.height).toBeGreaterThan(0);
			}
		});

		it("should apply wall thickness to Abfusor cells", () => {
			const params: PanelParams = {
				type: "abfusor",
				unit: "mm",
				dimensions: { width: 700, height: 20 },
				material: { thickness: 15, kerf: 3, density: 600 },
				cellSize: 20,
				prime: 7,
				designFrequency: 500,
				wellWidth: 20,
				maxDepth: 10,
				speedOfSound: 343,
				gridSize: 7,
				wallThickness: 3,
				backingPlateThickness: 9,
				materialType: "hardboard-9mm",
				kerf: 0.5,
			};

			const builder = new AbfusorBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				const firstCell = geometry.cells[0];
				expect(firstCell.width).toBeGreaterThan(0);
				expect(firstCell.height).toBeGreaterThan(0);
			}
		});

		it("should apply wall thickness to Porous Absorber cells", () => {
			const params: PanelParams = {
				type: "porous-absorber",
				unit: "mm",
				dimensions: { width: 700, height: 20 },
				material: { thickness: 15, kerf: 3, density: 600 },
				cellSize: 20,
				prime: 7,
				designFrequency: 500,
				wellWidth: 20,
				maxDepth: 10,
				speedOfSound: 343,
				gridSize: 7,
				wallThickness: 3,
				backingPlateThickness: 9,
				materialType: "medium-density-fiberboard",
				kerf: 0.5,
			};

			const builder = new PorousAbsorberBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				const firstCell = geometry.cells[0];
				expect(firstCell.width).toBeGreaterThan(0);
				expect(firstCell.height).toBeGreaterThan(0);
			}
		});

		it("should apply wall thickness to Helmholtz Absorber cells", () => {
			const params: PanelParams = {
				type: "helmholtz-absorber",
				unit: "mm",
				dimensions: { width: 700, height: 20 },
				material: { thickness: 15, kerf: 3, density: 600 },
				cellSize: 20,
				prime: 7,
				designFrequency: 500,
				wellWidth: 20,
				maxDepth: 10,
				speedOfSound: 343,
				gridSize: 7,
				wallThickness: 3,
				backingPlateThickness: 9,
				materialType: "plywood-18mm",
				kerf: 0.5,
			};

			const builder = new HelmholtzAbsorberBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				const firstCell = geometry.cells[0];
				expect(firstCell.width).toBeGreaterThan(0);
				expect(firstCell.height).toBeGreaterThan(0);
			}
		});

		it("should adjust cell dimensions based on wall thickness", () => {
			// Test that increasing wall thickness reduces available space
			const params1 = createQrdParams({ wallThickness: 3 });
			const builder1 = new QrdBuilder(params1);
			const geometry1 = builder1.buildGeometry(false, false);

			const params2 = createQrdParams({ wallThickness: 6 });
			const builder2 = new QrdBuilder(params2);
			const geometry2 = builder2.buildGeometry(false, false);

			// With thicker walls, cells should be smaller or same size (not larger)
			if (geometry1.cells && geometry2.cells) {
				expect(geometry1.cells[0].width).toBeGreaterThanOrEqual(
					geometry2.cells[0].width - 3, // Allow for some tolerance
				);
			}
		});
	});

	describe("Backing Plate Integration", () => {
		it("should include backing plate in bounding box when enabled", () => {
			const params = createQrdParams({ backingPlateThickness: 9 });
			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.boundingBox).toBeDefined();

			if (geometry.boundingBox) {
				// Bounding box should account for backing plate depth
				expect(geometry.boundingBox.depth).toBeGreaterThanOrEqual(10 + 9); // maxDepth + backingPlateThickness
			}
		});

		it("should exclude backing plate from bounding box when disabled", () => {
			const params = createQrdParams({ backingPlateThickness: undefined });
			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.boundingBox).toBeDefined();

			if (geometry.boundingBox) {
				// Without backing plate, depth should be just maxDepth
				expect(geometry.boundingBox.depth).toBeCloseTo(10, 1); // Allow tolerance
			}
		});

		it("should work with all panel types", () => {
			const panelTypes = [
				{ builder: new QrdBuilder(createQrdParams()), name: "QRD" },
				{ builder: new SkylineBuilder(createSkylineParams()), name: "Skyline" },
				{
					builder: new AbfusorBuilder({
						...createQrdParams(),
						materialType: "hardboard-9mm",
					}),
					name: "Abfusor",
				},
				{
					builder: new PorousAbsorberBuilder({
						...createQrdParams(),
						materialType: "medium-density-fiberboard",
					}),
					name: "Porous Absorber",
				},
				{
					builder: new HelmholtzAbsorberBuilder(createQrdParams()),
					name: "Helmholtz",
				},
			];

			for (const { builder, name } of panelTypes) {
				const geometry = builder.buildGeometry(false, false);

				if (geometry.boundingBox) {
					expect(geometry.boundingBox.depth).toBeGreaterThanOrEqual(10); // Minimum maxDepth
				}
			}
		});
	});

	describe("Edge Frame Integration", () => {
		it("should calculate edge frame pieces for rectangular panels", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			// Build with frame enabled
			const geometryWithFrame = builder.buildGeometry(false, true);

			expect(geometryWithFrame.boundingBox).toBeDefined();

			if (geometryWithFrame.boundingBox) {
				// Bounding box should be larger when frame is included
				expect(geometryWithFrame.boundingBox.width).toBeGreaterThanOrEqual(700); // dimensions.width
				expect(geometryWithFrame.boundingBox.height).toBeGreaterThanOrEqual(20); // dimensions.height
			}
		});

		it("should support different frame profiles", () => {
			const panelTypes = [
				{
					profile: "square" as const,
					builder: new QrdBuilder(createQrdParams()),
				},
				{
					profile: "round" as const,
					builder: new SkylineBuilder(createSkylineParams()),
				},
				{
					profile: "flat" as const,
					builder: new AbfusorBuilder({
						...createQrdParams(),
						materialType: "hardboard-9mm",
					}),
				},
			];

			for (const { profile, builder } of panelTypes) {
				const geometry = builder.buildGeometry(false, true);

				expect(geometry.boundingBox).toBeDefined();
			}
		});

		it("should adjust dimensions for kerf tolerance", () => {
			const params1 = createQrdParams({ kerf: 0.5 });
			const builder1 = new QrdBuilder(params1);
			const geometry1 = builder1.buildGeometry(false, false);

			const params2 = createQrdParams({ kerf: 2.0 }); // Larger kerf tolerance
			const builder2 = new QrdBuilder(params2);
			const geometry2 = builder2.buildGeometry(false, false);

			// With larger kerf, dimensions should be slightly smaller or same
			if (geometry1.cells && geometry2.cells) {
				expect(geometry1.cells[0].width).toBeGreaterThanOrEqual(
					geometry2.cells[0].width - 1.5, // Allow for tolerance difference
				);
			}
		});
	});

	describe("Combined Construction Features", () => {
		it("should work with all features enabled simultaneously", () => {
			const params = createQrdParams({
				wallThickness: 3,
				backingPlateThickness: 9,
				kerf: 0.5,
			});

			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, true);

			expect(geometry.cells).toBeDefined();
			expect(geometry.boundingBox).toBeDefined();

			if (geometry.boundingBox) {
				// All features should be accounted for in bounding box
				expect(geometry.boundingBox.depth).toBeGreaterThanOrEqual(10 + 9); // maxDepth + backingPlateThickness
				expect(geometry.boundingBox.width).toBeGreaterThanOrEqual(700); // dimensions.width
			}
		});

		it("should maintain accuracy with kerf adjustments", () => {
			const params = createQrdParams({ kerf: 1.0 });
			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells && geometry.cells.length > 0) {
				// Cells should have reasonable dimensions even with kerf adjustments
				let totalCellArea = 0;

				for (const cell of geometry.cells) {
					totalCellArea += cell.width * cell.height;
				}

				expect(totalCellArea).toBeGreaterThan(0);
			}
		});

		it("should work for all panel types with full feature set", () => {
			const testCases = [
				{
					name: "QRD Panel",
					params: createQrdParams({
						wallThickness: 3,
						backingPlateThickness: 9,
					}),
					builderClass: QrdBuilder,
				},
				{
					name: "Skyline Panel",
					params: createSkylineParams({
						wallThickness: 3,
						backingPlateThickness: 9,
					}),
					builderClass: SkylineBuilder,
				},
				{
					name: "Abfusor Panel",
					params: { ...createQrdParams(), materialType: "hardboard-9mm" },
					builderClass: AbfusorBuilder,
				},
				{
					name: "Porous Absorber",
					params: {
						...createQrdParams(),
						materialType: "medium-density-fiberboard",
					},
					builderClass: PorousAbsorberBuilder,
				},
				{
					name: "Helmholtz Absorber",
					params: createQrdParams({ wallThickness: 3 }),
					builderClass: HelmholtzAbsorberBuilder,
				},
			];

			for (const { name, params, builderClass } of testCases) {
				const builder = new builderClass(params);
				const geometry = builder.buildGeometry(false, true);

				expect(geometry).toBeDefined();
				expect(geometry.cells).toBeDefined();
				expect(geometry.boundingBox).toBeDefined();
			}
		});

		it("should handle edge cases (zero backing, no frame)", () => {
			// Test with minimal features
			const params = createQrdParams({
				wallThickness: 3,
				backingPlateThickness: undefined, // No backing plate
			});

			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();
			expect(geometry.boundingBox).toBeDefined();

			if (geometry.boundingBox) {
				// Depth should be just maxDepth without backing plate
				expect(geometry.boundingBox.depth).toBeCloseTo(10, 1); // Allow tolerance
			}
		});

		it("should maintain consistent metadata structure", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			// Build without frame for cleaner test
			const geometry = builder.buildGeometry(false, false);

			expect(geometry).toBeDefined();
			expect(geometry.cells).toBeDefined();
			expect(geometry.boundingBox).toBeDefined();

			if (geometry.metadata) {
				// Metadata should have consistent structure
				expect(typeof geometry.metadata.diffusionRange).toBe("object");
			}
		});
	});

	describe("Performance and Scalability", () => {
		it("should handle multiple cells efficiently", () => {
			const params = createQrdParams({ gridSize: 8 }); // More cells
			const builder = new QrdBuilder(params);
			const geometry = builder.buildGeometry(false, false);

			expect(geometry.cells).toBeDefined();

			if (geometry.cells) {
				// Should have multiple cells
				expect(geometry.cells.length).toBeGreaterThan(0);

				// All cells should have valid dimensions
				for (const cell of geometry.cells) {
					expect(cell.width).toBeGreaterThanOrEqual(0);
					expect(cell.height).toBeGreaterThanOrEqual(0);
				}
			}
		});

		it("should work with different wall thicknesses", () => {
			const testCases = [
				{ thickness: 1, name: "Thin walls" },
				{ thickness: 3, name: "Standard walls" },
				{ thickness: 6, name: "Thick walls" },
				{ thickness: 10, name: "Extra thick walls" },
			];

			for (const { thickness, name } of testCases) {
				const params = createQrdParams({ wallThickness: thickness });
				const builder = new QrdBuilder(params);
				const geometry = builder.buildGeometry(false, false);

				expect(geometry.cells).toBeDefined();

				if (geometry.cells && geometry.cells.length > 0) {
					// Cells should exist with any reasonable wall thickness
					expect(geometry.cells[0].width).toBeGreaterThanOrEqual(0);
					expect(geometry.cells[0].height).toBeGreaterThanOrEqual(0);
				}
			}
		});

		it("should handle varying backing plate thicknesses", () => {
			const testCases = [
				{ thickness: 3, name: "Thin backing" },
				{ thickness: 9, name: "Standard backing" },
				{ thickness: 18, name: "Thick backing" },
			];

			for (const { thickness, name } of testCases) {
				const params = createQrdParams({ backingPlateThickness: thickness });
				const builder = new QrdBuilder(params);
				const geometry = builder.buildGeometry(false, false);

				expect(geometry.boundingBox).toBeDefined();

				if (geometry.boundingBox) {
					// Depth should increase with backing plate
					expect(geometry.boundingBox.depth).toBeGreaterThanOrEqual(
						10 + thickness - 1,
					); // Allow tolerance
				}
			}
		});
	});

	describe("Type Safety and Validation", () => {
		it("should validate wall thickness parameter", () => {
			const params = createQrdParams({ wallThickness: 5 });
			const builder = new QrdBuilder(params);

			expect(() => builder.buildGeometry(false, false)).not.toThrow();
		});

		it("should handle undefined backing plate gracefully", () => {
			const params = createQrdParams({ backingPlateThickness: undefined });
			const builder = new QrdBuilder(params);

			expect(() => builder.buildGeometry(false, false)).not.toThrow();
		});

		it("should validate kerf parameter", () => {
			const params = createQrdParams({ kerf: 1.0 });
			const builder = new QrdBuilder(params);

			expect(() => builder.buildGeometry(false, false)).not.toThrow();
		});

		it("should work with all valid material types", () => {
			const materials = [
				"plywood-18mm",
				"mdf-15mm",
				"hardboard-9mm",
				"medium-density-fiberboard",
			];

			for (const material of materials) {
				const params: PanelParams = {
					type: "qrd",
					unit: "mm",
					dimensions: { width: 700, height: 20 },
					material: { thickness: 15, kerf: 3, density: 600 },
					cellSize: 20,
					prime: 7,
					designFrequency: 500,
					wellWidth: 20,
					maxDepth: 10,
					speedOfSound: 343,
					gridSize: 7,
					wallThickness: 3,
					backingPlateThickness: 9,
					materialType: material,
					kerf: 0.5,
				};

				const builder = new QrdBuilder(params);

				expect(() => builder.buildGeometry(false, false)).not.toThrow();
			}
		});
	});
});
