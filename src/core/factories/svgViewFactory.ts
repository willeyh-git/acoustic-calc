/**
 * Consolidated SVG View Factory
 *
 * This module provides a unified factory for creating all types of SVG views
 * for acoustic panel visualizations. It combines functionality from both
 * createSvgView and svgViewFactory into a single, maintainable solution.
 */

import type { PanelGeometry, PanelParams } from "@/core/types/panelTypes";
import type {
	SvgViewType,
	ProjectionConfig,
	SvgViewData,
} from "@/core/types/svg";
import { createSvgView } from "../visualization/svgRenderer";

/**
 * Create SVG view with default configuration based on panel type and requested view
 */
export function createSvgViewForPanel(
	geometry: PanelGeometry,
	params: PanelParams,
	viewType?: SvgViewType,
): SvgViewData {
	const config = getDefaultConfig(params, viewType);
	return createSvgView(
		geometry,
		viewType || getRecommendedViewType(params),
		config,
	);
}

/**
 * Get default configuration for SVG view based on panel type and requested view
 */
function getDefaultConfig(
	params: PanelParams,
	viewType?: SvgViewType,
): Partial<ProjectionConfig> {
	const baseConfig = {
		panelType: params.type,
		unit: params.unit || "mm",
		scale: 1,
		showDimensions: true,
		showLabels: false,
		orientation: "horizontal",
	};

	const viewSpecificConfig = getViewSpecificConfig(params.type, viewType);

	return { ...baseConfig, ...viewSpecificConfig };
}

/**
 * Get view-specific configuration based on panel type and requested view
 */
function getViewSpecificConfig(
	panelType: string,
	viewType?: SvgViewType,
): Partial<ProjectionConfig> {
	switch (panelType) {
		case "qrd":
			return viewType === "side"
				? { viewType: "side", orientation: "horizontal" }
				: { viewType: "front", orientation: "vertical" };

		case "skyline":
			if (viewType === "top")
				return { viewType: "top", orientation: "horizontal" };
			if (viewType === "side")
				return { viewType: "side", orientation: "horizontal" };
			return { viewType: "front", orientation: "vertical" };

		case "abfusor":
			return { viewType: "front", orientation: "horizontal" };

		case "absorber":
			if (params?.absorberType === "helmholtz")
				return { viewType: "side", orientation: "horizontal" };
			return { viewType: "front", orientation: "vertical" };

		default:
			return { viewType: "side", orientation: "horizontal" };
	}
}

/**
 * Get recommended default view type for a panel based on its characteristics
 */
export function getRecommendedViewType(params: PanelParams): SvgViewType {
	switch (params.type) {
		case "qrd":
			return "side"; // QRD depth profile best shown from side
		case "skyline":
			return "top"; // Skyline 2D grid better from top view
		case "abfusor":
			return "front"; // Abfusor pattern visible from front
		case "absorber":
			if (params.absorberType === "helmholtz") return "side"; // Show resonator depth
			return "front"; // Porous absorber is flat
		default:
			return "side";
	}
}

/**
 * Get all available view types for a specific panel type
 */
export function getAvailableViewTypes(params: PanelParams): SvgViewType[] {
	switch (params.type) {
		case "qrd":
			return ["side", "front"];
		case "skyline":
			return ["top", "side", "front"];
		case "abfusor":
			return ["front"];
		case "absorber":
			if (params.absorberType === "helmholtz") return ["side", "front"];
			return ["front"];
		default:
			return ["side"];
	}
}

/**
 * Get display name for view type selector UI
 */
export function getDisplayName(viewType: SvgViewType): string {
	const names = {
		side: "Side View",
		front: "Front View",
		top: "Top View",
	};
	return names[viewType] || viewType;
}

/**
 * Generate all available views for a panel geometry
 */
export function generateAllViews(
	geometry: PanelGeometry,
	params: PanelParams,
): {
	viewType: SvgViewType;
	viewData: SvgViewData;
	name: string;
}[] {
	const views = [];
	const availableTypes = getAvailableViewTypes(params);

	for (const viewType of availableTypes) {
		const viewData = createSvgViewForPanel(geometry, params, viewType);

		views.push({
			viewType,
			viewData,
			name: `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} ${viewType} View`,
		});
	}

	return views;
}

/**
 * Get view creator function for specific panel type and view (legacy compatibility)
 */
export function getViewCreator(
	panelType: string,
	viewType?: SvgViewType,
): (
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
) => SvgViewData {
	return (geometry, params) =>
		createSvgViewForPanel(geometry, { type: panelType }, viewType);
}

/**
 * Create side view for QRD and Skyline panels (legacy compatibility)
 */
export function createSideView(
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
): SvgViewData {
	return createSvgViewForPanel(
		geometry,
		{ type: "qrd" },
		params?.viewType || "side",
	);
}

/**
 * Create front view for QRD and Skyline panels (legacy compatibility)
 */
export function createFrontView(
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
): SvgViewData {
	return createSvgViewForPanel(
		geometry,
		{ type: "qrd" },
		params?.viewType || "front",
	);
}

/**
 * Create top view for Skyline panels (legacy compatibility)
 */
export function createTopView(
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
): SvgViewData {
	return createSvgViewForPanel(
		geometry,
		{ type: "skyline" },
		params?.viewType || "top",
	);
}

/**
 * Create cross-section view for absorbers (legacy compatibility)
 */
export function createCrossSectionView(
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
): SvgViewData {
	return createSvgViewForPanel(
		geometry,
		{ type: "absorber" },
		params?.viewType || "side",
	);
}

/**
 * Create pattern view for Abfusor panels (legacy compatibility)
 */
export function createPatternView(
	geometry: PanelGeometry,
	params?: Partial<ProjectionConfig>,
): SvgViewData {
	return createSvgViewForPanel(
		geometry,
		{ type: "abfusor" },
		params?.viewType || "front",
	);
}
