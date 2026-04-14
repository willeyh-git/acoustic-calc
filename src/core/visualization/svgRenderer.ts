import type { PanelGeometry } from "@/core/types/types";
import type {
	SvgViewData,
	SvgElement,
	SvgLayer,
	ProjectionConfig,
	SvgOrigin,
} from "@/core/types/svg";
import { projectCellsToSvg } from "./projection";

/**
 * Default SVG styling configuration
 */
export const DEFAULT_STYLES = {
	cut: { stroke: "#000000", strokeWidth: 1.5, fill: "none" },
	fold: { stroke: "#6B7280", strokeWidth: 1, fill: "none", dasharray: "3,3" },
	dimension: { stroke: "#DC2626", strokeWidth: 1, fill: "none" },
	label: { stroke: "none", fontSize: 10, fill: "#374151" },
	hidden: { stroke: "#9CA3AF", strokeWidth: 1, fill: "none", dasharray: "5,5" },
};

/**
 * Create SVG view data from panel geometry
 */
export function createSvgView(
	geometry: PanelGeometry,
	viewType: SvgViewType = "side",
	config?: Partial<ProjectionConfig>,
): SvgViewData {
	const projectionConfig: ProjectionConfig = {
		viewType,
		panelType: geometry.metadata?.diffusion ? "qrd" : "panel", // Simplified detection
		unit: "mm",
		scale: 1,
		showDimensions: true,
		showLabels: true,
		orientation: "horizontal",
		...config,
	};

	const projectedCells = projectCellsToSvg(
		geometry,
		viewType,
		projectionConfig,
	);
	const boundingBox = calculateBoundingBox(projectedCells);

	// Generate layers
	const cutLayer = generateCutLines(projectedCells, projectionConfig);
	const foldLayer = generateFoldLines(projectedCells, projectionConfig);
	const dimensionLayer = generateDimensionAnnotations(
		projectedCells,
		projectionConfig,
	);
	const labelLayer = generateDepthAnnotations(projectedCells, projectionConfig);
	const hiddenLayer = generateHiddenElements(projectedCells, projectionConfig);

	return {
		viewType,
		projectionConfig,
		layers: {
			cut: cutLayer,
			fold: foldLayer,
			dimension: dimensionLayer,
			label: labelLayer,
			hidden: hiddenLayer,
		},
		boundingBox,
		scale: projectionConfig.scale || 1,
		unit: projectionConfig.unit,
	};
}

/**
 * Calculate bounding box from projected cells
 */
