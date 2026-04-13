import { describe, it, expect } from "vitest";
import { SkylineBuilder } from "../../core/geometry/SkylineBuilder";
import type { SkylineParams } from "../../core/types/panelTypes";

describe("Skyline Builder", () => {
	const createSkylineParams = (
		overrides: Partial<SkylineParams> = {},
	): SkylineParams => ({
		type: "skyline",
		unit: "mm",
		dimensions: { width: 300, height: 300 },
		material: { thickness: 15, kerf: 3, density: 600 },
		cellSize: 20,
		gridSize: 3,
		prime: 7,
		designFrequency: 500,
		wellWidth: 20,
		maxDepth: 10,
		speedOfSound: 343,
		...overrides,
	});

	it("should generate correct 2D sequence", () => {
		const params = createSkylineParams();
		const builder = new SkylineBuilder(params);

		const sequence = builder.generateSequence();

		expect(sequence).toHaveProperty("values");
		expect(sequence.values).toHaveLength(9); // 3x3 grid
		expect(sequence.modulus).toBe(9);
	});

	it("should build geometry with correct cells", () => {
		const params = createSkylineParams();
		const builder = new SkylineBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry).toHaveProperty("cells");
		expect(geometry.cells).toHaveLength(9); // 3x3 grid
		expect(geometry).toHaveProperty("boundingBox");
	});

	it("should calculate correct square bounding box", () => {
		const params = createSkylineParams();
		const builder = new SkylineBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(60); // 3 * 20mm
		expect(geometry.boundingBox.height).toBe(60);
	});

	it("should include diffusion metadata", () => {
		const params = createSkylineParams();
		const builder = new SkylineBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");
	});

	it("should throw error for invalid parameters", () => {
		const params: any = createSkylineParams();
		delete (params as any).gridSize;

		expect(() => new SkylineBuilder(params)).toThrow();
	});
});
