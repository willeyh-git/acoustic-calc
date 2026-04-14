import type { PanelCell, Dimensions, CutPiece, Layout } from "../types/types";
import type { SheetMaterial } from "../types/cutList";

/**
 * Generates optimized cut lists from panel geometry
 */
export class CutListGenerator {
	/**
	 * Generate a cut list from panel cells
	 */
	generateCutList(
		cells: PanelCell[],
		materialType?: string,
		kerf = 0.5, // Default 0.5mm kerf tolerance
	): CutPiece[] {
		const pieces: Map<string, { quantity: number; label?: string }> = new Map();

		for (const cell of cells) {
			const key = this.getDimensionKey(cell.width, cell.height);

			if (!pieces.has(key)) {
				pieces.set(key, {
					quantity: 0,
					label: `${cell.x.toFixed(1)},${cell.y.toFixed(1)} - ${cell.label || "Cell"}`,
				});
			}

			const piece = pieces.get(key)!;
			piece.quantity += 1;
		}

		return Array.from(pieces.entries()).map(([key, piece], index) => ({
			width: parseFloat(key.split("x")[0]),
			height: parseFloat(key.split("x")[1]),
			quantity: piece.quantity,
			label: `${index + 1}. ${piece.label}`,
			purpose: "wall",
			materialType: materialType || undefined,
		}));
	}

	private getDimensionKey(width: number, height: number): string {
		return `${width.toFixed(2)}x${height.toFixed(2)}`;
	}

	/**
	 * Group cut pieces by dimensions for optimization
	 */
	groupByDimensions(cutPieces: CutPiece[]): Map<string, CutPiece[]> {
		const groups = new Map<string, CutPiece[]>();

		for (const piece of cutPieces) {
			const key = this.getDimensionKey(piece.width, piece.height);

			if (!groups.has(key)) {
				groups.set(key, []);
			}

			groups.get(key)!.push(piece);
		}

		return groups;
	}

	/**
	 * Calculate total material needed from cut list
	 */
	calculateTotalMaterial(
		cutList: CutPiece[],
		kerf = 0.5,
	): {
		widthRequired: number;
		heightRequired: number;
		areaM2: number;
		lengthM: number;
	} {
		let totalArea = 0;
		const maxDimension = { width: 0, height: 0 };

		for (const piece of cutList) {
			const area = piece.width * piece.height;
			totalArea += area * piece.quantity;

			maxDimension.width = Math.max(maxDimension.width, piece.width);
			maxDimension.height = Math.max(maxDimension.height, piece.height);
		}

		return {
			widthRequired: maxDimension.width + kerf,
			heightRequired: maxDimension.height + kerf,
			areaM2: totalArea / 1_000_000, // Convert mm² to m²
			lengthM: (maxDimension.width + maxDimension.height) / 1000,
		};
	}

	/**
	 * Simple nesting optimization - groups similar pieces together
	 */
	optimizeNesting(
		cutPieces: CutPiece[],
		sheetSize: Dimensions,
	): {
		sheetsNeeded: number;
		layout: Layout[];
	} {
		const grouped = this.groupByDimensions(cutPieces);
		const layouts: Layout[] = [];
		let sheetsUsed = 0;

		for (const [dimension, pieces] of grouped) {
			const width = parseFloat(dimension.split("x")[0]);
			const height = parseFloat(dimension.split("x")[1]);

			// Calculate how many sheets needed for this dimension group
			const sheetsForGroup = Math.ceil(
				pieces.reduce((sum, p) => sum + p.quantity, 0) / pieces[0].quantity,
			);

			sheetsUsed += sheetsForGroup;

			layouts.push({
				sheetSize: sheetSize,
				pieces: pieces.map((p) => ({
					...p,
					quantity: p.quantity * sheetsForGroup,
				})),
				wastePercentage: this.calculateWaste(
					width,
					height,
					sheetSize.width,
					sheetSize.height,
				),
			});
		}

		return {
			sheetsNeeded: sheetsUsed,
			layout: layouts,
		};
	}

	private calculateWaste(
		pieceWidth: number,
		pieceHeight: number,
		sheetWidth: number,
		sheetHeight: number,
	): number {
		const pieceArea = pieceWidth * pieceHeight;
		const sheetArea = sheetWidth * sheetHeight;

		if (pieceArea <= 0 || sheetArea <= 0) return 0;

		const utilization = pieceArea / sheetArea;
		return Math.max(0, (1 - utilization) * 100);
	}

	/**
	 * Get cut list for specific component type
	 */
	getComponentCutList(
		cutList: CutPiece[],
		purpose: "wall" | "backing" | "frame" | "well",
	): CutPiece[] {
		return cutList.filter((piece) => piece.purpose === purpose);
	}

	/**
	 * Calculate kerf-adjusted dimensions for cutting
	 */
	calculateCutDimensions(
		width: number,
		height: number,
		kerf = 0.5,
	): { width: number; height: number } {
		return {
			width: Math.max(width - kerf, 0),
			height: Math.max(height - kerf, 0),
		};
	}

	/**
	 * Generate cut list with kerf adjustments applied
	 */
	generateCutListWithKerf(
		cells: PanelCell[],
		materialType?: string,
		kerf = 0.5,
	): CutPiece[] {
		const pieces: Map<string, { quantity: number; label?: string }> = new Map();

		for (const cell of cells) {
			const cutDims = this.calculateCutDimensions(
				cell.width,
				cell.height,
				kerf,
			);
			const key = `${cutDims.width.toFixed(2)}x${cutDims.height.toFixed(2)}`;

			if (!pieces.has(key)) {
				pieces.set(key, {
					quantity: 0,
					label: `${cell.x.toFixed(1)},${cell.y.toFixed(1)} - ${cell.label || "Cell"}`,
				});
			}

			const piece = pieces.get(key)!;
			piece.quantity += 1;
		}

		return Array.from(pieces.entries()).map(([key, piece], index) => ({
			width: parseFloat(key.split("x")[0]),
			height: parseFloat(key.split("x")[1]),
			quantity: piece.quantity,
			label: `${index + 1}. ${piece.label}`,
			purpose: "wall",
			materialType: materialType || undefined,
		}));
	}
}
