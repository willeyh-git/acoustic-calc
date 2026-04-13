import { describe, it, expect } from "vitest";
import {
	computeAbsorptionCoefficient,
	computePorousResonances,
	computeOptimalThickness,
	computeAbsorptionBandwidth,
	computePorousAbsorber,
	validatePorousAbsorberResults,
} from "../../core/math/porousAbsorber";

describe("Porous Absorber Math Module", () => {
	describe("computeAbsorptionCoefficient", () => {
		it("should return absorption coefficient between 0 and 1", () => {
			const alpha = computeAbsorptionCoefficient(500, 30000, 0.9, 0.05);

			expect(alpha).toBeGreaterThan(0);
			expect(alpha).toBeLessThan(1);
		});

		it("should increase with frequency", () => {
			const alphaLow = computeAbsorptionCoefficient(200, 30000, 0.9, 0.05);
			const alphaHigh = computeAbsorptionCoefficient(1000, 30000, 0.9, 0.05);

			expect(alphaHigh).toBeGreaterThan(alphaLow);
		});

		it("should increase with thickness", () => {
			const alphaThin = computeAbsorptionCoefficient(500, 30000, 0.9, 0.02);
			const alphaThick = computeAbsorptionCoefficient(500, 30000, 0.9, 0.1);

			expect(alphaThick).toBeGreaterThan(alphaThin);
		});

		it("should throw error for invalid flow resistivity", () => {
			expect(() => computeAbsorptionCoefficient(500, -1, 0.9, 0.05)).toThrow();
			expect(() =>
				computeAbsorptionCoefficient(500, 2000000, 0.9, 0.05),
			).toThrow();
		});

		it("should throw error for invalid porosity", () => {
			expect(() =>
				computeAbsorptionCoefficient(500, 30000, -0.1, 0.05),
			).toThrow();
			expect(() =>
				computeAbsorptionCoefficient(500, 30000, 1.1, 0.05),
			).toThrow();
		});

		it("should throw error for zero or negative frequency", () => {
			expect(() => computeAbsorptionCoefficient(0, 30000, 0.9, 0.05)).toThrow();
			expect(() =>
				computeAbsorptionCoefficient(-100, 30000, 0.9, 0.05),
			).toThrow();
		});

		it("should throw error for zero or negative thickness", () => {
			expect(() => computeAbsorptionCoefficient(500, 30000, 0.9, 0)).toThrow();
			expect(() =>
				computeAbsorptionCoefficient(500, 30000, 0.9, -0.01),
			).toThrow();
		});
	});

	describe("computePorousResonances", () => {
		it("should calculate quarter-wavelength resonance correctly", () => {
			const result = computePorousResonances(500, 0.05);

			expect(result.quarterWavelengthFreq).toBeGreaterThan(0);

			// f = c / (4 * thickness)
			const expectedFreq = 343 / (4 * 0.05);
			expect(result.quarterWavelengthFreq).toBeCloseTo(expectedFreq, 1);
		});

		it("should calculate half-wavelength resonance", () => {
			const result = computePorousResonances(500, 0.05);

			// Half wavelength should be double quarter wavelength
			expect(result.halfWavelengthFreq).toBeCloseTo(
				result.quarterWavelengthFreq * 2,
				1,
			);
		});

		it("should throw error for zero or negative thickness", () => {
			expect(() => computePorousResonances(500, 0)).toThrow();
			expect(() => computePorousResonances(500, -0.01)).toThrow();
		});
	});

	describe("computeOptimalThickness", () => {
		it("should calculate optimal thickness for target frequency", () => {
			const result = computeOptimalThickness(250);

			expect(result.thicknessMeters).toBeGreaterThan(0);
			expect(result.thicknessMillimeters).toBeGreaterThan(0);

			// Thickness should be 1/4 wavelength at target frequency
			const expectedThickness = 343 / 250 / 4;
			expect(result.thicknessMeters).toBeCloseTo(expectedThickness, 3);
		});

		it("should return correct wavelength at target", () => {
			const result = computeOptimalThickness(500);

			// Wavelength should be speed of sound / frequency
			const expectedWavelength = 343 / 500;
			expect(result.wavelengthAtTarget).toBeCloseTo(expectedWavelength, 3);
		});

		it("should throw error for zero or negative target frequency", () => {
			expect(() => computeOptimalThickness(0)).toThrow();
			expect(() => computeOptimalThickness(-100)).toThrow();
		});
	});

	describe("computeAbsorptionBandwidth", () => {
		it("should calculate bandwidth for given parameters", () => {
			const result = computeAbsorptionBandwidth(0.05, 30000, 0.9);

			expect(result.centerFrequency).toBeGreaterThan(0);
			expect(result.bandwidthHz).toBeGreaterThan(0);
			expect(result.minFrequency).toBeLessThan(result.maxFrequency);
		});

		it("should throw error for zero or negative thickness", () => {
			expect(() => computeAbsorptionBandwidth(0, 30000, 0.9)).toThrow();
		});
	});

	describe("computePorousAbsorber", () => {
		it("should return complete PorousResult for valid parameters", () => {
			const result = computePorousAbsorber({
				frequency: 500,
				thickness: 0.05,
				flowResistivity: 30000,
				porosity: 0.9,
			});

			expect(result).toHaveProperty("frequency");
			expect(result).toHaveProperty("absorptionCoefficient");
			expect(result).toHaveProperty("resonantFrequencies");
			expect(result).toHaveProperty("bandwidth");
			expect(result).toHaveProperty("materialProperties");

			expect(result.absorptionCoefficient).toBeGreaterThan(0);
			expect(result.absorptionCoefficient).toBeLessThan(1);
			expect(result.resonantFrequencies.length).toBeGreaterThanOrEqual(3);
		});

		it("should use default values when not provided", () => {
			const result = computePorousAbsorber({
				frequency: 500,
				thickness: 0.05,
			});

			expect(result.materialProperties.flowResistivity).toBe(30000);
			expect(result.materialProperties.porosity).toBe(0.9);
		});

		it("should throw error for invalid parameters", () => {
			expect(() =>
				computePorousAbsorber({
					frequency: 0,
					thickness: 0.05,
				}),
			).toThrow();

			expect(() =>
				computePorousAbsorber({
					frequency: 500,
					thickness: 0,
				}),
			).toThrow();
		});
	});

	describe("validatePorousAbsorberResults", () => {
		it("should validate valid PorousResult", () => {
			const result = computePorousAbsorber({
				frequency: 500,
				thickness: 0.05,
			});

			const validation = validatePorousAbsorberResults(result);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should detect invalid absorption coefficient", () => {
			const invalidResult: any = {
				frequency: 500,
				absorptionCoefficient: 1.5, // Invalid: > 1
				resonantFrequencies: [286],
				bandwidth: {
					centerFrequency: 286,
					bandwidthHz: 50,
					minFrequency: 236,
					maxFrequency: 336,
				},
				materialProperties: { thickness: 0.05 },
			};

			const validation = validatePorousAbsorberResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect invalid center frequency", () => {
			const invalidResult: any = {
				frequency: 500,
				absorptionCoefficient: 0.8,
				resonantFrequencies: [286],
				bandwidth: {
					centerFrequency: -100,
					bandwidthHz: 50,
					minFrequency: 236,
					maxFrequency: 336,
				},
				materialProperties: { thickness: 0.05 },
			};

			const validation = validatePorousAbsorberResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect invalid thickness", () => {
			const invalidResult: any = {
				frequency: 500,
				absorptionCoefficient: 0.8,
				resonantFrequencies: [286],
				bandwidth: {
					centerFrequency: 286,
					bandwidthHz: 50,
					minFrequency: 236,
					maxFrequency: 336,
				},
				materialProperties: { thickness: -0.01 },
			};

			const validation = validatePorousAbsorberResults(invalidResult);

			expect(validation.valid).toBe(false);
		});
	});
});
