import type { PanelGeometry, PanelCell } from "@/core/types/types";
import type {
	SvgExportOptions,
	SvgMetadata,
	SvgStylingOptions,
	MaterialEstimate,
	CostEstimate,
	BillOfMaterials,
} from "./types";
import type {
	SvgViewType,
	SvgLayer,
	ProjectionConfig,
	SvgElement,
	SvgRectangle,
	SvgPath,
	SvgLine,
	SvgText,
	SvgDimension,
	SvgGroup,
} from "@/core/types/svg";

/**
 * SVG Exporter - Core module for generating SVG files from panel geometry
 */
export class SvgExporter {
	private options: SvgExportOptions;
	private styling: Required<SvgStylingOptions>;

	constructor(options: Partial<SvgExportOptions> = {}) {
		const defaultStyling: Required<SvgStylingOptions> = {
			cutLineWidth: 1.5,
			foldLineWidth: 0.8,
			dimensionLineWidth: 0.6,
			fontSize: 12,
			defaultStrokeColor: "#333",
			defaultFillColor: "none",
			colorByDepth: true,
		};

		this.options = {
			includeLayers: "all",
			autoViewBox: true,
			units: "mm",
			metadata: {
				panelType: "unknown",
				cellCount: 0,
				dimensions: { width: 0, height: 0 },
				createdAt: new Date(),
				...options.metadata,
			},
			styling: {
				...defaultStyling,
				...(options.styling || {}),
			},
			...options,
		};

		// Color coding by depth (default palette)
		if (!this.options.styling.colorByDepth) {
			this.options.styling.colorByDepth = true;
			this.options.styling.depthColorMap = {
				0: "#e74c3c", // Red for shallow
				1: "#f39c12", // Orange
				2: "#f1c40f", // Yellow
				3: "#2ecc71", // Green
				4: "#3498db", // Blue
				5: "#9b59b6", // Purple
			};
		}
	}

	/**
	 * Export panel geometry to SVG string
	 */
	export(geometry: PanelGeometry, viewType: SvgViewType = "side"): string {
		const svgElements: SvgElement[] = [];

		// Generate projection based on view type
		const projection = this.projectToSvg(geometry, viewType);

		// Add elements from requested layers
		if (
			this.options.includeLayers === "all" ||
			this.options.includeLayers === "cut"
		) {
			svgElements.push(...projection.layers.cut);
		}
		if (
			this.options.includeLayers === "all" ||
			this.options.includeLayers === "fold"
		) {
			svgElements.push(...projection.layers.fold);
		}
		if (
			this.options.includeLayers === "all" ||
			this.options.includeLayers === "dimension"
		) {
			svgElements.push(...projection.layers.dimension);
		}
		if (
			this.options.includeLayers === "all" ||
			this.options.includeLayers === "label"
		) {
			svgElements.push(...projection.layers.label);
		}

		// Build SVG string
		return this.buildSvgString(
			svgElements,
			projection.boundingBox,
			projection.scale,
			projection.unit,
		);
	}

	/**
	 * Export multiple views to a single SVG file with layers
	 */
	exportMultiView(geometry: PanelGeometry): string {
		const svgElements: SvgElement[] = [];

		// Add title and description
		svgElements.push({
			type: "text",
			x: 10,
			y: 30,
			text: `Acoustic Panel - ${geometry.metadata?.prd?.diffusionRange.minFrequency || 0}Hz to ${geometry.metadata?.prd?.diffusionRange.maxFrequency || 0}Hz`,
			fontSize: this.options.styling.fontSize + 2,
			fill: "#333",
			layer: "label",
		});

		// Side view (bottom)
		const sideView = this.projectToSvg(geometry, "side");
		svgElements.push(this.createLayerGroup("Side View", sideView.layers));

		// Front view (top)
		const frontView = this.projectToSvg(geometry, "front");
		svgElements.push(this.createLayerGroup("Front View", frontView.layers));

		return this.buildSvgString(
			svgElements,
			{ x: 0, y: 0, width: 1200, height: 800 },
			1,
			this.options.units,
		);
	}

