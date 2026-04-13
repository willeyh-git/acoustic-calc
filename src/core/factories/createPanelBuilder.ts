import { QrdBuilder } from "../geometry/QRDBuilder";
import { SkylineBuilder } from "../geometry/SkylineBuilder";
import { AbfusorBuilder } from "../geometry/AbfusorBuilder";
import { PorousAbsorberBuilder } from "../geometry/PorousAbsorberBuilder";
import { HelmholtzAbsorberBuilder } from "../geometry/HelmholtzAbsorberBuilder";
import type { PanelParams } from "../types/panelTypes";

export function createPanelBuilder(params: PanelParams) {
	switch (params.type) {
		case "qrd":
			return new QrdBuilder(params);
		case "skyline":
			return new SkylineBuilder(params);
		case "abfusor":
			return new AbfusorBuilder(params);
		case "absorber":
			if (params.absorberType === "porous") {
				return new PorousAbsorberBuilder(params);
			} else if (params.absorberType === "helmholtz") {
				return new HelmholtzAbsorberBuilder(params);
			}
			throw new Error(`Unsupported absorber type: ${params.absorberType}`);
		default:
			throw new Error(`Unsupported panel type: ${params.type}`);
	}
}