function calculateBoundingBox(
	cells: { x: number; y: number }[],
): DimensionsSvg {
	if (cells.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	const minX = Math.min(...cells.map((c) => c.x));
	const maxX = Math.max(
		...cells.map(
			(c) => (c.x || 0) + (c.cell?.width || 0) * (config.scale || 1),
		),
	);
	const minY = Math.min(...cells.map((c) => c.y));
	const maxY = Math.max(
		...cells.map(
			(c) => (c.y || 0) + (c.cell?.height || 0) * (config.scale || 1),
		),
	);

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}

/**
 * Generate cut lines (solid black lines for cutting)
 */
function generateCutLines(
	cells: { x: number; y: number }[],
	config: ProjectionConfig,
): SvgElement[] {
	const elements = [];

	for (const cell of cells) {
		if (!cell.cell || !cell.visible) continue;

		const wallThickness = cell.cell.wallLeft
			? cell.cell.wallRight - cell.cell.wallLeft
			: 3;

		const x = cell.x + wallThickness / 2;
		const y = cell.y + wallThickness / 2;
		const width = Math.max(0, (cell.cell.width || 0) - wallThickness);
		const height = Math.max(0, (cell.cell.height || 0) - wallThickness);

		if (width <= 0 || height <= 0) continue;

		elements.push({
			type: "rectangle",
			x,
			y,
			width,
			height,
			stroke: "#000000",
			strokeWidth: 1.5,
			fill: "none",
			dasharray: "",
			layer: "cut",
		});
	}

	return elements;
}

/**
 * Generate fold lines (dashed lines for folding)
 */
function generateFoldLines(
	cells: { x: number; y: number }[],
	config: ProjectionConfig,
): SvgElement[] {
	const elements = [];

	for (const cell of cells) {
		if (!cell.cell || !cell.visible) continue;

		// Add fold lines at well boundaries for QRD/Skyline panels
		const wellWidth = config.unit === "inch" ? 25.4 : 10; // Default well width
		const numWells = Math.floor(cell.cell.width / wellWidth);

		for (let i = 1; i < numWells; i++) {
			const foldX = cell.x + i * wellWidth + 1.5; // Offset by half wall thickness
			const foldY = cell.y + 1.5;

			elements.push({
				type: "line",
				x1: foldX,
				y1: foldY,
				x2: foldX,
				y2: foldY + (cell.cell.height || 0),
				stroke: "#6B7280",
				strokeWidth: 1,
				dasharray: "3,3",
				layer: "fold",
			});
		}
	}

	return elements;
}

/**
 * Generate hidden elements (backing plate, etc.)
 */
function generateHiddenElements(
	cells: { x: number; y: number }[],
	config: ProjectionConfig,
): SvgElement[] {
	const elements = [];
	const backingThickness = 9; // Default backing thickness

	for (const cell of cells) {
		if (!cell.cell || !config.showDimensions) continue;

		const wallThickness = cell.cell.wallLeft
			? cell.cell.wallRight - cell.cell.wallLeft
			: 3;

		const x = cell.x + wallThickness / 2;
		const y = cell.y + wallThickness / 2;
		const width = Math.max(0, (cell.cell.width || 0) - wallThickness * 2);
		const height = backingThickness;

		if (width <= 0 || height <= 0) continue;

		elements.push({
			type: "rectangle",
			x,
			y,
			width,
			height,
			stroke: "#9CA3AF",
			fill: "none",
			strokeWidth: 1,
			dasharray: "5,5",
			layer: "hidden",
		});
	}

	return elements;
}

/**
 * Convert SVG element array to SVG string
 */
export function svgElementsToString(
	elements: SvgElement[],
	viewBox: [number, number, number, number],
): string {
	let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}" width="${viewBox[2]}" height="${viewBox[3]}">`;

	for (const element of elements) {
		svgContent += svgElementToString(element);
	}

	svgContent += "</svg>";
	return svgContent;
}

/**
 * Convert single SVG element to string
 */
function svgElementToString(element: SvgElement): string {
	switch (element.type) {
		case "rectangle":
			const rect = element as {
				x: number;
				y: number;
				width: number;
				height: number;
				stroke?: string;
				strokeWidth?: number;
				fill?: string;
				dasharray?: string;
			};
			return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" ${element.stroke ? `stroke="${element.stroke}"` : ""} ${element.strokeWidth ? `stroke-width="${element.strokeWidth}"` : ""} ${element.fill ? `fill="${element.fill}"` : ""} ${element.dasharray ? `stroke-dasharray="${element.dasharray}"` : ""} />`;

		case "line":
			const line = element as {
				x1: number;
				y1: number;
				x2: number;
				y2: number;
				stroke: string;
				strokeWidth: number;
				dasharray?: string;
			};
			return `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.stroke}" stroke-width="${line.strokeWidth}" ${element.dasharray ? `stroke-dasharray="${element.dasharray}"` : ""} />`;

		case "text":
			const text = element as {
				x: number;
				y: number;
				text: string;
				fontSize: number;
				fill?: string;
			};
			return `<text x="${text.x}" y="${text.y}" font-size="${text.fontSize}" ${element.fill ? `fill="${element.fill}"` : ""} text-anchor="middle">${text.text}</text>`;

		case "dimension":
			const dim = element as {
				x1: number;
				y1: number;
				x2: number;
				y2: number;
				value: string;
			};
			return `<text x="${(dim.x1 + dim.x2) / 2}" y="${(dim.y1 + dim.y2) / 2 - 5}" font-size="10" text-anchor="middle">${dim.value}</text>`;

		default:
			return "";
	}
}
