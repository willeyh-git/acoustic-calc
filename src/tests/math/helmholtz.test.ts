import { describe, it, expect } from "vitest";
import {
	computeHelmholtzFrequency,
	computeHelmholtzBandwidth,
	computeOptimalHelmholtzDimensions,
	computeHelmholtzAbsorptionCoefficient,
	computeCoupledResonances,
	computeHelmholtzResonator,
	validateHelmholtzResonatorResults,
} from "../../core/math/helmholtz";

describe("Helmholtz Resonator Math Module", () => {
	describe("computeHelmholtzFrequency", () => {
		it("should calculate frequency using Helmholtz formula", () => {
			const freq = computeHelmholtzFrequency(0.01, 0.001, 0.02, 0.01);

			expect(freq).toBeGreaterThan(0);

			// f = (c / 2π) * √(A / (V * L_eff))
			const expectedFreq =
				(343 / (2 * Math.PI)) * Math.sqrt(0.01 / (0.001 * (0.02 + 0.01)));
			expect(freq).toBeCloseTo(expectedFreq, 1);
		});

		it("should throw error for zero or negative neck area", () => {
			expect(() => computeHelmholtzFrequency(0, 0.001, 0.02)).toThrow();
			expect(() => computeHelmholtzFrequency(-0.01, 0.001, 0.02)).toThrow();
		});

		it("should throw error for zero or negative cavity volume", () => {
			expect(() => computeHelmholtzFrequency(0.01, 0, 0.02)).toThrow();
			expect(() => computeHelmholtzFrequency(0.01, -0.001, 0.02)).toThrow();
		});

		it("should throw error for zero or negative neck length", () => {
			expect(() => computeHelmholtzFrequency(0.01, 0.001, 0)).toThrow();
			expect(() => computeHelmholtzFrequency(0.01, 0.001, -0.01)).toThrow();
		});

		it("should include end correction in effective length", () => {
			const freqWithoutCorrection =
				(343 / (2 * Math.PI)) * Math.sqrt(0.01 / (0.001 * 0.02));
			const freqWithCorrection = computeHelmholtzFrequency(
				0.01,
				0.001,
				0.02,
				0.01,
			);

			expect(freqWithCorrection).toBeGreaterThan(freqWithoutCorrection);
		});
	});

	describe("computeHelmholtzBandwidth", () => {
		it("should calculate Q factor and bandwidth", () => {
			const result = computeHelmholtzBandwidth(0.01, 0.001, 0.02, 0.01);

			expect(result.QFactor).toBeGreaterThan(0);
			expect(result.bandwidthHz).toBeGreaterThan(0);
			expect(result.minFrequency).toBeLessThan(result.maxFrequency);
		});

		it("should throw error for invalid parameters", () => {
			expect(() => computeHelmholtzBandwidth(0, 0.001, 0.02, 0.01)).toThrow();
			expect(() => computeHelmholtzBandwidth(0.01, 0, 0.02, 0.01)).toThrow();
		});

		it("should adjust Q factor based on viscous losses", () => {
			const resultLowViscosity = computeHelmholtzBandwidth(
				0.01,
				0.001,
				0.02,
				0.01,
				1e-6,
			);
			const resultHighViscosity = computeHelmholtzBandwidth(
				0.01,
				0.001,
				0.02,
				0.01,
				1e-4,
			);

			// Higher viscosity should increase damping (lower Q)
			expect(resultHighViscosity.QFactor).toBeLessThan(
				resultLowViscosity.QFactor,
			);
		});
	});

	describe("computeOptimalHelmholtzDimensions", () => {
		it("should calculate neck area and length for target frequency", () => {
			const result = computeOptimalHelmholtzDimensions(250, 0.01, 0.02);

			expect(result.neckArea).toBeGreaterThan(0);
			expect(result.neckLength).toBeGreaterThan(0.01); // Minimum 1cm enforced
		});

		it("should throw error for invalid parameters", () => {
			expect(() => computeOptimalHelmholtzDimensions(0, 0.01)).toThrow();
			expect(() => computeOptimalHelmholtzDimensions(250, 0)).toThrow();
		});

		it("should calculate correct neck area for given diameter", () => {
			const result = computeOptimalHelmholtzDimensions(300, 0.01, 0.03); // 3cm diameter

			const expectedArea = Math.PI * Math.pow(0.03 / 2, 2);
			expect(result.neckArea).toBeCloseTo(expectedArea, 4);
		});
	});

	describe("computeHelmholtzAbsorptionCoefficient", () => {
		it("should return absorption coefficient between 0 and 1", () => {
			const alpha = computeHelmholtzAbsorptionCoefficient(250, 250, 10);

			expect(alpha).toBeGreaterThan(0);
			expect(alpha).toBeLessThan(1);
		});

		it("should peak at resonant frequency", () => {
			const alphaAtResonance = computeHelmholtzAbsorptionCoefficient(
				250,
				250,
				10,
			);
			const alphaOffResonance = computeHelmholtzAbsorptionCoefficient(
				300,
				250,
				10,
			);

			expect(alphaAtResonance).toBeGreaterThan(alphaOffResonance);
		});

		it("should throw error for invalid parameters", () => {
			expect(() => computeHelmholtzAbsorptionCoefficient(0, 250, 10)).toThrow();
			expect(() => computeHelmholtzAbsorptionCoefficient(250, 0, 10)).toThrow();
			expect(() =>
				computeHelmholtzAbsorptionCoefficient(250, 250, 0),
			).toThrow();
		});

		it("should decrease as frequency moves away from resonance", () => {
			const alphaNear = computeHelmholtzAbsorptionCoefficient(240, 250, 10);
			const alphaFar = computeHelmholtzAbsorptionCoefficient(400, 250, 10);

			expect(alphaNear).toBeGreaterThan(alphaFar);
		});
	});

	describe("computeCoupledResonances", () => {
		it("should calculate fundamental resonance for single resonator", () => {
			const resonances = computeCoupledResonances(1, 250);

			expect(resonances).toHaveLength(1);
			expect(resonances[0]).toBeCloseTo(250, 1);
		});

		it("should calculate multiple coupled modes for array", () => {
			const resonances = computeCoupledResonances(4, 250);

			expect(resonances).toHaveLength(4);
			expect(resonances[0]).toBeCloseTo(250, 1); // Fundamental should match single resonator freq
		});

		it("should throw error for invalid parameters", () => {
			expect(() => computeCoupledResonances(0, 250)).toThrow();
			expect(() => computeCoupledResonances(4, 0)).toThrow();
		});
	});

	describe("computeHelmholtzResonator", () => {
		it("should return complete HelmholtzResult for target frequency approach", () => {
			const result = computeHelmholtzResonator({
				targetFrequency: 250,
				cavityVolume: 0.01,
				neckDiameter: 0.03,
			});

			expect(result).toHaveProperty("resonantFrequency");
			expect(result).toHaveProperty("bandwidth");
			expect(result).toHaveProperty("materialProperties");

			expect(result.resonantFrequency).toBeCloseTo(250, 1);
		});

		it("should return complete HelmholtzResult for geometric parameters approach", () => {
			const result = computeHelmholtzResonator({
				neckArea: 0.01,
				cavityVolume: 0.001,
				neckLength: 0.02,
				neckDiameter: 0.01,
			});

			expect(result).toHaveProperty("resonantFrequency");
			expect(result).toHaveProperty("bandwidth");
			expect(result.resonantFrequency).toBeGreaterThan(0);
		});

		it("should throw error when required parameters are missing", () => {
			expect(() => computeHelmholtzResonator({})).toThrow();
			expect(() =>
				computeHelmholtzResonator({ targetFrequency: 250 }),
			).toThrow();
		});

		it("should use default values for optional properties", () => {
			const result = computeHelmholtzResonator({
				neckArea: 0.01,
				cavityVolume: 0.001,
				neckLength: 0.02,
			});

			expect(result.materialProperties.neckDiameter).toBeDefined();
		});
	});

	describe("validateHelmholtzResonatorResults", () => {
		it("should validate valid HelmholtzResult", () => {
			const result = computeHelmholtzResonator({
				targetFrequency: 250,
				cavityVolume: 0.01,
				neckDiameter: 0.03,
			});

			const validation = validateHelmholtzResonatorResults(result);

			expect(validation.valid).toBe(true);
			expect(validation.errors).toHaveLength(0);
		});

		it("should detect invalid resonant frequency", () => {
			const invalidResult: any = {
				resonantFrequency: -100,
				bandwidth: {
					QFactor: 5,
					bandwidthHz: 20,
					minFrequency: 240,
					maxFrequency: 260,
				},
				materialProperties: {
					neckArea: 0.01,
					cavityVolume: 0.01,
					neckLength: 0.02,
					neckDiameter: 0.03,
				},
			};

			const validation = validateHelmholtzResonatorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect invalid Q factor", () => {
			const invalidResult: any = {
				resonantFrequency: 250,
				bandwidth: {
					QFactor: -1,
					bandwidthHz: 20,
					minFrequency: 240,
					maxFrequency: 260,
				},
				materialProperties: {
					neckArea: 0.01,
					cavityVolume: 0.01,
					neckLength: 0.02,
					neckDiameter: 0.03,
				},
			};

			const validation = validateHelmholtzResonatorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect invalid cavity volume", () => {
			const invalidResult: any = {
				resonantFrequency: 250,
				bandwidth: {
					QFactor: 5,
					bandwidthHz: 20,
					minFrequency: 240,
					maxFrequency: 260,
				},
				materialProperties: {
					neckArea: 0.01,
					cavityVolume: -0.01,
					neckLength: 0.02,
					neckDiameter: 0.03,
				},
			};

			const validation = validateHelmholtzResonatorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});

		it("should detect invalid neck length", () => {
			const invalidResult: any = {
				resonantFrequency: 250,
				bandwidth: {
					QFactor: 5,
					bandwidthHz: 20,
					minFrequency: 240,
					maxFrequency: 260,
				},
				materialProperties: {
					neckArea: 0.01,
					cavityVolume: 0.01,
					neckLength: -0.01,
					neckDiameter: 0.03,
				},
			};

			const validation = validateHelmholtzResonatorResults(invalidResult);

			expect(validation.valid).toBe(false);
		});
	});
});
