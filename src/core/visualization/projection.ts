import type { PanelGeometry, PanelCell } from "@/core/types/types";
import type {
	ProjectedCell,
	SvgViewType,
	ProjectionConfig,
} from "@/core/types/svg";

/**
 * Project panel cells to 2D SVG coordinates based on view type
 */
export function projectCellsToSvg(
	geometry: PanelGeometry,
	viewType: SvgViewType,
	config: ProjectionConfig,
): ProjectedCell[] {
	const { unit } = config;
	const scale = config.scale || 1; // Default 1:1 scaling

	return geometry.cells.map((cell) => {
		let x: number;
		let y: number;
		let visible = true;
		let depthValue: number | undefined;

		switch (viewType) {
			case "side":
				// Side view: show depth profile
				x = cell.x * scale;
				y = (geometry.boundingBox.height - cell.y) * scale; // Flip Y for SVG
				depthValue = cell.depth;
				break;

			case "front":
				// Front view: show wells from front
				x = cell.x * scale;
				y = cell.y * scale;
				visible = true;
				depthValue = undefined;
				break;

			case "top":
				// Top view: plan view (for Skyline, Abfusor)
				x = cell.x * scale;
				y = cell.y * scale;
				visible = true;
				depthValue = undefined;
				break;

			default:
				x = 0;
				y = 0;
				visible = false;
		}

		return {
			cell,
			x,
			y,
			visible,
			depthValue,
		};
	});
}

/**
 * Generate SVG rectangles for cell walls (cut lines)
 */
export function generateWallRectangles(
	projectedCells: ProjectedCell[],
	config: ProjectionConfig,
): {
	type: "rectangle";
	x: number;
	y: number;
	width: number;
	height: number;
}[] {
	const elements = [];

	for (const proj of projectedCells) {
		if (!proj.visible || !proj.cell.wallRight || !proj.cell.wallBottom) {
			continue;
		}

		const wallThickness = proj.cell.wallLeft
			? proj.cell.wallRight - proj.cell.wallLeft
			: 3; // Default if not specified

		const x = proj.x + wallThickness / 2;
		const y = proj.y + wallThickness / 2;
		const width = Math.max(0, (proj.cell.width || 0) - wallThickness);
		const height = Math.max(0, (proj.cell.height || 0) - wallThickness);

		if (width <= 0 || height <= 0) continue;

		elements.push({
			type: "rectangle",
			x,
			y,
			width,
			height,
			stroke: "#000000",
			strokeWidth: 1.5,
			dasharray: "", // Solid for cut lines
			layer: "cut",
		});
	}

	return elements;
}

/**
 * Generate SVG rectangles for backing plate (if enabled)
 */
export function generateBackingRectangles(
	projectedCells: ProjectedCell[],
	backingThickness: number,
	config: ProjectionConfig,
): {
	type: "rectangle";
	x: number;
	y: number;
	width: number;
	height: number;
}[] {
	if (!config.showDimensions) return [];

	const elements = [];

	for (const proj of projectedCells) {
		if (!proj.cell.backingThickness || backingThickness <= 0) continue;

		const wallThickness = proj.cell.wallLeft
			? proj.cell.wallRight - proj.cell.wallLeft
			: 3;

		const x = proj.x + wallThickness / 2;
		const y = proj.y + wallThickness / 2;
		const width = Math.max(0, (proj.cell.width || 0) - wallThickness * 2);
		const height = backingThickness;

		if (width <= 0 || height <= 0) continue;

		elements.push({
			type: "rectangle",
			x,
			y,
			width,
			height,
			stroke: "#6B7280",
			fill: "none",
			strokeWidth: 1,
			dasharray: "5,5", // Dashed for backing
			layer: "hidden",
		});
	}

	return elements;
}

/**
 * Generate dimension lines and annotations
 */
export function generateDimensionAnnotations(
	projectedCells: ProjectedCell[],
	config: ProjectionConfig,
): {
	type: "dimension";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	value: string;
}[] {
	if (!config.showDimensions) return [];

	const elements = [];
	const unitMultiplier = config.unit === "inch" ? 25.4 : 1; // Convert to SVG units if needed

	// Add overall panel dimensions
	const totalWidth = geometryTotalWidth(projectedCells, config);
	const totalHeight = geometryTotalHeight(projectedCells, config);

	if (totalWidth > 0 && totalHeight > 0) {
		// Width dimension at bottom
		elements.push({
			type: "dimension",
			x1: projectedCells[0]?.x || 0,
			y1:
				projectedCells.length > 0
					? projectedCells[projectedCells.length - 1].y
					: 0,
			x2: projectedCells[0]?.x + totalWidth,
			y2:
				projectedCells.length > 0
					? projectedCells[projectedCells.length - 1].y
					: 0,
			value: `${totalWidth.toFixed(1)} ${config.unit}`,
			unit: config.unit,
			extensionLines: true,
			arrowheads: true,
			layer: "dimension",
		});

		// Height dimension at right side
		const startY =
			projectedCells.length > 0
				? projectedCells[projectedCells.length - 1].y
				: 0;
		const endY = startY + totalHeight;

		elements.push({
			type: "dimension",
			x1: projectedCells[0]?.x + totalWidth,
			y1: startY,
			x2: projectedCells[0]?.x + totalWidth,
			y2: endY,
			value: `${totalHeight.toFixed(1)} ${config.unit}`,
			unit: config.unit,
			extensionLines: true,
			arrowheads: true,
			layer: "dimension",
		});
	}

	return elements;
}

/**
 * Generate depth annotations for side view (QRD wells)
 */
export function generateDepthAnnotations(
	projectedCells: ProjectedCell[],
	config: ProjectionConfig,
): { type: "text"; x: number; y: number; text: string }[] {
	if (!config.showLabels || config.viewType !== "side") return [];

	const elements = [];

	for (const proj of projectedCells) {
		if (!proj.depthValue || !proj.visible) continue;

		const depthText = `${proj.depthValue.toFixed(1)} ${config.unit}`;
		const annotationY = proj.y + 5; // Offset from top of well

		elements.push({
			type: "text",
			x: proj.x,
			y: annotationY,
			text: depthText,
			fontSize: 10,
			fill: "#374151",
			baseLine: "bottom",
			layer: "label",
		});
	}

	return elements;
}

/**
 * Calculate total width from projected cells
 */
function geometryTotalWidth(
	cells: ProjectedCell[],
	config?: Partial<ProjectionConfig>,
): number {
	if (cells.length === 0) return 0;

	const first = cells[0];
	const last = cells[cells.length - 1];

	// For side view, use bounding box width
	return Math.max(
		(last.x || 0) + (last.cell.width || 0) * (config?.scale ?? 1),
		first.x || 0,
	);
}

/**
 * Calculate total height from projected cells
 */
function geometryTotalHeight(
	cells: ProjectedCell[],
	config?: Partial<ProjectionConfig>,
): number {
	if (cells.length === 0) return 0;

	const first = cells[0];
	const last = cells[cells.length - 1];

	return Math.max(
		(last.y || 0) + (last.cell.height || 0) * (config?.scale ?? 1),
		first.y || 0,
	);
}
