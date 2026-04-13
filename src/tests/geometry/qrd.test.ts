import { describe, it, expect } from "vitest";
import { QrdBuilder } from "../src/core/geometry/QRDBuilder";
import type { QrdParams } from "../src/core/types/panelTypes";

describe("QRD Builder", () => {
	const createQrdParams = (overrides: Partial<QrdParams> = {}): QrdParams => ({
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
		wallThickness: 5,
		flapThickness: 2,
		...overrides,
	});

	it("should generate correct sequence", () => {
		const params = createQrdParams();
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();

		expect(sequence).toHaveProperty("values");
		expect(sequence.values).toHaveLength(7);
		expect(sequence.modulus).toBe(7);
	});

	it("should build geometry with correct cells", () => {
		const params = createQrdParams();
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry).toHaveProperty("cells");
		expect(geometry.cells).toHaveLength(7);
		expect(geometry).toHaveProperty("boundingBox");
	});

	it("should calculate correct bounding box", () => {
		const params = createQrdParams();
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.boundingBox.width).toBe(140); // 7 * 20mm
		expect(geometry.boundingBox.height).toBe(20);
	});

	it("should respect maxDepth constraint", () => {
		const params = createQrdParams({ maxDepth: 8 });
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells.every((cell) => cell.depth <= 8)).toBe(true);
	});

	it("should include diffusion metadata", () => {
		const params = createQrdParams();
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.metadata).toHaveProperty("diffusion");
		expect(geometry.metadata.diffusion).toHaveProperty("minFrequency");
		expect(geometry.metadata.diffusion).toHaveProperty("maxFrequency");
	});

	it("should calculate correct cell positions", () => {
		const params = createQrdParams();
		const builder = new QrdBuilder(params);

		const sequence = builder.generateSequence();
		const geometry = builder.buildGeometry(sequence);

		expect(geometry.cells[0].x).toBe(0);
		expect(geometry.cells[1].x).toBe(20);
		expect(geometry.cells[6].x).toBe(120);
	});

	it("should throw error for invalid parameters", () => {
		const params: any = createQrdParams();
		delete (params as any).prime;

		expect(() => new QrdBuilder(params)).toThrow();
	});
});
