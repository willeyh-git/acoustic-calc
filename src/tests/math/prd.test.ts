import { describe, it, expect } from "vitest";
import {
	computePRDFromQrd,
	validatePRDResults,
	computePowerRatio,
} from "../../core/math/prd";

describe("PRD Math Module", () => {
	describe("computePowerRatio", () => {
		it("should calculate power ratio for given depth and parameters", () => {
			const result = computePowerRatio(10, 343, 20);

			expect(result).toBeGreaterThan(0);
			expect(result).toBeLessThan(1);
		});

		it("should handle zero depth", () => {
			const result = computePowerRatio(0, 343, 20);

			expect(result).toBeCloseTo(0, 5);
		});
	});

	describe("computePRDFromQrd", () => {
		it("should return complete PRD result for valid parameters", () => {
			const result = computePRDFromQrd(7, 500, 20, 10);

			expect(result).toHaveProperty("powerRatio");
			expect(result).toHaveProperty("diffusionRange");
			expect(result).toHaveProperty("wavelength");

			expect(result.powerRatio).toBeGreaterThan(0);
			expect(result.diffusionRange.minFrequency).toBeLessThan(
				result.diffusionRange.maxFrequency,
			);
		});

		it("should respect maxDepth constraint", () => {
			const result = computePRDFromQrd(11, 400, 25, 15);

			// Power ratio should be reasonable for valid depths
			expect(result.powerRatio).toBeGreaterThan(0);
		});

		it("should use default speed of sound when not provided", () => {
			const result1 = computePRDFromQrd(7, 500, 20);
			const result2 = computePRDFromQrd(7, 500, 20, undefined, 343);

			expect(result1.wavelength).toBeCloseTo(result2.wavelength, 2);
		});
	});

	describe("validatePRDResults", () => {
		it("should validate valid PRD results", () => {
			const result = computePRDFromQrd(7, 500, 20, 10);

			const validation = validatePRDResults(result);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should detect invalid power ratio", () => {
			const invalidResult: any = {
				powerRatio: -1,
				diffusionRange: { minFrequency: 100, maxFrequency: 200 },
				wavelength: 0.686,
			};

			const validation = validatePRDResults(invalidResult);

			expect(validation.valid).toBe(false);
			expect(validation.errors.some((e) => e.includes("power ratio"))).toBe(
				true,
			);
		});

		it("should detect invalid diffusion range", () => {
			const invalidResult: any = {
				powerRatio: 0.5,
				diffusionRange: { minFrequency: 200, maxFrequency: 100 }, // Invalid: min > max
				wavelength: 0.686,
			};

			const validation = validatePRDResults(invalidResult);

			expect(validation.valid).toBe(false);
			expect(validation.errors.some((e) => e.includes("diffusion range"))).toBe(
				true,
			);
		});

		it("should handle missing diffusion range", () => {
			const invalidResult: any = {
				powerRatio: 0.5,
				wavelength: 0.686,
			};

			const validation = validatePRDResults(invalidResult);

			expect(validation.valid).toBe(false);
		});
	});
});
