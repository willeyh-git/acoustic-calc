import type { PanelGeometry, PanelParams } from "@/core/types/panelTypes";
import type {
	SvgViewType,
	ProjectionConfig,
	SvgViewData,
} from "@/core/types/svg";

/**
 * Factory function to create appropriate SVG view based on panel type
 */
export function createSvgViewForPanel(
	geometry: PanelGeometry,
	params: PanelParams,
	viewType?: SvgViewType,
): { svgData: SvgViewData; viewName: string }[] {
	const views = [];

	// Determine default view type based on panel type
	let defaultView: SvgViewType;
	switch (params.type) {
		case "qrd":
			defaultView = "side"; // QRD is best shown from side
			break;
		case "skyline":
			defaultView = "top"; // Skyline shows 2D grid better from top
			break;
		case "abfusor":
			defaultView = "front"; // Abfusor pattern visible from front
			break;
		case "absorber":
			if (params.absorberType === "helmholtz") {
				defaultView = "side"; // Show resonator depth
			} else {
				defaultView = "front"; // Porous absorber is flat
			}
			break;
		default:
			defaultView = "side";
	}

	const requestedView = viewType || defaultView;

	// Create primary view
	views.push({
		svgData: createSvgView(geometry, requestedView),
		viewName: `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} ${requestedView} View`,
	});

	// Create additional views for certain panel types
	if (params.type === "qrd" || params.type === "skyline") {
		views.push({
			svgData: createSvgView(geometry, "front", { showDimensions: true }),
			viewName: `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Front View`,
		});
	}

	if (params.type === "skyline") {
		views.push({
			svgData: createSvgView(geometry, "top", { showDimensions: true }),
			viewName: `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Top View`,
		});
	}

	if (params.type === "absorber" && params.absorberType === "helmholtz") {
		views.push({
			svgData: createSvgView(geometry, "side", { showDimensions: true }),
			viewName: `${params.type.charAt(0).toUpperCase() + params.type.slice(1)} Cross-Section`,
		});
	}

	return views;
}

/**
 * Get recommended view type for a panel configuration
 */
export function getRecommendedViewType(params: PanelParams): SvgViewType {
	switch (params.type) {
		case "qrd":
			return "side";
		case "skyline":
			return "top";
		case "abfusor":
			return "front";
		case "absorber":
			if (params.absorberType === "helmholtz") return "side";
			return "front";
		default:
			return "side";
	}
}

/**
 * Get all available view types for a panel type
 */
export function getAvailableViewTypes(params: PanelParams): SvgViewType[] {
	const types: SvgViewType[] = [];

	switch (params.type) {
		case "qrd":
			types.push("side", "front");
			break;
		case "skyline":
			types.push("top", "side", "front");
			break;
		case "abfusor":
			types.push("front");
			break;
		case "absorber":
			if (params.absorberType === "helmholtz") {
				types.push("side", "front");
			} else {
				types.push("front");
			}
			break;
		default:
			types.push("side");
	}

	return types;
}
