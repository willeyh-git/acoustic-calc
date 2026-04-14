/**
 * Utility functions for SVG visualization
 */

import type { Unit } from "@/core/types/types";

/**
 * Convert units to SVG coordinate system (assumes mm as base)
 */
export function convertToSvgUnits(value: number, unit: Unit): number {
	switch (unit) {
		case "cm":
			return value * 10; // 1 cm = 10 mm
		case "inch":
			return value * 25.4; // 1 inch = 25.4 mm
		default:
			return value; // Already in mm
	}
}

/**
 * Format dimension value with units
 */
export function formatDimension(value: number, unit: Unit): string {
	const formattedValue = value.toFixed(2);

	// Remove trailing zeros after decimal point
	if (formattedValue.includes(".")) {
		formattedValue = formattedValue.replace(/\.?0+$/, "");
	}

	return `${formattedValue} ${unit}`;
}

/**
 * Calculate SVG viewBox from bounding box and scale
 */
export function calculateSvgViewBox(
	boundingBox: { x: number; y: number; width: number; height: number },
	scale: number = 1,
	padding: number = 20,
): [number, number, number, number] {
	const minX = (boundingBox.x - padding) * scale;
	const minY = (boundingBox.y - padding) * scale;
	const width = (boundingBox.width + 2 * padding) * scale;
	const height = (boundingBox.height + 2 * padding) * scale;

	return [minX, minY, width, height];
}

/**
 * Generate SVG path data for a rectangle with rounded corners
 */
export function generateRoundedRectPath(
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number = 5,
): string {
	const halfRadius = radius / 2;

	return `M ${x + halfRadius} ${y} 
		L ${x + width - halfRadius} ${y} 
		A ${halfRadius} ${halfRadius} 0 1 1 ${x + width} ${y + halfRadius} 
		L ${x + width} ${y + height - halfRadius} 
		A ${halfRadius} ${halfRadius} 0 1 1 ${x + width - halfRadius} ${y + height} 
		L ${x + halfRadius} ${y + height} 
		A ${halfRadius} ${halfRadius} 0 1 1 ${x} ${y + height - halfRadius} 
		L ${x} ${y + halfRadius} 
		A ${halfRadius} ${halfRadius} 0 1 1 ${x + halfRadius} ${y}
		Z`;
}

/**
 * Generate SVG path data for an arrow
 */
export function generateArrowPath(
	x: number,
	y: number,
	length: number,
	width: number = 6,
): string {
	const headLength = width * 1.5;

	return `M ${x} ${y - width / 2} 
		L ${x + length} ${y} 
		L ${x} ${y + width / 2} 
		Z`;
}

/**
 * Generate SVG path data for a dimension line with arrows
 */
export function generateDimensionPath(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): string {
	const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
	const angle = Math.atan2(y2 - y1, x2 - x1);

	// Arrow head dimensions
	const arrowWidth = 6;
	const arrowLength = length * 0.15; // 15% of line length

	return `M ${x1} ${y1} 
		L ${x2} ${y2} 
		M ${x2 - arrowLength * Math.cos(angle) - arrowWidth / 2} 
			${y2 - arrowLength * Math.sin(angle) - arrowWidth / 2}
		A ${arrowWidth / 2} ${arrowWidth / 2} 0 0 1 
			${x2 - arrowLength * Math.cos(angle) + arrowWidth / 2} 
			${y2 - arrowLength * Math.sin(angle) + arrowWidth / 2}
		Z`;
}

/**
 * Generate SVG path data for a circle
 */
export function generateCirclePath(
	cx: number,
	cy: number,
	radius: number,
): string {
	return `M ${cx} ${cy - radius} 
		A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} 
		A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius}`;
}

/**
 * Generate SVG path data for an ellipse
 */
export function generateEllipsePath(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): string {
	return `M ${cx + rx} ${cy} 
		A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy} 
		A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy}`;
}

/**
 * Escape special characters in SVG text
 */
export function escapeSvgText(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Generate color from string (simple hash function)
 */
export function generateColorFromText(text: string): string {
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}

	const color = `#${((1 << 24) + (hash & ((1 << 24) - 1))).toString(16).padStart(6, "0")}`;
	return color;
}

/**
 * Generate a palette of colors for different depths/levels
 */
export function generateDepthPalette(
	maxDepth: number,
	numColors: number = 5,
): Record<number, string> {
	const palette: Record<number, string> = {};

	// Define color stops from light to dark
	const colorStops = [
		{ depthRatio: 0, color: "#E5E7EB" }, // Lightest (0%)
		{ depthRatio: 0.25, color: "#D1D5DB" },
		{ depthRatio: 0.5, color: "#9CA3AF" },
		{ depthRatio: 0.75, color: "#6B7280" },
		{ depthRatio: 1, color: "#374151" }, // Darkest (100%)
	];

	for (let i = 0; i < numColors; i++) {
		const ratio = i / (numColors - 1);
		const stop =
			colorStops.find((s) => s.depthRatio >= ratio) ||
			colorStops[colorStops.length - 1];
		palette[i] = stop.color;
	}

	return palette;
}

/**
 * Calculate aspect ratio for responsive SVG sizing
 */
export function calculateResponsiveSize(
	contentWidth: number,
	contentHeight: number,
	maxWidth: number,
	maxHeight: number,
): { width: number; height: number; scale: number } {
	let width = contentWidth;
	let height = contentHeight;
	let scale = 1;

	// Check if width exceeds max
	if (width > maxWidth) {
		scale = maxWidth / width;
		width = maxWidth;
		height = contentHeight * scale;
	}

	// Check if height exceeds max after width adjustment
	if (height > maxHeight) {
		scale = maxHeight / height;
		height = maxHeight;
		width = contentWidth * scale;
	}

	return { width, height, scale };
}
