import { describe, it, expect } from "vitest";
import {
	generateQrdSequence,
	computeQrdDepths,
	computeQrd,
} from "../../core/math/qrd";

describe("QRD Math Module", () => {
	describe("generateQrdSequence", () => {
		it("should generate correct sequence for prime=7", () => {
			const sequence = generateQrdSequence(7);

			expect(sequence.values).toHaveLength(7);
			expect(sequence.modulus).toBe(7);
			expect(sequence.values).toEqual([0, 1, 4, 2, 2, 4, 1]);
		});

		it("should generate correct sequence for prime=11", () => {
			const sequence = generateQrdSequence(11);

			expect(sequence.values).toHaveLength(11);
			expect(sequence.modulus).toBe(11);
			expect(sequence.values).toEqual([0, 1, 4, 9, 5, 3, 3, 5, 9, 4, 1]);
		});

		it("should handle prime=2", () => {
			const sequence = generateQrdSequence(2);

			expect(sequence.values).toEqual([0, 1]);
		});
	});

	describe("computeQrdDepths", () => {
		it("should compute depths correctly for given parameters", () => {
			const sequence = generateQrdSequence(7);
			const wavelengths = [0.86, 0.85, 0.84]; // Different wavelengths
			const maxDepth = 10;

			const depths = computeQrdDepths(sequence, wavelengths, maxDepth);

			expect(depths).toHaveLength(7);
			expect(depths.every((d) => d <= maxDepth)).toBe(true);
		});

		it("should handle empty sequence", () => {
			const emptySequence: any = { values: [], modulus: 0 };

			expect(() => computeQrdDepths(emptySequence, [0.86], 10)).toThrow();
		});
	});

	describe("computeQrd", () => {
		it("should return complete QRD result for valid parameters", () => {
			const result = computeQrd(7, 500, 20, 10);

			expect(result).toHaveProperty("sequence");
			expect(result).toHaveProperty("depths");
			expect(result).toHaveProperty("wavelength");
			expect(result).toHaveProperty("diffusionRange");

			expect(result.sequence.values).toHaveLength(7);
			expect(result.depths).toHaveLength(7);
			expect(result.wavelength).toBeCloseTo(0.686, 2); // 343/500
		});

		it("should respect maxDepth constraint", () => {
			const result = computeQrd(11, 400, 25, 15);

			expect(result.depths.every((d) => d <= 15)).toBe(true);
		});

		it("should use default speed of sound when not provided", () => {
			const result1 = computeQrd(7, 500, 20);
			const result2 = computeQrd(7, 500, 20, undefined, 343);

			expect(result1.wavelength).toBeCloseTo(result2.wavelength, 2);
		});

		it("should calculate correct wavelength", () => {
			const result = computeQrd(7, 343, 20); // Frequency = speed of sound, so wavelength = 1

			expect(result.wavelength).toBeCloseTo(1.0, 5);
		});
	});
});
