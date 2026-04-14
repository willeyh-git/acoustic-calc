/**
 * SVG Export utilities for generating downloadable SVG files
 */

import type { PanelGeometry } from "@/core/types/types";
import type { SvgViewData, SvgLayer, SvgElement } from "@/core/types/svg";
import { svgElementsToString } from "./svgRenderer";

/**
 * Options for SVG export
 */
export interface SvgExportOptions {
	includeLayers?: (SvgLayer | "all")[]; // Which layers to include
	scale?: number; // Scale factor for export
	dpi?: number; // DPI for resolution metadata
	addMetadata?: boolean; // Add XML metadata
	filenamePrefix?: string; // Prefix for filename
	unit?: "mm" | "inch"; // Unit system
}

/**
 * Export a single SVG view to a string
 */
export function exportSvgView(
	viewData: SvgViewData,
	options: SvgExportOptions = {},
): string {
	const {
		includeLayers = ["all"],
		scale = 1,
		dpi = 96,
		addMetadata = true,
		filenamePrefix = "acoustic-panel",
		unit = "mm",
	} = options;

	// Flatten all layers based on includeLayers setting
	const elements: SvgElement[] = [];

	if (includeLayers.includes("all") || includeLayers.includes("cut")) {
		elements.push(...viewData.layers.cut);
	}
	if (includeLayers.includes("all") || includeLayers.includes("fold")) {
		elements.push(...viewData.layers.fold);
	}
	if (includeLayers.includes("all") || includeLayers.includes("dimension")) {
		elements.push(...viewData.layers.dimension);
	}
	if (includeLayers.includes("all") || includeLayers.includes("label")) {
		elements.push(...viewData.layers.label);
	}
	if (includeLayers.includes("all") || includeLayers.includes("hidden")) {
		elements.push(...viewData.layers.hidden);
	}

	// Calculate viewBox with scale
	const viewBox = calculateSvgViewBox(viewData, scale);

	// Generate SVG string
	let svgContent = svgElementsToString(elements, viewBox);

	// Add metadata if requested
	if (addMetadata) {
		svgContent = addSvgMetadata(svgContent, filenamePrefix, unit, dpi);
	}

	return svgContent;
}

/**
 * Export multiple views to separate SVG strings
 */
export function exportMultipleViews(
	views: SvgViewData[],
	options: SvgExportOptions = {},
): Record<string, string> {
	const exports: Record<string, string> = {};

	for (const view of views) {
		const svgString = exportSvgView(view, options);
		exports[view.viewType] = svgString;
	}

	return exports;
}

/**
 * Export panel geometry with all available views
 */
export function exportPanelGeometry(
	geometry: PanelGeometry,
	params: Record<string, unknown>,
	options: SvgExportOptions = {},
): { viewType: string; content: string }[] {
	const { generateAllViews } = await import("./svgViewFactory");

	const allViews = generateAllViews(geometry, params as any);
	return allViews.map((view) => ({
		viewType: view.name,
		content: exportSvgView(view.viewData, options),
	}));
}

/**
 * Calculate SVG viewBox from view data and scale
 */
function calculateSvgViewBox(
	viewData: SvgViewData,
	scale: number = 1,
): [number, number, number, number] {
	const padding = 20 * scale;
	const minX = (viewData.boundingBox.x - padding) * scale;
	const minY = (viewData.boundingBox.y - padding) * scale;
	const width = (viewData.boundingBox.width + 2 * padding) * scale;
	const height = (viewData.boundingBox.height + 2 * padding) * scale;

	return [minX, minY, width, height];
}

/**
 * Add XML metadata to SVG for export
 */
function addSvgMetadata(
	svgContent: string,
	filenamePrefix: string,
	unit: "mm" | "inch",
	dpi: number,
): string {
	const timestamp = new Date().toISOString();
	const unitLabel = unit === "mm" ? "millimeters" : "inches";

	const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Acoustic Panel SVG Export -->
<svg:svg xmlns:svg="http://www.w3.org/2000/svg" 
         xmlns:xlink="http://www.w3.org/1999/xlink"
         version="1.1">
  <svg:defs>
    <svg:title>${filenamePrefix} - ${unitLabel}</svg:title>
    <svg:desc>Acoustic panel visualization exported on ${timestamp}</svg:desc>
    <svg:metadata>
      <svg:property name="unit" value="${unit}" />
      <svg:property name="dpi" value="${dpi}" />
      <svg:property name="export-time" value="${timestamp}" />
    </svg:metadata>
  </svg:defs>
${svgContent}
</svg:svg>`;

	return metadata;
}

/**
 * Export SVG with layer separation (useful for manufacturing)
 */
export function exportLayeredSvg(
	viewData: SvgViewData,
	options: SvgExportOptions = {},
): Record<SvgLayer | "all", string> {
	const exports: Record<string, string> = {};

	// Export each layer separately
	for (const layer of ["cut", "fold", "dimension", "label", "hidden"]) {
		if (!viewData.layers[layer] || viewData.layers[layer].length === 0) continue;

		const elements = viewData.layers[layer];
		const viewBox = calculateSvgViewBox(viewData, options.scale || 1);
		
		let layerContent = svgElementsToString(elements, viewBox);
		
		if (options.addMetadata) {
			layerContent = addSvgMetadata(layerContent, "layer", options.unit || "mm", options.dpi || 96);
		}

		exports[layer] = layerContent;
	}

	// Export all layers combined
	const allElements: SvgElement[] = [];
	for (const [layer, elements] of Object.entries(viewData.layers)) {
		if (elements && elements.length > 0) {
			allElements.push(...elements);
		}
	}

	exports["all"] = svgElementsToString(allElements, calculateSvgViewBox(viewData, options.scale || 1));

	return exports;
}

/**
 * Validate SVG export output
 */
export function validateSvgExport(svgContent: string): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// Check for required XML declaration
	if (!svgContent.includes("<?xml")) {
		errors.push("Missing XML declaration");
	}

	// Check for SVG opening tag
	if (!svgContent.match(/<svg[^>]+>/)) {
		errors.push("Missing SVG opening tag");
	}

	// Check for closing SVG tag
	if (!svgContent.includes("</svg>")) {
		errors.push("Missing SVG closing tag");
	}

	// Check for balanced tags (simplified check)
	const openTags = (svgContent.match(/<[^\/][^>]+>/g) || []).length;
	const closeTags = (svgContent.match(/<\/[^>]+>/g) || []).length;

	if (openTags !== closeTags) {
		errors.push(`Unbalanced tags: ${openTags} open, ${closeTags} close`);
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Generate filename for SVG export
 */
export function generateSvgFilename(
	params: Record<string, unknown>,
	viewType?: string,
	prefix?: string,
): string {
	const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	
	let name = prefix || "acoustic-panel";
	
	// Add panel type
	if (params.type) {
		name += `-${(params.type as string).toLowerCase()}`;
	}

	// Add view type if specified
	if (viewType) {
		name += `-${viewType.toLowerCase()}`;
	}

	// Add date
	name += `-${date}`;

	return `${name}.svg`;
}
