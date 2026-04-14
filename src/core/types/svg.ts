import type { PanelGeometry, PanelCell, Unit } from "./types";

/**
 * View types for 2D SVG visualization
 */
export type SvgViewType = "side" | "front" | "top";

/**
 * Projection direction for different panel types
 */
export interface ProjectionConfig {
	viewType: SvgViewType;
	panelType: string;
	unit: Unit;
	scale?: number; // 1:1 by default, can be overridden
	showDimensions?: boolean;
	showLabels?: boolean;
	orientation?: "horizontal" | "vertical";
}

/**
 * SVG coordinate system origin
 */
export type SvgOrigin = "top-left" | "bottom-left";

/**
 * Dimension annotation style
 */
export interface DimensionStyle {
	lineWidth: number;
	lineColor: string;
	textSize: number;
	arrowLength: number;
	showExtensionLines?: boolean;
}

/**
 * Layer types for SVG export separation
 */
export type SvgLayer = "cut" | "fold" | "dimension" | "label" | "hidden";

/**
 * SVG view data structure
 */
export interface SvgViewData {
	viewType: SvgViewType;
	projectionConfig: ProjectionConfig;
	layers: Record<SvgLayer, SvgElement[]>;
	boundingBox: DimensionsSvg;
	scale: number;
	unit: Unit;
}

/**
 * SVG element types
 */
export type SvgElement =
	| SvgRectangle
	| SvgPath
	| SvgLine
	| SvgText
	| SvgDimension
	| SvgGroup;

export interface SvgRectangle {
	type: "rectangle";
	x: number;
	y: number;
	width: number;
	height: number;
	stroke?: string;
	fill?: string;
	strokeWidth?: number;
	dasharray?: string; // For fold lines, hidden lines
	layer?: SvgLayer;
	label?: string;
}

export interface SvgPath {
	type: "path";
	d: string; // SVG path data
	stroke?: string;
	fill?: string;
	strokeWidth?: number;
	dasharray?: string;
	layer?: SvgLayer;
	label?: string;
}

export interface SvgLine {
	type: "line";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	stroke: string;
	strokeWidth: number;
	dasharray?: string;
	layer?: SvgLayer;
}

export interface SvgText {
	type: "text";
	x: number;
	y: number;
	text: string;
	fontSize: number;
	fontFamily?: string;
	fill?: string;
	baseLine?: "hanging" | "middle" | "alphabetic" | "ideographic" | "bottom";
	layer?: SvgLayer;
}

export interface SvgDimension {
	type: "dimension";
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	value: string; // Formatted with units
	unit: Unit;
	extensionLines?: boolean;
	arrowheads?: boolean;
	layer?: SvgLayer;
}

export interface SvgGroup {
	type: "group";
	children: SvgElement[];
	transform?: string; // SVG transform attribute
	layer?: SvgLayer;
}

/**
 * Bounding box for SVG view
 */
export interface DimensionsSvg {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Cell projection result (2D coordinates)
 */
export interface ProjectedCell {
	cell: PanelCell;
	x: number;
	y: number;
	visible?: boolean; // For hidden lines
	depthValue?: number; // For side view depth annotation
}
