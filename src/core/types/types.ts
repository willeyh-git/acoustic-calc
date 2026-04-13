export type Unit = "mm" | "cm" | "inch";

export interface Dimensions {
  width: number;
  height: number;
  depth: number;
}

export interface DiffusionRange {
  minFrequency: number;
  maxFrequency: number;
}

export interface Material {
  thickness: number;
  kerf?: number;
  density?: number;
}

interface BaseSequence {
  modulus: number;
}

export interface Sequence1D extends BaseSequence {
  values: number[];
}

export interface Sequence2D extends BaseSequence {
  values: number[][];
}

export interface AcousticInfo {
  wavelength: number;
  frequency: number;
  maxDiffusionFreq?: number;
  minDiffusionFreq?: number;
}

export interface PanelCell extends Dimensions {
  x: number;
  y: number;

  // Optional construction data
  wallLeft?: number;
  wallRight?: number;
  wallTop?: number;
  wallBottom?: number;
}

export interface CutPiece extends Omit<Dimensions, "depth"> {
  quantity: number;
  label?: string;
}

export interface PanelGeometry {
  cells: PanelCell[];

  boundingBox: Dimensions;

  metadata?: {
    materialUsage?: number;
    cutList?: CutPiece[];
    diffusion?: DiffusionRange;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}
