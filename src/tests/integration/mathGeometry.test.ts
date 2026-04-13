import { describe, it, expect } from "vitest";
import { QrdBuilder } from "../../core/geometry/QRDBuilder";
import { SkylineBuilder } from "../../core/geometry/SkylineBuilder";
import type { QrdParams, SkylineParams } from "../../core/types/panelTypes";

describe("Math and Geometry Integration", () => {
	describe("QRD Builder Integration with Math", () => {
		const createQrdParams = (
			overrides: Partial<QrdParams> = {},
		): QrdParams => ({
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
			...overrides,
		});

		it("should integrate math sequence generation with geometry building", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(7); // prime number
			expect(geometry.boundingBox.width).toBe(140); // 7 * 20mm
		});

		it("should respect maxDepth constraint from math", () => {
			const params = createQrdParams({ maxDepth: 8 });
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells.every((cell) => cell.depth <= 8)).toBe(true);
		});

		it("should include diffusion metadata from math calculation", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.metadata).toHaveProperty("diffusion");
			expect(geometry.metadata.diffusion.minFrequency).toBeLessThan(
				geometry.metadata.diffusion.maxFrequency,
			);
		});

		it("should calculate correct cell positions based on sequence", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells[0].x).toBe(0);
			expect(geometry.cells[1].x).toBe(20);
			expect(geometry.cells[6].x).toBe(120);
		});

		it("should handle different primes", () => {
			const params = createQrdParams({ prime: 11 });
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(11);
		});

		it("should handle different design frequencies", () => {
			const params1 = createQrdParams({ designFrequency: 400 });
			const params2 = createQrdParams({ designFrequency: 600 });

			const builder1 = new QrdBuilder(params1);
			const builder2 = new QrdBuilder(params2);

			const geometry1 = builder1.buildGeometry(builder1.generateSequence());
			const geometry2 = builder2.buildGeometry(builder2.generateSequence());

			// Different frequencies should result in different diffusion ranges
			expect(geometry1.metadata.diffusion.minFrequency).not.toBe(
				geometry2.metadata.diffusion.minFrequency,
			);
		});
	});

	describe("Skyline Builder Integration with Math", () => {
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

		it("should integrate math sequence generation with geometry building", () => {
			const params = createSkylineParams();
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(9); // 3x3 grid
			expect(geometry.boundingBox.width).toBe(60); // 3 * 20mm
		});

		it("should include diffusion metadata from math calculation", () => {
			const params = createSkylineParams();
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.metadata).toHaveProperty("diffusion");
			expect(geometry.metadata.diffusion.minFrequency).toBeLessThan(
				geometry.metadata.diffusion.maxFrequency,
			);
		});

		it("should calculate correct 2D cell positions", () => {
			const params = createSkylineParams();
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells[0].x).toBe(0);
			expect(geometry.cells[0].y).toBe(0);

			// Second cell in second column
			expect(geometry.cells[1].x).toBe(20);

			// Cell in third row (if rows are stacked vertically)
			if (geometry.cells.length > 3) {
				expect(geometry.cells[3].y).toBe(20);
			}
		});

		it("should handle different grid sizes", () => {
			const params = createSkylineParams({ gridSize: 5 });
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(25); // 5x5 grid
		});

		it("should handle different primes", () => {
			const params = createSkylineParams({ prime: 11 });
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(25); // Still 5x5 grid, but different modulus
		});

		it("should respect maxDepth constraint from math", () => {
			const params = createSkylineParams({ maxDepth: 8 });
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells.every((cell) => cell.depth <= 8)).toBe(true);
		});

		it("should calculate correct square bounding box", () => {
			const params = createSkylineParams({ gridSize: 4 });
			const builder = new SkylineBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.boundingBox.width).toBe(80); // 4 * 20mm
			expect(geometry.boundingBox.height).toBe(80); // Square layout
		});
	});

	describe("Edge Cases and Boundary Conditions", () => {
		it("should handle minimum valid parameters for QRD", () => {
			const params = createQrdParams({
				prime: 2, // Minimum prime
				designFrequency: 1000, // High frequency
				maxDepth: 5, // Low max depth
			});
			const builder = new QrdBuilder(params);

			expect(() => {
				builder.generateSequence();
				builder.buildGeometry(builder.generateSequence());
			}).not.toThrow();
		});

		it("should handle maximum reasonable parameters for Skyline", () => {
			const params = createSkylineParams({
				gridSize: 10, // Large grid
				designFrequency: 200, // Low frequency
				maxDepth: 50, // High max depth
			});
			const builder = new SkylineBuilder(params);

			expect(() => {
				builder.generateSequence();
				builder.buildGeometry(builder.generateSequence());
			}).not.toThrow();
		});

		it("should throw error for invalid prime in QRD", () => {
			const params: any = createQrdParams({ prime: 4 }); // Not a prime number

			expect(() => new QrdBuilder(params)).toThrow();
		});

		it("should throw error for missing gridSize in Skyline", () => {
			const params: any = createSkylineParams();
			delete (params as any).gridSize;

			expect(() => new SkylineBuilder(params)).toThrow();
		});

		it("should handle very small cell sizes", () => {
			const params = createQrdParams({ cellSize: 5 }); // Small cells
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(7);
			expect(geometry.boundingBox.width).toBe(35); // 7 * 5mm
		});

		it("should handle very large cell sizes", () => {
			const params = createQrdParams({ cellSize: 100 }); // Large cells
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(7);
			expect(geometry.boundingBox.width).toBe(700); // 7 * 100mm
		});

		it("should handle different speed of sound values", () => {
			const params1 = createQrdParams({ speedOfSound: 343 });
			const params2 = createQrdParams({ speedOfSound: 340 });

			const builder1 = new QrdBuilder(params1);
			const builder2 = new QrdBuilder(params2);

			const geometry1 = builder1.buildGeometry(builder1.generateSequence());
			const geometry2 = builder2.buildGeometry(builder2.generateSequence());

			// Different speed of sound should result in different diffusion ranges
			expect(geometry1.metadata.diffusion.minFrequency).not.toBe(
				geometry2.metadata.diffusion.minFrequency,
			);
		});

		it("should maintain consistency between math and geometry calculations", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();

			// Verify that the number of cells matches the sequence length
			expect(builder.buildGeometry(sequence).cells.length).toBe(
				sequence.values.length,
			);
		});

		it("should handle different material properties", () => {
			const params1 = createQrdParams({
				material: { thickness: 10, kerf: 2, density: 500 },
			});
			const params2 = createQrdParams({
				material: { thickness: 20, kerf: 4, density: 800 },
			});

			const builder1 = new QrdBuilder(params1);
			const builder2 = new QrdBuilder(params2);

			expect(() => {
				builder1.generateSequence();
				builder2.generateSequence();
			}).not.toThrow();
		});
	});

	describe("Metadata Consistency", () => {
		it("should include consistent metadata structure for all builders", () => {
			const qrdParams = createQrdParams();
			const skylineParams = createSkylineParams({ gridSize: 3 });

			const qrdBuilder = new QrdBuilder(qrdParams);
			const skylineBuilder = new SkylineBuilder(skylineParams);

			const qrdGeometry = qrdBuilder.buildGeometry(
				qrdBuilder.generateSequence(),
			);
			const skylineGeometry = skylineBuilder.buildGeometry(
				skylineBuilder.generateSequence(),
			);

			// Both should have diffusion metadata
			expect(qrdGeometry.metadata).toHaveProperty("diffusion");
			expect(skylineGeometry.metadata).toHaveProperty("diffusion");

			// Both should have bounding box
			expect(qrdGeometry.boundingBox).toHaveProperty("width");
			expect(skylineGeometry.boundingBox).toHaveProperty("width");
		});

		it("should calculate diffusion range correctly based on parameters", () => {
			const params1 = createQrdParams({ designFrequency: 200 }); // Low frequency
			const params2 = createQrdParams({ designFrequency: 1000 }); // High frequency

			const builder1 = new QrdBuilder(params1);
			const builder2 = new QrdBuilder(params2);

			const geometry1 = builder1.buildGeometry(builder1.generateSequence());
			const geometry2 = builder2.buildGeometry(builder2.generateSequence());

			// Lower design frequency should result in lower maxFrequency in diffusion range
			expect(geometry1.metadata.diffusion.maxFrequency).toBeLessThan(
				geometry2.metadata.diffusion.maxFrequency,
			);
		});

		it("should include cell count metadata", () => {
			const params = createQrdParams();
			const builder = new QrdBuilder(params);

			const sequence = builder.generateSequence();
			const geometry = builder.buildGeometry(sequence);

			expect(geometry.cells).toHaveLength(7);
			expect(geometry.boundingBox.width).toBe(140);
		});
	});
});
