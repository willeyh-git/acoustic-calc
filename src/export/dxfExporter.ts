import type { PanelGeometry, PanelCell } from "@/core/types/types";
import type { DxfExportOptions, DxfLayer } from "./types";

/**
 * DXF Exporter - Generates AutoCAD-compatible DXF files from panel geometry
 */
export class DxfExporter {
	private options: DxfExportOptions;

	constructor(options: Partial<DxfExportOptions> = {}) {
		this.options = {
			layers: [
				{ name: "CUT", color: 1, linetype: "CONTINUOUS", linewidth: 0.5 },
				{ name: "FOLD", color: 2, linetype: "DASHED", linewidth: 0.3 },
				{ name: "DIMENSION", color: 3, linetype: "DOT", linewidth: 0.2 },
				{ name: "LABEL", color: 4, linetype: "CONTINUOUS", linewidth: 0.15 },
			],
			units: "MM",
			includeMetadata: true,
			...options,
		};
	}

	/**
	 * Export panel geometry to DXF string
	 */
	export(geometry: PanelGeometry): string {
		const sections = [];

		// Add header section
		sections.push(this.getHeader());

		// Add entities section
		sections.push(this.getEntitiesSection(geometry));

		// Add ends of entities section (empty for DXF R2)
		sections.push(this.getEndsOfEntitiesSection());

		return sections.join("\n");
	}

	/**
	 * Get DXF header content
	 */
	private getHeader(): string {
		const layers = this.options.layers.map((l) => l.name).join(", ");
		const units = this.options.units;

		return `SECTION\nHEADER\n$VERSION\nAC1027\n$INSUNITS\n1\n$EXTMIN\n-1000.0000,-1000.0000,0.0000\n$EXTMAX\n1000.0000,1000.0000,1000.0000\n$LAYERS\n${layers}\nENDSEC\n`;
	}

	/**
	 * Get entities section with all geometry
	 */
	private getEntitiesSection(geometry: PanelGeometry): string {
		const cells = geometry.cells;
		let content = "SECTION\nENTITIES\n";

		// Add layer definitions as LAYER entities
		this.options.layers.forEach((layer, index) => {
			content += `LAYER\n0,LAYER\n7,*${layer.name}\n62,$${layer.color}\n69,F\n53\n`;
		});

		// Add cut lines (rectangles as 4 LINE entities)
		cells.forEach((cell, cellIndex) => {
			const x = cell.x;
			const y = cell.y;
			const width = cell.width || 0;
			const height = cell.height || 0;

			// Add cut rectangle (4 lines forming the perimeter)
			content += `LAYER\n0,*CUT\n`;

			// Bottom-left to bottom-right
			content += `LINE\n8,*CUT\n-1\n0.0000,0.0000\n2\n${width},0.0000\n`;

			// Bottom-right to top-right
			content += `LINE\n8,*CUT\n-1\n${width},0.0000\n2\n0.0000,${height}\n`;

			// Top-right to top-left
			content += `LINE\n8,*CUT\n-1\n${width},${height}\n2\n-${width},0.0000\n`;

			// Top-left to bottom-left
			content += `LINE\n8,*CUT\n-1\n0.0000,${height}\n2\n0.0000,-${height}\n`;

			// Add fold lines (internal walls) if present
			const wallThickness = 3; // Default

			if (cell.wallLeft || cell.wallRight || cell.wallTop || cell.wallBottom) {
				content += `LAYER\n0,*FOLD\n`;

				if (cell.wallLeft) {
					content += `LINE\n8,*FOLD\n-1\n${x},0.0000\n2\n0.0000,${height}\n`;
				}

				if (cell.wallRight) {
					content += `LINE\n8,*FOLD\n-1\n${x + width},0.0000\n2\n0.0000,${height}\n`;
				}

				if (cell.wallTop) {
					content += `LINE\n8,*FOLD\n-1\n${x},0.0000\n2\n${width},0.0000\n`;
				}

				if (cell.wallBottom) {
					content += `LINE\n8,*FOLD\n-1\n${x},0.0000\n2\n${width},0.0000\n`;
				}
			}

			// Add cell index label as TEXT entity
			const centerX = x + width / 2;
			const centerY = y + height / 2;

			content += `LAYER\n0,*LABEL\n`;
			content += `TEXT\n8,*LABEL\n-1\n${centerX}\n2\n${centerY}\n3\n${cellIndex + 1}\n40\n${this.options.layers[3].linewidth}\n`;

			// Add dimension lines for overall panel
			if (cellIndex === cells.length - 1) {
				const minX = Math.min(...cells.map((c) => c.x));
				const minY = Math.min(...cells.map((c) => c.y));
				const maxX = Math.max(...cells.map((c) => c.x + (c.width || 0)));
				const maxY = Math.max(...cells.map((c) => c.y + (c.height || 0)));

				// Width dimension line
				content += `LAYER\n0,*DIMENSION\n`;
				content += `LINE\n8,*DIMENSION\n-1\n${minX},-${height}\n2\n${maxX - minX},0.0000\n`;

				// Height dimension line (vertical)
				content += `LINE\n8,*DIMENSION\n-1\n${minY},${maxY - minY}\n2\n0.0000,0.0000\n`;

				// Dimension text for width
				const midX = (minX + maxX) / 2;
				content += `TEXT\n8,*DIMENSION\n-1\n${midX}\n2\n-${height - 5}\n3\n${maxX - minX} ${units}\n40\n${this.options.layers[2].linewidth}\n`;

				// Dimension text for height
				const midY = (minY + maxY) / 2;
				content += `TEXT\n8,*DIMENSION\n-1\n${midX}\n2\n${maxY - minY + 5}\n3\n${maxY - minY} ${units}\n40\n${this.options.layers[2].linewidth}\n`;
			}
		});

		return content + "ENDSEC\n";
	}

