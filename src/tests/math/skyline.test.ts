import { describe, it, expect } from "vitest";
import {
	generateSkylineSequence,
	computeSkylineDepths,
	computeSkyline,
} from "../src/core/math/skyline";

describe("Skyline Math Module", () => {
	describe("generateSkylineSequence", () => {
		it("should generate correct 2D sequence for gridSize=3, modulus=7", () => {
			const sequence = generateSkylineSequence(3, 7);

			expect(sequence.values).toHaveLength(9); // 3x3 grid
			expect(sequence.modulus).toBe(9);

			// Each row should have increasing values (skyline effect)
			expect(sequence.values[0]).toBeLessThan(sequence.values[1]);
			expect(sequence.values[3]).toBeLessThan(sequence.values[4]);
		});

		it("should generate correct sequence for gridSize=2, modulus=5", () => {
			const sequence = generateSkylineSequence(2, 5);

			expect(sequence.values).toHaveLength(4); // 2x2 grid
			expect(sequence.modulus).toBe(4);

			expect(sequence.values[0]).toBeLessThan(sequence.values[1]);
		});

		it("should handle larger grids", () => {
			const sequence = generateSkylineSequence(5, 11);

			expect(sequence.values).toHaveLength(25); // 5x5 grid
			expect(sequence.modulus).toBe(25);
		});
	});

	describe("computeSkylineDepths", () => {
		it("should compute depths for 2D sequence", () => {
			const sequence = generateSkylineSequence(3, 7);
			const wavelengths = [0.86, 0.85, 0.84];
			const maxDepth = 10;

			const depths = computeSkylineDepths(sequence, wavelengths, 3, maxDepth);

			expect(depths).toHaveLength(9); // Should match sequence length
			expect(depths.every((d) => d <= maxDepth)).toBe(true);
		});

		it("should handle empty sequence", () => {
			const emptySequence: any = { values: [], modulus: 0 };

			expect(() =>
				computeSkylineDepths(emptySequence, [0.86], 3, 10),
			).toThrow();
		});
	});

	describe("computeSkyline", () => {
		it("should return complete Skyline result for valid parameters", () => {
			const result = computeSkyline(3, 500, 20, 10);

			expect(result).toHaveProperty("sequence");
			expect(result).toHaveProperty("depths");
			expect(result).toHaveProperty("wavelength");
			expect(result).toHaveProperty("diffusionRange");

			expect(result.sequence.values).toHaveLength(9); // 3x3 grid
			expect(result.depths).toHaveLength(9);
			expect(result.wavelength).toBeCloseTo(0.686, 2); // 343/500
		});

		it("should respect maxDepth constraint", () => {
			const result = computeSkyline(5, 400, 25, 15);

			expect(result.depths.every((d) => d <= 15)).toBe(true);
		});

		it("should use default speed of sound when not provided", () => {
			const result1 = computeSkyline(3, 500, 20);
			const result2 = computeSkyline(3, 500, 20, undefined, 343);

			expect(result1.wavelength).toBeCloseTo(result2.wavelength, 2);
		});

		it("should calculate correct wavelength", () => {
			const result = computeSkyline(3, 343, 20); // Frequency = speed of sound, so wavelength = 1

			expect(result.wavelength).toBeCloseTo(1.0, 5);
		});
	});
});
