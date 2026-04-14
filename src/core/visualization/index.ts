/**
 * SVG Visualization Module - Main Entry Point
 *
 * This module provides 2D SVG-based visualization for acoustic panels.
 * It includes projection functions, view factories, and export utilities.
 */

// Type definitions
export type {
	SvgViewType,
	ProjectionConfig,
	SvgElement,
	SvgLayer,
	SvgRectangle,
	SvgPath,
	SvgLine,
	SvgText,
	SvgDimension,
	SvgGroup,
	SvgOrigin,
	DimensionsSvg,
	ProjectedCell,
} from "./types/svg";

// Core rendering engine
export {
	createSvgView,
	svgElementsToString,
	svgElementToString,
} from "./visualization/svgRenderer";

// Projection functions
export {
	projectCellsToSvg,
	generateWallRectangles,
	generateBackingRectangles,
	generateDimensionAnnotations,
	generateDepthAnnotations,
} from "./visualization/projection";

// SVG export utilities
export {
	exportSvgView,
	exportMultipleViews,
	exportPanelGeometry,
	exportLayeredSvg,
	validateSvgExport,
	generateSvgFilename,
	SvgExportOptions,
} from "./visualization/svgExport";

// View factory functions
export {
	createSideView,
	createFrontView,
	createTopView,
	createCrossSectionView,
	createPatternView,
	getViewCreator,
	generateAllViews,
	getAvailableViewTypesForPanel,
	getDefaultViewType,
} from "./factories/svgViewFactory";

// Utility functions
export {
	convertToSvgUnits,
	formatDimension,
	calculateSvgViewBox,
	generateRoundedRectPath,
	generateArrowPath,
	generateDimensionPath,
	generateCirclePath,
	generateEllipsePath,
	escapeSvgText,
	generateColorFromText,
	generateDepthPalette,
	calculateResponsiveSize,
} from "./visualization/utils";

// Default configurations
export { DEFAULT_STYLES } from "./visualization/svgRenderer";
