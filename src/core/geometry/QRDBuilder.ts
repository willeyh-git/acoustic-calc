import { computeQrd } from "../math/qrd";
import type { QrdParams } from "../types/panelTypes";
import type { PanelGeometry, Sequence1D } from "../types/types";
import { PanelBuilder } from "./panelBuilder";

export class QrdBuilder extends PanelBuilder<QrdParams> {
  buildGeometry(): PanelGeometry {
    const { prime, designFrequency, wellWidth } = this.params;

    const result = computeQrd(prime, designFrequency, wellWidth);

    const cells = result.depths.map((depth, i) => ({
      x: i * wellWidth,
      y: 0,
      width: wellWidth,
      height: this.params.dimensions.height,
      depth,
    }));

    return {
      cells,
      boundingBox: this.params.dimensions,
      metadata: {
        diffusion: result.diffusion,
      },
    };
  }

  generateSequence(): Sequence1D {
    const { prime } = this.params;

    const values = Array.from({ length: prime }, (_, n) => (n * n) % prime);

    return {
      values,
      modulus: prime,
    };
  }
}