	/**
	 * Project panel cells to SVG coordinates based on view type
	 */
	private projectToSvg(
		geometry: PanelGeometry,
		viewType: SvgViewType,
	): {
		layers: Record<SvgLayer, SvgElement[]>;
		boundingBox: DimensionsSvg;
		scale: number;
		unit: Unit;
	} {
		const layers: Record<SvgLayer, SvgElement[]> = {
			cut: [],
			fold: [],
			dimension: [],
			label: [],
		};

		// Calculate projection based on view type
		if (viewType === "side") {
			this.projectSideView(geometry.cells, layers);
		} else if (viewType === "front") {
			this.projectFrontView(geometry.cells, layers);
		} else if (viewType === "top") {
			this.projectTopView(geometry.cells, layers);
		}

		// Add bounding box and metadata
		const cells = geometry.cells;
		const minx = Math.min(...cells.map((c: PanelCell) => c.x));
		const miny = Math.min(...cells.map((c: PanelCell) => c.y));
		const maxx = Math.max(...cells.map((c: PanelCell) => c.x + (c.width || 0)));
		const maxy = Math.max(
			...cells.map((c: PanelCell) => c.y + (c.height || 0)),
		);

		return {
			layers,
			boundingBox: {
				x: minx,
				y: miny,
				width: maxx - minx,
				height: maxy - miny,
			},
			scale: 1, // 1:1 scaling for mm units
			unit: this.options.units as Unit,
		};
	}

	/**
	 * Project cells to side view (depth profile)
	 */
	private projectSideView(
		cells: PanelCell[],
		layers: Record<SvgLayer, SvgElement[]>,
	): void {
		// Sort by x position for proper layering
		const sortedCells = [...cells].sort((a, b) => a.x - b.x);

		let currentX = Math.min(...cells.map((c) => c.x));
		let maxY = 0;

		sortedCells.forEach((cell) => {
			// Cut line (outer edge of cell)
			layers.cut.push({
				type: "line",
				x1: cell.x,
				y1: 0,
				x2: cell.x + cell.width,
				y2: cell.depth || cell.height,
				stroke: this.getDepthColor(cell.depth),
				strokeWidth: this.options.styling.cutLineWidth,
				layer: "cut",
			});

			// Fold line (inner edge)
			layers.fold.push({
				type: "line",
				x1: cell.x + cell.width,
				y1: 0,
				x2: cell.x + cell.width,
				y2: cell.depth || cell.height,
				stroke: this.getDepthColor(cell.depth),
				strokeWidth: this.options.styling.foldLineWidth,
				dasharray: "5,5",
				layer: "fold",
			});

			// Update current position and max depth
			currentX += cell.width;
			maxY = Math.max(maxY, cell.depth || cell.height);
		});

		// Add dimension lines for total width
		const totalWidth = cells.reduce((sum, c) => sum + (c.width || 0), 0);
		layers.dimension.push({
			type: "dimension",
			x1: 0,
			y1: -20,
			x2: totalWidth,
			y2: -20,
			value: `${totalWidth} ${this.options.units}`,
			unit: this.options.units as Unit,
			layer: "dimension",
		});

		// Add depth labels for each cell
		cells.forEach((cell, index) => {
			const depth = cell.depth || cell.height;
			layers.label.push({
				type: "text",
				x: cell.x + (cell.width || 0) / 2,
				y: -15,
				text: `${depth}mm`,
				fontSize: this.options.styling.fontSize,
				fill: "#333",
				layer: "label",
			});
		});
	}

