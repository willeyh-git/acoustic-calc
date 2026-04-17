import type { PanelGeometry, PanelCell, Unit } from "@/core/types/types";
import type {
	SvgViewType,
	SvgLayer,
	ProjectionConfig,
	SvgElement,
	DimensionsSvg,
} from "@/core/types/svg";

/**
 * SVG export options configuration
 */
export interface SvgExportOptions {
	/** Which layers to include in the export */
	includeLayers: "all" | "cut" | "fold" | "dimension" | "label" | "hidden";

	/** Auto-calculate viewBox or use manual values */
	autoViewBox?: boolean;

	viewBox?: {
		x: number;
		y: number;
		width: number;
		height: number;
	};

	/** Unit system for the exported file */
	units: "mm" | "inch";

	/** Metadata to embed in SVG */
	metadata: SvgMetadata;

	/** Styling options */
	styling?: SvgStylingOptions;
}

/**
 * Metadata embedded in SVG files
 */
export interface SvgMetadata {
	/** Panel type identifier */
	panelType: string;

	/** Panel dimensions */
	dimensions: DimensionsSvg;

	/** Total number of cells */
	cellCount: number;

	/** When the export was created */
	createdAt: Date;

	/** Version of the calculator */
	version?: string;

	/** Additional custom metadata */
	[key: string]: unknown;
}

/**
 * Styling options for SVG elements
 */
export interface SvgStylingOptions {
	/** Default stroke color */
	defaultStrokeColor?: string;

	/** Default fill color */
	defaultFillColor?: string;

	/** Stroke width for cut lines */
	cutLineWidth: number;

	/** Stroke width for fold lines */
	foldLineWidth: number;

	/** Stroke width for dimension lines */
	dimensionLineWidth: number;

	/** Text font size */
	fontSize: number;

	/** Color coding by depth (optional) */
	colorByDepth?: boolean;

	/** Depth to color mapping (optional) */
	depthColorMap?: Record<number, string>;
}

/**
 * DXF export options
 */
export interface DxfExportOptions {
	/** Layer definitions for the DXF file */
	layers: DxfLayer[];

	/** Unit system */
	units: "MM" | "INCHES";

	/** Include custom metadata in header */
	includeMetadata?: boolean;
}

/**
 * DXF layer configuration
 */
export interface DxfLayer {
	name: string;
	color: number; // AutoCAD Index Color (1-255)
	linetype: "CONTINUOUS" | "DASHED" | "DOT" | "DASH_DOT";
	linewidth: number; // Plot pen width in mm
}

/**
 * PDF report options
 */
export interface PdfReportOptions {
	/** Which sections to include */
	includeSections: {
		technicalSpecs?: boolean;
		visualViews?: boolean;
		materialList?: boolean;
		costEstimate?: boolean;
		acousticData?: boolean;
	};

	/** Page size */
	pageSize: "A4" | "Letter";

	/** Page orientation */
	orientation: "portrait" | "landscape";

	/** Include header/footer with logo or text */
	includeHeaderFooter?: boolean;
}

/**
 * Material specification for cost estimation
 */
export interface MaterialSpec {
	type: "wood" | "foam" | "fabric" | "metal" | "acrylic" | string;
	density: number; // kg/m³
	costPerUnit: number; // $/m² or $/m³ depending on type
	wasteFactor: number; // Default 0.05 (5%)
	thickness?: number; // For volumetric materials
}

/**
 * Material estimation result
 */
export interface MaterialEstimate {
	totalAreaM2: number;
	totalVolumeM3: number;
	byComponent: Record<string, number>;
	wasteFactor: number;
	adjustedTotalM2: number;
}

/**
 * Cost estimate breakdown
 */
export interface CostEstimate {
	materials: number;
	labor?: number;
	wasteOverhead: number;
	total: number;
	currency: string;
	breakdown: CostBreakdownItem[];
}

/**
 * Individual cost breakdown item
 */
export interface CostBreakdownItem {
	category: string;
	quantity: number;
	unitPrice: number;
	total: number;
	notes?: string;
}

/**
 * Bill of Materials entry
 */
export interface BomEntry {
	item: string;
	description?: string;
	quantity: number;
	unit: "m²" | "m³" | "pcs";
	materialType: string;
	costPerUnit: number;
	totalCost: number;
	notes?: string;
}

/**
 * Complete BOM structure
 */
export interface BillOfMaterials {
	panelInfo: PanelInfo;
	items: BomEntry[];
	totals: {
		materialCount: number;
		totalMaterialAreaM2: number;
		totalCost: number;
		currency: string;
	};
	generatedAt: Date;
}

/**
 * Panel information for BOM
 */
export interface PanelInfo {
	type: string;
	dimensions: DimensionsSvg;
	cellCount: number;
	panelType: "qrd" | "skyline" | "abfusor" | "absorber";
}

/**
 * Export result base interface
 */
export interface ExportResult<T = unknown> {
	success: boolean;
	data?: T;
	format: string;
	fileSize: number;
	metadata: ExportMetadata;
	error?: string;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
	exportId: string;
	timestamp: Date;
	panelType: string;
	cellCount: number;
	formatVersion: string;
}
