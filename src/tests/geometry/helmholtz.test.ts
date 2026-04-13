import { describe, it, expect } from "vitest";
import { HelmholtzAbsorberBuilder } from "../../core/geometry/HelmholtzAbsorberBuilder";
import type { AbsorberParams } from "../../core/types/panelTypes";

describe("Helmholtz Absorber Builder", () => {
	const createHelmholtzParams = (
		overrides: Partial<AbsorberParams> = {},
	): AbsorberParams => ({
		type: "helmholtz",
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

	it("should generate empty sequence for Helmholtz absorber", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();

		expect(sequence).toHaveProperty("values");
		expect(sequence.values).toHaveLength(0);
		expect(sequence.modulus).toBe(0);
	});

	it("should build geometry with correct cells", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

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
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(600); // dimensions.width
		expect(geometry.boundingBox.height).toBe(400); // dimensions.height
		expect(geometry.boundingBox.depth).toBe(100); // cavityDepth
	});

	it("should include absorption metadata", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");

		expect(geometry.metadata).toHaveProperty("prd");
	});

	it("should throw error for missing cavity depth", () => {
		const params: any = createHelmholtzParams();
		delete (params as any).cavityDepth;

		expect(() => new HelmholtzAbsorberBuilder(params)).toThrow(
			"Cavity depth and hole diameter are required",
		);
	});

	it("should throw error for missing hole diameter", () => {
		const params: any = createHelmholtzParams();
		delete (params as any).holeDiameter;

		expect(() => new HelmholtzAbsorberBuilder(params)).toThrow(
			"Cavity depth and hole diameter are required",
		);
	});

	it("should calculate correct cell positions", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		// First cell should be at origin
		expect(geometry.cells[0].x).toBe(0);
		expect(geometry.cells[0].y).toBe(0);

		// Cell positions should follow grid pattern
		expect(geometry.cells[1].x).toBe(20); // Second column
	});

	it("should include correct cell dimensions", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells[0].width).toBe(20); // cellSize
		expect(geometry.cells[0].height).toBe(20); // cellSize
		expect(geometry.cells[0].depth).toBe(100); // cavityDepth
	});

	it("should handle different dimensions", () => {
		const params = createHelmholtzParams({
			dimensions: { width: 800, height: 600 },
		});
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(800);
		expect(geometry.boundingBox.height).toBe(600);

		const rows = Math.ceil(600 / 20);
		const cols = Math.ceil(800 / 20);
		expect(geometry.cells).toHaveLength(rows * cols);
	});

	it("should handle different cavity depths", () => {
		const params1 = createHelmholtzParams({ cavityDepth: 50 });
		const params2 = createHelmholtzParams({ cavityDepth: 150 });

		const builder1 = new HelmholtzAbsorberBuilder(params1);
		const builder2 = new HelmholtzAbsorberBuilder(params2);

		const geometry1 = builder1.buildGeometry(builder1.generateSequence());
		const geometry2 = builder2.buildGeometry(builder2.generateSequence());

		expect(geometry1.boundingBox.depth).toBe(50);
		expect(geometry2.boundingBox.depth).toBe(150);
	});

	it("should include material properties in metadata", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd).toHaveProperty("materialProperties");
	});

	it("should throw error for invalid parameters", () => {
		const params: any = createHelmholtzParams();
		delete (params as any).designFrequency;

		expect(() => new HelmholtzAbsorberBuilder(params)).toThrow();
	});

	it("should handle edge case with minimum dimensions", () => {
		const params = createHelmholtzParams({
			dimensions: { width: 20, height: 20 }, // Exactly one cell size
		});
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells).toHaveLength(1);
		expect(geometry.boundingBox.width).toBe(20);
		expect(geometry.boundingBox.height).toBe(20);
	});

	it("should handle edge case with dimensions not divisible by cell size", () => {
		const params = createHelmholtzParams({
			dimensions: { width: 150, height: 100 }, // Not evenly divisible
		});
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(150);
		expect(geometry.boundingBox.height).toBe(100);

		const rows = Math.ceil(100 / 20); // Should be 5
		const cols = Math.ceil(150 / 20); // Should be 8
		expect(geometry.cells).toHaveLength(rows * cols);
	});

	it("should use default design frequency when not provided", () => {
		const params: any = createHelmholtzParams();
		delete (params as any).designFrequency;

		const builder = new HelmholtzAbsorberBuilder(params);
		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.resonantFrequency).toBeCloseTo(500, 1); // Default frequency
	});

	it("should include correct metadata structure", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");

		expect(geometry.metadata.prd).toHaveProperty("resonantFrequency");
		expect(geometry.metadata.prd).toHaveProperty("bandwidth");
		expect(geometry.metadata.prd).toHaveProperty("materialProperties");
	});

	it("should calculate resonant frequency close to target", () => {
		const params = createHelmholtzParams({ designFrequency: 250 });
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.resonantFrequency).toBeCloseTo(250, 10); // Should be close to target
	});

	it("should include bandwidth information", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.bandwidth).toHaveProperty("QFactor");
		expect(geometry.metadata.prd.bandwidth).toHaveProperty("bandwidthHz");
		expect(geometry.metadata.prd.bandwidth).toHaveProperty("minFrequency");
		expect(geometry.metadata.prd.bandwidth).toHaveProperty("maxFrequency");

		expect(geometry.metadata.prd.bandwidth.minFrequency).toBeLessThan(
			geometry.metadata.prd.bandwidth.maxFrequency,
		);
	});

	it("should calculate neck area and length in material properties", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.materialProperties).toHaveProperty("neckArea");
		expect(geometry.metadata.prd.materialProperties).toHaveProperty(
			"cavityVolume",
		);
		expect(geometry.metadata.prd.materialProperties).toHaveProperty(
			"neckLength",
		);
		expect(geometry.metadata.prd.materialProperties).toHaveProperty(
			"neckDiameter",
		);

		// Neck area should be positive
		expect(geometry.metadata.prd.materialProperties.neckArea).toBeGreaterThan(
			0,
		);
	});

	it("should validate Helmholtz resonator results", () => {
		const params = createHelmholtzParams();
		const builder = new HelmholtzAbsorberBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata.prd.resonantFrequency).toBeGreaterThan(0);
		expect(geometry.metadata.prd.bandwidth.QFactor).toBeGreaterThan(0);
	});

	it("should handle different hole diameters", () => {
		const params1 = createHelmholtzParams({ holeDiameter: 3 });
		const params2 = createHelmholtzParams({ holeDiameter: 8 });

		const builder1 = new HelmholtzAbsorberBuilder(params1);
		const builder2 = new HelmholtzAbsorberBuilder(params2);

		const geometry1 = builder1.buildGeometry(builder1.generateSequence());
		const geometry2 = builder2.buildGeometry(builder2.generateSequence());

		expect(geometry1.metadata.prd.materialProperties.neckArea).toBeLessThan(
			geometry2.metadata.prd.materialProperties.neckArea,
		); // Larger diameter should have larger area
	});

	it("should handle different material thicknesses", () => {
		const params1 = createHelmholtzParams({
			material: { ...createHelmholtzParams().material, thickness: 5 },
		});
		const params2 = createHelmholtzParams({
			material: { ...createHelmholtzParams().material, thickness: 10 },
		});

		const builder1 = new HelmholtzAbsorberBuilder(params1);
		const builder2 = new HelmholtzAbsorberBuilder(params2);

		const geometry1 = builder1.buildGeometry(builder1.generateSequence());
		const geometry2 = builder2.buildGeometry(builder2.generateSequence());

		expect(geometry1.metadata.prd.materialProperties.neckLength).toBeLessThan(
			geometry2.metadata.prd.materialProperties.neckLength,
		); // Thicker material should have longer neck length
	});
});
