import type { PanelParams } from "../types/panelTypes";
import type { PanelGeometry, Sequence1D, Sequence2D } from "../types/types";

export abstract class PanelBuilder<T extends PanelParams> {
  constructor(protected params: T) {}

  abstract generateSequence(): Sequence1D | Sequence2D;

  abstract buildGeometry(sequence: Sequence1D | Sequence2D): PanelGeometry;

  build(): PanelGeometry {
    const sequence = this.generateSequence();
    return this.buildGeometry(sequence);
  }
}
