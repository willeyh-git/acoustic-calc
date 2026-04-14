import type { PanelCell, PanelGeometry } from "@/core/types/types";
import type { CellMeshData, MeshMaterialProps } from "@/core/types/three";

/**
 * Convert a panel cell to Three.js mesh data
 */
export function cellToMesh(
	cell: PanelCell,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData {
	const { width, height, x, y } = cell;

	// Calculate actual dimensions accounting for wall thickness
	const innerWidth = Math.max(0, width - wallThickness);
	const innerHeight = Math.max(0, height - wallThickness);

	return {
		cellIndex: -1, // Will be set by caller
		position: [x + wallThickness / 2, y + backingThickness, 0],
		dimensions: [innerWidth, innerHeight, backingThickness],
		materialProps: materialProps || {},
		wallThickness,
		backingThickness,
	};
}

/**
 * Generate mesh data for a complete panel geometry
 */
export function generatePanelMeshes(
	geometry: PanelGeometry,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	return geometry.cells.map((cell, index) => ({
		...cellToMesh(cell, wallThickness, backingThickness, materialProps),
		cellIndex: index,
	}));
}

/**
 * Generate QRD well mesh with flap geometry
 * This creates a more complex mesh that includes the diffusing flap
 */
export function generateQRDWellMesh(
	cell: PanelCell,
	wellWidth: number,
	maxDepth: number,
	wallThickness: number = 3,
	flapThickness: number = 2,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	const wellsPerCell = Math.floor(cell.width / wellWidth);
	const meshes: CellMeshData[] = [];

	for (let i = 0; i < wellsPerCell; i++) {
		const wellX = cell.x + i * wellWidth;
		const wellY = cell.y;

		// Well dimensions
		const innerWellWidth = Math.max(0, wellWidth - wallThickness);
		const depth = Math.min(maxDepth, 50); // Default max depth in mm

		meshes.push({
			cellIndex: -1,
			position: [wellX + wallThickness / 2, wellY + backingThickness, 0],
			dimensions: [innerWellWidth, depth, backingThickness],
			materialProps: materialProps || {},
			wallThickness,
			backingThickness,
		});

		// Flap geometry (simplified - actual QRD flaps are more complex)
		if (flapThickness > 0) {
			meshes.push({
				cellIndex: -1,
				position: [
					wellX + innerWellWidth / 2,
					wellY + depth - flapThickness / 2,
					0,
				],
				dimensions: [innerWellWidth, flapThickness, backingThickness],
				materialProps: materialProps || {},
				wallThickness,
				backingThickness,
			});
		}
	}

	return meshes;
}

/**
 * Generate Skyline well mesh (simplified version)
 */
export function generateSkylineWellMesh(
	cell: PanelCell,
	wellWidth: number,
	maxDepth: number,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	const wellsPerCell = Math.floor(cell.width / wellWidth);
	const meshes: CellMeshData[] = [];

	for (let i = 0; i < wellsPerCell; i++) {
		const wellX = cell.x + i * wellWidth;
		const wellY = cell.y;

		// Skyline wells have varying depths based on sequence
		const depth = Math.min(maxDepth, 40); // Default max depth in mm

		meshes.push({
			cellIndex: -1,
			position: [wellX + wallThickness / 2, wellY + backingThickness, 0],
			dimensions: [wellWidth - wallThickness, depth, backingThickness],
			materialProps: materialProps || {},
			wallThickness,
			backingThickness,
		});
	}

	return meshes;
}

/**
 * Generate Abfusor well mesh (binary amplitude diffuser)
 */
export function generateAbfusorWellMesh(
	cell: PanelCell,
	depthA: number,
	depthB: number,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	// Abfusor uses alternating depths A and B
	const wellWidth = Math.min(cell.width - wallThickness * 2, 50);
	const meshes: CellMeshData[] = [];

	for (let i = 0; i < cell.width / wellWidth; i++) {
		const wellX = cell.x + i * wellWidth + wallThickness;

		// Alternate between depth A and B
		const depth = i % 2 === 0 ? depthA : depthB;

		meshes.push({
			cellIndex: -1,
			position: [wellX, cell.y + backingThickness, 0],
			dimensions: [wellWidth, depth, backingThickness],
			materialProps: materialProps || {},
			wallThickness,
			backingThickness,
		});
	}

	return meshes;
}

/**
 * Generate Porous Absorber mesh (simple flat panel)
 */
export function generatePorousAbsorberMesh(
	cell: PanelCell,
	cavityDepth: number = 50,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	return [
		{
			cellIndex: -1,
			position: [cell.x + wallThickness / 2, cell.y + backingThickness, 0],
			dimensions: [
				cell.width - wallThickness * 2,
				cavityDepth,
				backingThickness,
			],
			materialProps: materialProps || {},
			wallThickness,
			backingThickness,
		},
	];
}

/**
 * Generate Helmholtz Absorber mesh (resonator)
 */
export function generateHelmholtzAbsorberMesh(
	cell: PanelCell,
	cavityDepth: number = 50,
	holeDiameter: number = 10,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): CellMeshData[] {
	const meshes: CellMeshData[] = [];

	// Cavity
	meshes.push({
		cellIndex: -1,
		position: [cell.x + wallThickness / 2, cell.y + backingThickness, 0],
		dimensions: [cell.width - wallThickness * 2, cavityDepth, backingThickness],
		materialProps: materialProps || {},
		wallThickness,
		backingThickness,
	});

	// Neck (hole)
	const neckRadius = holeDiameter / 2;
	meshes.push({
		cellIndex: -1,
		position: [cell.x + cell.width / 2, cell.y + cavityDepth + neckRadius, 0],
		dimensions: [neckRadius * 2, neckRadius * 2, backingThickness],
		materialProps: materialProps || {},
		wallThickness,
		backingThickness,
	});

	return meshes;
}

/**
 * Apply view mode to mesh data
 */
export function applyViewMode(
	meshData: CellMeshData[],
	viewMode: "solid" | "transparent" | "wireframe" | "exploded" = "solid",
): CellMeshData[] {
	if (viewMode === "solid") {
		return meshData.map((m) => ({
			...m,
			materialProps: { ...m.materialProps, transparent: false },
		}));
	} else if (viewMode === "transparent") {
		return meshData.map((m) => ({
			...m,
			materialProps: {
				...m.materialProps,
				transparent: true,
				opacity: 0.5,
			},
		}));
	} else if (viewMode === "wireframe") {
		return meshData.map((m) => ({
			...m,
			materialProps: {
				...m.materialProps,
				wireframe: true,
			},
		}));
	} else if (viewMode === "exploded") {
		// Exploded view: separate components with spacing and highlighting
		return meshData.map((m, i) => ({
			...m,
			materialProps: {
				...m.materialProps,
				transparent: true,
				opacity: 0.7,
				color: m.cellIndex !== -1 ? "#3b82f6" : undefined, // Highlight exploded cells
			},
			// Add offset based on index for visual separation
			position: [
				m.position[0] + (i % 3) * 5,
				m.position[1] + Math.floor(i / 3) * 5,
				m.position[2] + 2,
			],
		}));
	}

	return meshData;
}

/**
 * Generate exploded view meshes (separate wells from backing)
 */
export function generateExplodedViewMeshes(
	geometry: PanelGeometry,
	wallThickness: number = 3,
	backingThickness: number = 20,
	separationDistance: number = 15,
): CellMeshData[] {
	const meshes: CellMeshData[] = [];

	geometry.cells.forEach((cell, cellIndex) => {
		// Wells (front component)
		const wellMeshes = generatePanelMeshes(cell, wallThickness, 0);

		wellMeshes.forEach((wellData, i) => {
			meshes.push({
				...wellData,
				cellIndex: cellIndex * 2 + i,
				materialProps: {
					...wellData.materialProps,
					color: "#3b82f6", // Blue for wells
					transparent: true,
					opacity: 0.9,
				},
			});
		});

		// Backing (back component) - offset by separation distance
		const backingMeshes = generatePanelMeshes(
			cell,
			wallThickness,
			backingThickness,
		);

		backingMeshes.forEach((backingData, i) => {
			meshes.push({
				...backingData,
				cellIndex: cellIndex * 2 + i + 100, // Different index range for backing
				materialProps: {
					...backingData.materialProps,
					color: "#9ca3af", // Gray for backing
					transparent: true,
					opacity: 0.8,
				},
			});
		});
	});

	return meshes;
}
