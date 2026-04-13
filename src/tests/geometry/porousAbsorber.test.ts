import { describe, it, expect } from "vitest";
import { PorousAbsorberBuilder } from "../../core/geometry/PorousAbsorberBuilder";
import type { AbsorberParams } from "../../core/types/panelTypes";

describe("Porous Absorber Builder", () => {
	const createPorousParams = (
		overrides: Partial<AbsorberParams> = {},
	): AbsorberParams => ({
		type: "porous",
		unit: "mm",
		dimensions: { width: 600, height: 400 },
		material: { thickness: 15, kerf: 3, density: 600 },
		cellSize: 20,
		cavityDepth: 100,
		holeDiameter: 5,
		holeSpacing: 10,
		designFrequency: 500,
		speedOfSound: 343,
		withBacking: false,
		withFrame: false,
		...overrides,
	});

	it("should generate empty sequence for porous absorber", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();

		expect(sequence).toHaveProperty("values");
		expect(sequence.values).toHaveLength(0);
		expect(sequence.modulus).toBe(0);
	});

	it("should build geometry with correct cells", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry).toHaveProperty("cells");

		// Calculate expected number of cells based on dimensions and cell size
		const rows = Math.ceil(400 / 20); // height / cellSize
		const cols = Math.ceil(600 / 20); // width / cellSize
		expect(geometry.cells).toHaveLength(rows * cols);

		expect(geometry).toHaveProperty("boundingBox");
	});

	it("should calculate correct bounding box", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(600); // dimensions.width
		expect(geometry.boundingBox.height).toBe(400); // dimensions.height
		expect(geometry.boundingBox.depth).toBe(100); // cavityDepth
	});

	it("should include absorption metadata", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");

		expect(geometry.metadata).toHaveProperty("prd");
	});

	it("should throw error for missing cavity depth", () => {
		const params: any = createPorousParams();
		delete (params as any).cavityDepth;

		expect(() => new PorousAbsorberBuilder(params)).toThrow(
			"Cavity depth is required",
		);
	});

	it("should calculate correct cell positions", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		// First cell should be at origin
		expect(geometry.cells[0].x).toBe(0);
		expect(geometry.cells[0].y).toBe(0);

		// Cell positions should follow grid pattern
		expect(geometry.cells[1].x).toBe(20); // Second column
		expect(geometry.cells[rows * 2].y).toBe(20); // Second row (where rows = ceil(400/20) = 20)
	});

	it("should include correct cell dimensions", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells[0].width).toBe(20); // cellSize
		expect(geometry.cells[0].height).toBe(20); // cellSize
		expect(geometry.cells[0].depth).toBe(100); // cavityDepth
	});

	it("should handle different dimensions", () => {
		const params = createPorousParams({
			dimensions: { width: 800, height: 600 },
		});
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(800);
		expect(geometry.boundingBox.height).toBe(600);

		const rows = Math.ceil(600 / 20);
		const cols = Math.ceil(800 / 20);
		expect(geometry.cells).toHaveLength(rows * cols);
	});

	it("should handle different cavity depths", () => {
		const params1 = createPorousParams({ cavityDepth: 50 });
		const params2 = createPorousParams({ cavityDepth: 150 });

		const builder1 = new PorousAbsorberBuilder(params1);
		const builder2 = new PorousAbsorberBuilder(params2);

		const geometry1 = builder1.buildGeometry(builder1.generateSequence());
		const geometry2 = builder2.buildGeometry(builder2.generateSequence());

		expect(geometry1.boundingBox.depth).toBe(50);
		expect(geometry2.boundingBox.depth).toBe(150);
	});

	it("should include material properties in metadata", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd).toHaveProperty("materialProperties");
		expect(geometry.metadata.prd.materialProperties.thickness).toBe(100); // cavityDepth in mm
	});

	it("should throw error for invalid parameters", () => {
		const params: any = createPorousParams();
		delete (params as any).designFrequency;

		expect(() => new PorousAbsorberBuilder(params)).toThrow();
	});

	it("should handle edge case with minimum dimensions", () => {
		const params = createPorousParams({
			dimensions: { width: 20, height: 20 }, // Exactly one cell size
		});
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells).toHaveLength(1);
		expect(geometry.boundingBox.width).toBe(20);
		expect(geometry.boundingBox.height).toBe(20);
	});

	it("should handle edge case with dimensions not divisible by cell size", () => {
		const params = createPorousParams({
			dimensions: { width: 150, height: 100 }, // Not evenly divisible
		});
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(150);
		expect(geometry.boundingBox.height).toBe(100);

		const rows = Math.ceil(100 / 20); // Should be 5
		const cols = Math.ceil(150 / 20); // Should be 8
		expect(geometry.cells).toHaveLength(rows * cols);
	});

	it("should use default design frequency when not provided", () => {
		const params: any = createPorousParams();
		delete (params as any).designFrequency;

		const builder = new PorousAbsorberBuilder(params);
		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.frequency).toBe(500); // Default frequency
	});

	it("should include correct metadata structure", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");

		expect(geometry.metadata.prd).toHaveProperty("frequency");
		expect(geometry.metadata.prd).toHaveProperty("absorptionCoefficient");
		expect(geometry.metadata.prd).toHaveProperty("resonantFrequencies");
		expect(geometry.metadata.prd).toHaveProperty("bandwidth");
	});

	it("should calculate absorption coefficient between 0 and 1", () => {
		const params = createPorousParams();
		const builder = new PorousAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.absorptionCoefficient).toBeGreaterThan(0);
		expect(geometry.metadata.prd.absorptionCoefficient).toBeLessThan(1);
	});
});
