import { describe, it, expect } from "vitest";
import {
	generateAbfusorSequence,
	computeAbfusorDepths,
	generateAbfusor,
	validateAbfusorResults,
} from "../src/core/math/abfusor";

describe("Abfusor Math Module", () => {
	describe("generateAbfusorSequence", () => {
		it("should return sequence with same values as pattern", () => {
			const pattern = [1, 0, 1, 1, 0];
			const sequence = generateAbfusorSequence(pattern);

			expect(sequence.values).toEqual(pattern);
			expect(sequence.modulus).toBe(5);
		});

		it("should handle all ones pattern", () => {
			const pattern = [1, 1, 1, 1];
			const sequence = generateAbfusorSequence(pattern);

			expect(sequence.values).toEqual([1, 1, 1, 1]);
			expect(sequence.modulus).toBe(4);
		});

		it("should handle all zeros pattern", () => {
			const pattern = [0, 0, 0, 0];
			const sequence = generateAbfusorSequence(pattern);

			expect(sequence.values).toEqual([0, 0, 0, 0]);
			expect(sequence.modulus).toBe(4);
		});

		it("should throw error for undefined values", () => {
			const pattern: any = [1, undefined, 1];

			expect(() => generateAbfusorSequence(pattern)).toThrow();
		});

		it("should handle single element patterns", () => {
			const sequence1 = generateAbfusorSequence([1]);
			const sequence2 = generateAbfusorSequence([0]);

			expect(sequence1.values).toEqual([1]);
			expect(sequence2.values).toEqual([0]);
		});

		it("should handle larger patterns", () => {
			const pattern = [1, 0, 1, 0, 1, 0, 1, 0];
			const sequence = generateAbfusorSequence(pattern);

			expect(sequence.values).toEqual(pattern);
			expect(sequence.modulus).toBe(8);
		});
	});

	describe("computeAbfusorDepths", () => {
		it("should compute depthsA for value=1 cells", () => {
			const sequence = generateAbfusorSequence([1, 0, 1, 1]);
			const modulus = 4;
			const wavelength = 0.86;
			const depthA = 5;
			const depthB = 2;

			const result = computeAbfusorDepths(
				sequence,
				modulus,
				wavelength,
				depthA,
				depthB,
			);

			expect(result.depthsA).toHaveLength(3); // Three cells with value=1
			expect(result.depthsB).toHaveLength(1); // One cell with value=0
		});

		it("should compute depthsB for value=0 cells", () => {
			const sequence = generateAbfusorSequence([1, 0, 1, 0]);
			const modulus = 4;
			const wavelength = 0.86;
			const depthA = 5;
			const depthB = 2;

			const result = computeAbfusorDepths(
				sequence,
				modulus,
				wavelength,
				depthA,
				depthB,
			);

			expect(result.depthsA).toHaveLength(2); // Two cells with value=1
			expect(result.depthsB).toHaveLength(2); // Two cells with value=0
		});

		it("should throw error for undefined sequence values", () => {
			const sequence: any = { values: [1, undefined], modulus: 2 };

			expect(() => computeAbfusorDepths(sequence, 2, 0.86, 5, 2)).toThrow();
		});

		it("should handle empty pattern", () => {
			const sequence = generateAbfusorSequence([]);
			const modulus = 0;

			expect(() =>
				computeAbfusorDepths(sequence, modulus, 0.86, 5, 2),
			).toThrow();
		});

		it("should calculate depths based on position", () => {
			const sequence = generateAbfusorSequence([1, 1, 1]);
			const modulus = 3;
			const wavelength = 0.86;
			const depthA = 5;
			const depthB = 2;

			const result = computeAbfusorDepths(
				sequence,
				modulus,
				wavelength,
				depthA,
				depthB,
			);

			expect(result.depthsA).toHaveLength(3);
			// Depths should increase with position
			expect(result.depthsA[0]).toBeLessThan(result.depthsA[2]);
		});
	});

	describe("generateAbfusor", () => {
		it("should return complete Abfusor result for valid pattern", () => {
			const pattern = [1, 0, 1, 1, 0];

			const result = generateAbfusor(pattern, 0.86, 5, 2);

			expect(result).toHaveProperty("sequence");
			expect(result).toHaveProperty("depthsA");
			expect(result).toHaveProperty("depthsB");
			expect(result).toHaveProperty("diffusionRange");

			expect(result.sequence.values).toEqual(pattern);
			expect(result.depthsA.length + result.depthsB.length).toBe(5);
		});

		it("should throw error for empty pattern", () => {
			const emptyPattern: any = [];

			expect(() => generateAbfusor(emptyPattern, 0.86, 5, 2)).toThrow();
		});

		it("should calculate correct number of depthsA and depthsB", () => {
			const pattern = [1, 1, 0, 1, 0];

			const result = generateAbfusor(pattern, 0.86, 5, 2);

			expect(result.depthsA.length).toBe(3); // Three 1s in pattern
			expect(result.depthsB.length).toBe(2); // Two 0s in pattern
		});

		it("should use default speed of sound when not provided", () => {
			const result1 = generateAbfusor([1, 0], 0.86, 5, 2);
			const result2 = generateAbfusor([1, 0], 0.86, 5, 2, undefined, 343);

			expect(result1.wavelength).toBeCloseTo(result2.wavelength, 2);
		});

		it("should calculate correct wavelength", () => {
			const result = generateAbfusor([1, 0], 343, 5, 2); // Frequency = speed of sound, so wavelength = 1

			expect(result.wavelength).toBeCloseTo(1.0, 5);
		});

		it("should handle alternating patterns", () => {
			const pattern = [1, 0, 1, 0, 1, 0];

			const result = generateAbfusor(pattern, 0.86, 5, 2);

			expect(result.depthsA.length).toBe(3);
			expect(result.depthsB.length).toBe(3);
		});
	});

	describe("validateAbfusorResults", () => {
		it("should validate valid Abfusor results", () => {
			const result = generateAbfusor([1, 0, 1], 0.86, 5, 2);

			const validation = validateAbfusorResults(result);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should detect non-binary sequence values", () => {
			const invalidResult: any = {
				sequence: { values: [1, 2, 1], modulus: 3 },
				depthsA: [],
				depthsB: [],
				diffusionRange: { minFrequency: 100, maxFrequency: 200 },
			};

			const validation = validateAbfusorResults(invalidResult);

			expect(validation.valid).toBe(false);
			expect(validation.errors.some((e) => e.includes("binary"))).toBe(true);
		});

		it("should detect empty depth arrays", () => {
			const invalidResult: any = {
				sequence: { values: [1, 0], modulus: 2 },
				depthsA: [],
				depthsB: [],
				diffusionRange: { minFrequency: 100, maxFrequency: 200 },
			};

			const validation = validateAbfusorResults(invalidResult);

			expect(validation.valid).toBe(false);
			expect(validation.errors.some((e) => e.includes("depth"))).toBe(true);
		});

		it("should detect invalid diffusion range", () => {
			const invalidResult: any = {
				sequence: { values: [1, 0], modulus: 2 },
				depthsA: [],
				depthsB: [],
				diffusionRange: { minFrequency: 200, maxFrequency: 100 }, // Invalid: min > max
			};

			const validation = validateAbfusorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect missing diffusion range", () => {
			const invalidResult: any = {
				sequence: { values: [1, 0], modulus: 2 },
				depthsA: [],
				depthsB: [],
			};

			const validation = validateAbfusorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should handle valid edge case with single element", () => {
			const result = generateAbfusor([1], 0.86, 5, 2);

			const validation = validateAbfusorResults(result);

			expect(validation.valid).toBe(true);
		});
	});
});