	/**
	 * Get ends of entities section (empty for DXF R2)
	 */
	private getEndsOfEntitiesSection(): string {
		return "SECTION\nENDS\nEOF\n";
	}

	/**
	 * Export with custom layer configuration
	 */
	exportWithLayers(geometry: PanelGeometry, customLayers?: DxfLayer[]): string {
		const originalLayers = this.options.layers;

		// Merge or replace layers
		if (customLayers) {
			this.options.layers = [...this.options.layers, ...customLayers];
		}

		try {
			return this.export(geometry);
		} finally {
			// Restore original options
			this.options.layers = originalLayers;
		}
	}

	/**
	 * Export with metadata embedded in header
	 */
	exportWithMetadata(
		geometry: PanelGeometry,
		metadata?: Record<string, unknown>,
	): string {
		const sections = [];

		// Add header with custom metadata
		let headerContent = this.getHeader();

		if (metadata) {
			Object.entries(metadata).forEach(([key, value]) => {
				headerContent += `$ACADMAINTFLAGS\n1\n`;
				headerContent += `$EXTNAME\n*Acoustic Panel DXF Export*\n`;
				headerContent += `$ACADVER\nAC1027\n`;
			});
		}

		sections.push(headerContent);

		// Add entities section
		sections.push(this.getEntitiesSection(geometry));

		return sections.join("\n");
	}

	/**
	 * Get layer configuration for current export
	 */
	getLayerConfig(): DxfLayer[] {
		return this.options.layers;
	}

	/**
	 * Convert SVG path data to DXF entities (for complex geometries)
	 */
	convertSvgPathToDxf(pathData: string): string {
		// This is a simplified converter - for production use, consider using a proper library
		let content = "SECTION\nENTITIES\n";

		// Parse simple path commands
		const commands = pathData.match(/M\s+([\d.]+)\s+([\d.]+)/g) || [];

		commands.forEach((cmd, index) => {
			const match = cmd.match(/M\s+([\d.]+)\s+([\d.]+)/);
			if (match) {
				content += `LINE\n8,*PATH\n-1\n${match[1]}\n2\n${match[2]}\n`;
			}
		});

		return content + "ENDSEC\n";
	}

	/**
	 * Validate DXF output
	 */
	validateDxf(dxfContent: string): { valid: boolean; errors: string[] } {
		const errors: string[] = [];

		// Check for required sections
		if (!dxfContent.includes("SECTION")) {
			errors.push("Missing SECTION keyword");
		}

		if (!dxfContent.includes("HEADER")) {
			errors.push("Missing HEADER section");
		}

		if (!dxfContent.includes("ENDSEC")) {
			errors.push("Missing ENDSEC keywords");
		}

		if (!dxfContent.includes("EOF")) {
			errors.push("Missing EOF marker");
		}

		return { valid: errors.length === 0, errors };
	}
}