	/**
	 * Project cells to front view (top-down)
	 */
	private projectFrontView(
		cells: PanelCell[],
		layers: Record<SvgLayer, SvgElement[]>,
	): void {
		// Sort by y position for proper layering
		const sortedCells = [...cells].sort((a, b) => a.y - b.y);

		sortedCells.forEach((cell, index) => {
			// Cut rectangle (cell outline)
			layers.cut.push({
				type: "rectangle",
				x: cell.x,
				y: cell.y,
				width: cell.width || 0,
				height: cell.height || 0,
				stroke: this.getDepthColor(cell.depth),
				strokeWidth: this.options.styling.cutLineWidth,
				fill: this.getFillColor(cell.depth),
				layer: "cut",
			});

			// Add fold lines for walls (if wall thickness is defined)
			if (cell.wallLeft || cell.wallRight || cell.wallTop || cell.wallBottom) {
				const wallThickness = 3; // Default

				if (cell.wallLeft) {
					layers.fold.push({
						type: "line",
						x1: cell.x,
						y1: cell.y,
						x2: cell.x,
						y2: cell.y + cell.height,
						stroke: "#666",
						strokeWidth: this.options.styling.foldLineWidth,
						dasharray: "3,3",
						layer: "fold",
					});
				}

				if (cell.wallRight) {
					layers.fold.push({
						type: "line",
						x1: cell.x + cell.width,
						y1: cell.y,
						x2: cell.x + cell.width,
						y2: cell.y + cell.height,
						stroke: "#666",
						strokeWidth: this.options.styling.foldLineWidth,
						dasharray: "3,3",
						layer: "fold",
					});
				}

				if (cell.wallTop) {
					layers.fold.push({
						type: "line",
						x1: cell.x,
						y1: cell.y,
						x2: cell.x + cell.width,
						y2: cell.y,
						stroke: "#666",
						strokeWidth: this.options.styling.foldLineWidth,
						dasharray: "3,3",
						layer: "fold",
					});
				}

				if (cell.wallBottom) {
					layers.fold.push({
						type: "line",
						x1: cell.x,
						y1: cell.y + cell.height,
						x2: cell.x + cell.width,
						y2: cell.y + cell.height,
						stroke: "#666",
						strokeWidth: this.options.styling.foldLineWidth,
						dasharray: "3,3",
						layer: "fold",
					});
				}
			}

			// Add cell index label
			layers.label.push({
				type: "text",
				x: cell.x + (cell.width || 0) / 2,
				y: cell.y + (cell.height || 0) / 2 - 5,
				text: `${index + 1}`,
				fontSize: this.options.styling.fontSize,
				fill: "#333",
				layer: "label",
			});
		});

		// Add overall dimension lines
		const minX = Math.min(...cells.map((c) => c.x));
		const minY = Math.min(...cells.map((c) => c.y));
		const maxX = Math.max(...cells.map((c) => c.x + (c.width || 0)));
		const maxY = Math.max(...cells.map((c) => c.y + (c.height || 0)));

		layers.dimension.push({
			type: "dimension",
			x1: minX,
			y1: maxY - 20,
			x2: maxX,
			y2: maxY - 20,
			value: `${maxX - minX} ${this.options.units}`,
			unit: this.options.units as Unit,
			layer: "dimension",
		});

		layers.dimension.push({
			type: "dimension",
			x1: minY,
			y1: maxY - 20,
			x2: minY,
			y2: maxY + 30,
			value: `${maxY - minY} ${this.options.units}`,
			unit: this.options.units as Unit,
			layer: "dimension",
		});
	}

	/**
	 * Project cells to top view (grid layout for Skyline)
	 */
	private projectTopView(
		cells: PanelCell[],
		layers: Record<SvgLayer, SvgElement[]>,
	): void {
		// Sort by row then column
		const sortedCells = [...cells].sort((a, b) => {
			if (a.y !== b.y) return a.y - b.y;
			return a.x - b.x;
		});

		sortedCells.forEach((cell) => {
			layers.cut.push({
				type: "rectangle",
				x: cell.x,
				y: cell.y,
				width: cell.width || 0,
				height: cell.height || 0,
				stroke: "#333",
				strokeWidth: this.options.styling.cutLineWidth,
				fill: this.getFillColor(cell.depth),
				layer: "cut",
			});

			// Add grid lines (faint)
			layers.fold.push({
				type: "line",
				x1: cell.x,
				y1: cell.y,
				x2: cell.x + (cell.width || 0),
				y2: cell.y,
				stroke: "#ccc",
				strokeWidth: this.options.styling.foldLineWidth / 2,
				layer: "fold",
			});

			layers.fold.push({
				type: "line",
				x1: cell.x,
				y1: cell.y,
				x2: cell.x,
				y2: cell.y + (cell.height || 0),
				stroke: "#ccc",
				strokeWidth: this.options.styling.foldLineWidth / 2,
				layer: "fold",
			});
		});

		// Add grid dimensions
		const minX = Math.min(...cells.map((c) => c.x));
		const minY = Math.min(...cells.map((c) => c.y));
		const maxX = Math.max(...cells.map((c) => c.x + (c.width || 0)));
		const maxY = Math.max(...cells.map((c) => c.y + (c.height || 0)));

		layers.dimension.push({
			type: "dimension",
			x1: minX,
			y1: maxY - 20,
			x2: maxX,
			y2: maxY - 20,
			value: `${maxX - minX} ${this.options.units}`,
			unit: this.options.units as Unit,
			layer: "dimension",
		});

		layers.dimension.push({
			type: "dimension",
			x1: minY,
			y1: maxY - 20,
			x2: minY,
			y2: maxY + 30,
			value: `${maxY - minY} ${this.options.units}`,
			unit: this.options.units as Unit,
			layer: "dimension",
		});

		// Add cell count label
		layers.label.push({
			type: "text",
			x: (minX + maxX) / 2,
			y: (minY + maxY) / 2 - 30,
			text: `${cells.length} cells`,
			fontSize: this.options.styling.fontSize + 1,
			fill: "#333",
			layer: "label",
		});
	}

