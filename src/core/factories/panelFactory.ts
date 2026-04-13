import { QrdBuilder } from "../geometry/QRDBuilder";
import { SkylineBuilder } from "../geometry/SkylineBuilder";
import type { PanelParams } from "../types/panelTypes";

export function createPanelBuilder(params: PanelParams) {
	switch (params.type) {
		case "qrd":
			return new QrdBuilder(params);
		case "skyline":
			return new SkylineBuilder(params);
		default:
			throw new Error(`Unsupported panel type: ${params.type}`);
	}
}
