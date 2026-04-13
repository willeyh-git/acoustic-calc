import { QrdBuilder } from "../geometry/QRDBuilder";
import type { PanelParams } from "../types/panelTypes";

const registry = {
  qrd: QrdBuilder,
  // skyline: SkylineBuilder,
};

export function createPanelBuilder(params: PanelParams) {
  if (params.type !== "qrd") throw new Error("Not implemented yet");
  const Builder = registry[params.type];

  if (!Builder) {
    throw new Error(`Unsupported panel type: ${params.type}`);
  }

  return new Builder(params);
}