	/**
	 * Build complete SVG string from elements
	 */
	private buildSvgString(
		elements: SvgElement[],
		boundingBox: DimensionsSvg,
		scale: number,
		unit: Unit,
	): string {
		// Calculate viewBox
		const viewBox = this.options.autoViewBox
			? {
					x: boundingBox.x,
					y: boundingBox.y,
					width: boundingBox.width,
					height: boundingBox.height,
				}
			: this.options.viewBox || { x: 0, y: 0, width: 800, height: 600 };

		// Update metadata dimensions
		this.options.metadata.dimensions = { ...boundingBox };

		// Build SVG header
		const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${viewBox.width}" height="${viewBox.height}"
     viewBox="${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}"
     preserveAspectRatio="xMidYMid meet">

  <defs>
    <!-- Gradient definitions -->
    <style>
      .cut-line { stroke: #000; stroke-width: ${this.options.styling.cutLineWidth}; fill: none; }
      .fold-line { stroke: #666; stroke-width: ${this.options.styling.foldLineWidth}; stroke-dasharray: 5,5; fill: none; }
      .dimension-line { stroke: #000; stroke-width: ${this.options.styling.dimensionLineWidth}; fill: none; }
      .label-text { font-family: Arial, sans-serif; font-size: ${this.options.styling.fontSize}px; fill: #333; }
    </style>
  </defs>`;

		// Build layer groups
		const layersHtml = elements
			.map((el, index) => this.buildElement(el))
			.join("\n");

		// Build footer with metadata
		const svgFooter = `</svg>`;

		return `${svgHeader}\n${layersHtml}\n${svgFooter}`;
	}

	/**
	 * Convert SVG element to HTML string
	 */
	private buildElement(element: SvgElement): string {
		switch (element.type) {
			case "rectangle":
				return this.buildRectangle(element);
			case "path":
				return this.buildPath(element);
			case "line":
				return this.buildLine(element);
			case "text":
				return this.buildText(element);
			case "dimension":
				return this.buildDimension(element);
			case "group":
				return this.buildGroup(element);
			default:
				return "";
		}
	}

	private buildRectangle(rect: SvgRectangle): string {
		const attrs = [
			`x="${rect.x}"`,
			`y="${rect.y}"`,
			`width="${rect.width}"`,
			`height="${rect.height}"`,
		];

		if (rect.stroke) attrs.push(`stroke="${rect.stroke}"`);
		if (rect.fill) attrs.push(`fill="${rect.fill}"`);
		if (rect.strokeWidth !== undefined)
			attrs.push(`stroke-width="${rect.strokeWidth}"`);
		if (rect.dasharray) attrs.push(`stroke-dasharray="${rect.dasharray}"`);

		return `<rect ${attrs.join(" ")} />`;
	}

	private buildPath(path: SvgPath): string {
		const attrs = [
			`d="${path.d}"`,
			path.stroke ? `stroke="${path.stroke}"` : "",
			path.fill ? `fill="${path.fill}"` : "",
			path.strokeWidth !== undefined
				? `stroke-width="${path.strokeWidth}"`
				: "",
			path.dasharray ? `stroke-dasharray="${path.dasharray}"` : "",
		].filter(Boolean);

		return `<path ${attrs.join(" ")} />`;
	}

	private buildLine(line: SvgLine): string {
		const attrs = [
			`x1="${line.x1}"`,
			`y1="${line.y1}"`,
			`x2="${line.x2}"`,
			`y2="${line.y2}"`,
			`stroke="${line.stroke}"`,
			`stroke-width="${line.strokeWidth}"`,
		];

		if (line.dasharray) attrs.push(`stroke-dasharray="${line.dasharray}"`);

		return `<line ${attrs.join(" ")} />`;
	}

	private buildText(text: SvgText): string {
		const attrs = [
			`x="${text.x}"`,
			`y="${text.y}"`,
			`text-anchor="middle"`,
			`dominant-baseline="${text.baseLine || "alphabetic"}"`,
			`font-size="${text.fontSize}px"`,
			text.fill ? `fill="${text.fill}"` : "",
		];

		return `<text ${attrs.join(" ")}>${this.escapeXml(text.text)}</text>`;
	}

	private buildDimension(dim: SvgDimension): string {
		// Simplified dimension rendering as line with value below
		const attrs = [
			`x1="${dim.x1}"`,
			`y1="${dim.y1}"`,
			`x2="${dim.x2}"`,
			`y2="${dim.y2}"`,
			`stroke="#000"`,
			`stroke-width="${this.options.styling.dimensionLineWidth}"`,
		];

		return (
			`<line ${attrs.join(" ")} />` +
			`<text x="${(dim.x1 + dim.x2) / 2}" y="${dim.y2 - 5}" text-anchor="middle" font-size="${this.options.styling.fontSize}px">${this.escapeXml(dim.value)}</text>`
		);
	}

	private buildGroup(group: SvgGroup): string {
		const childrenHtml = group.children
			.map((child) => this.buildElement(child))
			.join("\n");

		let transformAttr = "";
		if (group.transform) {
			transformAttr = `transform="${group.transform}"`;
		}

		return `<g ${transformAttr} id="${group.layer || "default"}">${childrenHtml}</g>`;
	}

	/**
	 * Create layer group with title
	 */
	private createLayerGroup(title: string, elements: SvgElement[]): SvgElement {
		const groupElements = [...elements];

		// Add title text at top of group
		if (title) {
			groupElements.unshift({
				type: "text",
				x: 10,
				y: 10,
				text: `${title}:`,
				fontSize: this.options.styling.fontSize + 2,
				fill: "#333",
				layer: "label",
			});
		}

		return {
			type: "group",
			children: groupElements,
			transform: `translate(0, ${title ? 40 : 0})`,
			layer: title || undefined,
		};
	}

	/**
	 * Get color based on depth value (for color coding)
	 */
	private getDepthColor(depth?: number): string {
		if (
			!this.options.styling.colorByDepth ||
			!this.options.styling.depthColorMap
		) {
			return this.options.styling.defaultStrokeColor;
		}

		// Find closest depth in map
		const mappedDepth = Object.keys(this.options.styling.depthColorMap).find(
			(key) => {
				const value = parseInt(key);
				return Math.abs(value - (depth || 0)) < 5;
			},
		);

		if (mappedDepth) {
			return this.options.styling.depthColorMap[parseInt(mappedDepth)];
		}

		// Default color
		return this.options.styling.defaultStrokeColor;
	}

	/**
	 * Get fill color based on depth
	 */
	private getFillColor(depth?: number): string {
		if (
			!this.options.styling.colorByDepth ||
			!this.options.styling.depthColorMap
		) {
			return this.options.styling.defaultFillColor;
		}

		// Use lighter version of stroke color for fill
		const colors = Object.values(this.options.styling.depthColorMap);
		const mappedIndex =
			colors.findIndex(
				(color) =>
					Math.abs(
						parseInt(
							Object.keys(this.options.styling.depthColorMap).find((key) => {
								return (
									this.options.styling.depthColorMap[parseInt(key)] === color
								);
							}) || "0",
						) - (depth || 0),
					) < 5,
			) !== -1;

		if (mappedIndex >= 0 && colors[mappedIndex]) {
			// Lighten the color by adding transparency
			return `${colors[mappedIndex]}40`; // Add alpha channel
		}

		return this.options.styling.defaultFillColor;
	}

	/**
	 * Escape XML special characters
	 */
	private escapeXml(text: string): string {
		return text
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");
	}

	/**
	 * Estimate material usage from geometry
	 */
	estimateMaterials(geometry: PanelGeometry): MaterialEstimate {
		const cells = geometry.cells;

		// Calculate total area
		let totalAreaM2 = 0;
		let byComponent = { wells: 0, backing: 0, frame: 0 };

		cells.forEach((cell) => {
			const areaM2 = (cell.width * cell.height) / 1_000_000; // Convert mm² to m²
			totalAreaM2 += areaM2;
			byComponent.wells += areaM2;
		});

		// Add backing plate if present
		if (geometry.metadata?.backingPlateThickness) {
			const backingArea =
				(geometry.boundingBox.width * geometry.boundingBox.height) / 1_000_000;
			totalAreaM2 += backingArea;
			byComponent.backing = backingArea;
		}

		// Apply waste factor (default 5%)
		const wasteFactor = this.options.metadata.wasteFactor || 0.05;
		const adjustedTotalM2 = totalAreaM2 * (1 + wasteFactor);

		return {
			totalAreaM2: adjustedTotalM2,
			byComponent: { ...byComponent },
			wasteFactor,
			adjustedTotalM2,
		};
	}

	/**
	 * Calculate cost estimate from geometry and material specs
	 */
	calculateCost(
		geometry: PanelGeometry,
		materials?: MaterialSpec[],
	): CostEstimate {
		const materialSpecs = materials || [
			{ type: "wood", density: 600, costPerUnit: 15, wasteFactor: 0.05 },
			{ type: "foam", density: 30, costPerUnit: 8, wasteFactor: 0.05 },
		];

		const materialEstimate = this.estimateMaterials(geometry);

		// Calculate material costs
		let totalMaterialCost = 0;
		materialSpecs.forEach((spec) => {
			const areaM2 =
				materialEstimate.byComponent[
					spec.type as keyof typeof materialEstimate.byComponent
				] || 0;
			totalMaterialCost += areaM2 * spec.costPerUnit;
		});

		// Add waste overhead (10% of material cost)
		const wasteOverhead = totalMaterialCost * 0.1;

		return {
			materials: totalMaterialCost,
			wasteOverhead,
			total: totalMaterialCost + wasteOverhead,
			currency: "USD",
			breakdown: [
				{
					category: "Primary Material",
					quantity: materialEstimate.totalAreaM2,
					unitPrice: 15,
					total: totalMaterialCost,
				},
				{
					category: "Waste Overhead (10%)",
					quantity: 1,
					unitPrice: wasteOverhead / totalMaterialCost || 0,
					total: wasteOverhead,
				},
			],
		};
	}

	/**
	 * Generate Bill of Materials from geometry
	 */
	generateBom(geometry: PanelGeometry): BillOfMaterials {
		const cells = geometry.cells;

		// Calculate cell count and dimensions
		const minx = Math.min(...cells.map((c) => c.x));
		const minY = Math.min(...cells.map((c) => c.y));
		const maxX = Math.max(...cells.map((c) => c.x + (c.width || 0)));
		const maxY = Math.max(...cells.map((c) => c.y + (c.height || 0)));

		return {
			panelInfo: {
				type: geometry.metadata?.prd?.diffusionRange.minFrequency
					? "qrd"
					: "unknown",
				dimensions: {
					x: minx,
					y: minY,
					width: maxX - minx,
					height: maxY - minY,
				},
				cellCount: cells.length,
				panelType: "qrd", // Default, could be determined from params
			},
			items: [
				{
					item: "Panel Cells",
					description: `${cells.length} acoustic diffuser wells`,
					quantity: cells.length,
					unit: "pcs",
					materialType: "wood",
					costPerUnit: 0.5,
					totalCost: cells.length * 0.5,
				},
				{
					item: "Backing Plate",
					description: `Full panel backing (${geometry.boundingBox.width}x${geometry.boundingBox.height})`,
					quantity: 1,
					unit: "pcs",
					materialType: "plywood-18mm",
					costPerUnit: 25,
					totalCost: 25,
				},
			],
			totals: {
				materialCount: cells.length + 1,
				totalMaterialAreaM2:
					(geometry.boundingBox.width * geometry.boundingBox.height) /
					1_000_000,
				totalCost: 75, // Simplified calculation
				currency: "USD",
			},
			generatedAt: new Date(),
		};
	}
}
