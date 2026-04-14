import type { PanelParams, PanelGeometry } from "../types/types";
import type {
	CutPiece,
	MaterialUsage,
	EstimatedCost,
	DiffusionRange,
} from "../types/types";
import { CutListGenerator } from "../cutList/CutListGenerator";
import { MaterialCalculator } from "../materials/MaterialCalculator";
import { CostEstimator } from "../cost/CostEstimator";
import { QrdBuilder } from "../geometry/QRDBuilder";
import { SkylineBuilder } from "../geometry/SkylineBuilder";
import { AbfusorBuilder } from "../geometry/AbfusorBuilder";
import { PorousAbsorberBuilder } from "../geometry/PorousAbsorberBuilder";
import { HelmholtzAbsorberBuilder } from "../geometry/HelmholtzAbsorberBuilder";

/**
 * Integration helper to wire together geometry → cut list → cost estimation
 */
export class PanelIntegration {
	private cutListGenerator: CutListGenerator;
	private materialCalculator: MaterialCalculator;
	private costEstimator: CostEstimator;

	constructor() {
		this.cutListGenerator = new CutListGenerator();
		this.materialCalculator = new MaterialCalculator();
		this.costEstimator = new CostEstimator();
	}

	/**
	 * Main pipeline function to process panel parameters through all stages
	 */
	processPanel(
		params: PanelParams,
		materialType?: string,
		includeCostEstimation = false,
	): ProcessedPanel {
		// Step 1: Build geometry using the appropriate builder
		const geometry = this.buildGeometry(params);

		// Step 2: Generate cut list from geometry
		let cutList: CutPiece[] | undefined;
		if (materialType) {
			cutList = this.cutListGenerator.generateCutListWithKerf(
				geometry.cells,
				materialType,
				params.kerf || 0.5,
			);

			// Add metadata to geometry
			geometry.metadata = {
				...geometry.metadata,
				cutList: cutList,
				wallThickness: params.wallThickness || 3,
				backingPlateThickness: params.backingPlateThickness,
				edgeFrameProfile: params.edgeFrameProfile,
				kerf: params.kerf || 0.5,
			};
		}

		// Step 3: Calculate material usage
		const materialUsage = this.materialCalculator.calculateUsage(geometry);

		// Step 4: Estimate cost if requested
		let estimatedCost: EstimatedCost | undefined;
		if (includeCostEstimation && materialType) {
			estimatedCost = this.costEstimator.getEstimatedCost(
				materialType,
				materialUsage.totalAreaM2,
				this.costEstimator.getMaterialPrice(materialType),
			);
		}

		return {
			geometry,
			cutList: cutList || [],
			materialUsage,
			estimatedCost,
		};
	}

	/**
	 * Generate full specifications including diffusion range and construction notes
	 */
	generateFullSpecs(geometry: PanelGeometry): FullSpecs {
		const specs: FullSpecs = {
			geometry,
			cutList: geometry.metadata?.cutList || [],
			materialUsage: geometry.metadata?.materialUsage as
				| MaterialUsage
				| undefined,
			estimatedCost: geometry.metadata?.estimatedCost as
				| EstimatedCost
				| undefined,
			diffusionRange: geometry.metadata?.diffusion,
			constructionNotes: this.generateConstructionNotes(geometry),
			assemblyInstructions: this.generateAssemblyInstructions(geometry),
		};

		return specs;
	}

	private buildGeometry(params: PanelParams): PanelGeometry {
		// Select the appropriate builder based on panel type (static imports)
		switch (params.type) {
			case "qrd":
				return new QrdBuilder(params).build();

			case "skyline":
				return new SkylineBuilder(params).build();

			case "abfusor":
				return new AbfusorBuilder(params).build();

			case "absorber":
				if (params.absorberType === "porous") {
					return new PorousAbsorberBuilder(params).build();
				} else if (params.absorberType === "helmholtz") {
					return new HelmholtzAbsorberBuilder(params).build();
				}
				throw new Error("Invalid absorber type");

			default:
				throw new Error(`Unknown panel type: ${params.type}`);
		}
	}

	private generateConstructionNotes(geometry: PanelGeometry): string[] {
		const notes: string[] = [];

		if (geometry.metadata?.wallThickness) {
			notes.push(
				`Wall thickness: ${geometry.metadata.wallThickness.toFixed(1)}mm`,
			);
		}

		if (geometry.metadata?.backingPlateThickness) {
			notes.push(
				`Backing plate thickness: ${geometry.metadata.backingPlateThickness.toFixed(1)}mm`,
			);
		}

		if (geometry.metadata?.edgeFrameProfile) {
			notes.push(`Edge frame profile: ${geometry.metadata.edgeFrameProfile}`);
		}

		if (geometry.metadata?.kerf) {
			notes.push(`Cut tolerance/kerf: ${geometry.metadata.kerf.toFixed(1)}mm`);
		}

		return notes;
	}

	private generateAssemblyInstructions(
		geometry: PanelGeometry,
	): AssemblyStep[] {
		const instructions: AssemblyStep[] = [];

		instructions.push({
			step: 1,
			title: "Prepare Materials",
			description:
				"Cut all pieces according to the cut list with appropriate tolerances.",
		});

		if (geometry.metadata?.backingPlateThickness) {
			instructions.push({
				step: 2,
				title: "Install Backing Plate",
				description:
					"Attach backing plate to the rear of the panel using screws or adhesive.",
			});
		}

		if (geometry.metadata?.edgeFrameProfile) {
			instructions.push({
				step: 3,
				title: "Install Edge Frame",
				description: `Attach ${geometry.metadata.edgeFrameProfile} edge frame around the perimeter of the panel.`,
			});
		}

		instructions.push({
			step: 4,
			title: "Final Assembly",
			description: "Ensure all components are securely attached and aligned.",
		});

		return instructions;
	}
}

/**
 * Processed panel with cut list and material usage
 */
export interface ProcessedPanel {
	geometry: PanelGeometry;
	cutList: CutPiece[];
	materialUsage: MaterialUsage;
	estimatedCost?: EstimatedCost;
}

/**
 * Full specifications including diffusion range and construction notes
 */
export interface FullSpecs extends ProcessedPanel {
	diffusionRange?: DiffusionRange;
	constructionNotes: string[];
	assemblyInstructions: AssemblyStep[];
}

/**
 * Assembly step for instructions
 */
export interface AssemblyStep {
	step: number;
	title: string;
	description: string;
}
