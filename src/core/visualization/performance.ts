import * as THREE from "three";
import type { MeshMaterialProps } from "@/core/types/three";
import { createMeshMaterial } from "./materials";

/**
 * Configuration for performance optimizations
 */
export interface PerformanceConfig {
	useInstancedMeshes: boolean;
	lodThresholds: number[]; // Distance thresholds for LOD levels
	maxInstancesPerLevel: number;
}

/**
 * Create instanced mesh for repeated cells (best performance)
 */
export function createInstancedMeshes(
	geometry: PanelGeometry,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): THREE.InstancedMesh {
	// Count unique cell dimensions for instancing
	const cells = geometry.cells;

	if (cells.length === 0) {
		return new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), null, 0);
	}

	// Create base geometry and material
	const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
	const material = createMeshMaterial(materialProps || {});

	// Calculate number of instances
	const instanceCount = cells.length;

	// Create instanced mesh
	const instancedMesh = new THREE.InstancedMesh(
		boxGeometry,
		material,
		instanceCount,
	);

	instancedMesh.castShadow = true;
	instancedMesh.receiveShadow = true;

	// Set up matrices for each cell
	const matrix = new THREE.Matrix4();
	const vector = new THREE.Vector3();

	cells.forEach((cell, index) => {
		const innerWidth = Math.max(0.1, cell.width - wallThickness);
		const innerHeight = Math.max(0.1, cell.height - backingThickness);

		// Position at center of cell
		vector.set(cell.x + wallThickness / 2, cell.y + backingThickness / 2, 0);

		matrix.makeTranslation(vector.x, vector.y, vector.z);
		matrix.scale(innerWidth, innerHeight, backingThickness);

		instancedMesh.setMatrixAt(index, matrix);
	});

	return instancedMesh;
}

/**
 * Create individual meshes for each cell (more memory but more flexible)
 */
export function createIndividualMeshes(
	geometry: PanelGeometry,
	wallThickness: number = 3,
	backingThickness: number = 0,
	materialProps?: MeshMaterialProps,
): THREE.Mesh[] {
	const cells = geometry.cells;
	const meshes: THREE.Mesh[] = [];

	if (cells.length === 0) return meshes;

	// Create base material (geometry is created with correct dimensions for each cell)
	const material = createMeshMaterial(materialProps || {});

	cells.forEach((cell, index) => {
		const innerWidth = Math.max(0.1, cell.width - wallThickness);
		const innerHeight = Math.max(0.1, cell.height - backingThickness);

		// Clone material for each mesh (geometry is created with correct dimensions)
		const meshGeometry = new THREE.BoxGeometry(
			innerWidth,
			innerHeight,
			backingThickness,
		);
		const meshMaterial = material.clone();

		const mesh = new THREE.Mesh(meshGeometry, meshMaterial);

		// Position at center of cell
		mesh.position.set(
			cell.x + wallThickness / 2,
			cell.y + backingThickness / 2,
			0,
		);

		mesh.castShadow = true;
		mesh.receiveShadow = true;

		meshes.push(mesh);
	});

	return meshes;
}

/**
 * Implement Level of Detail (LOD) system
 */
export function createLODMeshes(
	geometry: PanelGeometry,
	wallThickness: number = 3,
	lodThresholds: number[] = [10, 50, 100],
): { meshes: THREE.Mesh[]; levels: number } {
	const cells = geometry.cells;

	if (cells.length === 0) {
		return { meshes: [], levels: 0 };
	}

	// Create LOD levels based on distance thresholds
	const lodLevels = Math.max(1, lodThresholds.length);
	const allMeshes: THREE.Mesh[] = [];

	// Level 0: High detail (individual cells)
	const highDetailMeshes = createIndividualMeshes(geometry, wallThickness);
	allMeshes.push(...highDetailMeshes);

	// Level 1+: Simplified bounding box for distant view
	if (lodLevels > 1) {
		// Create simplified mesh at medium distance
		let totalWidth = 0;
		let totalHeight = 0;

		cells.forEach((cell) => {
			totalWidth += cell.width + wallThickness;
			totalHeight += cell.height + wallThickness;
		});

		const boundingBoxMesh = new THREE.Mesh(
			new THREE.BoxGeometry(totalWidth, totalHeight, wallThickness),
			highDetailMeshes[0]?.material?.clone(),
		);

		// Position at center of panel
		const centerX =
			cells.reduce((sum, c) => sum + c.x + c.width / 2, 0) / cells.length;
		const centerY =
			cells.reduce((sum, c) => sum + c.y + c.height / 2, 0) / cells.length;

		boundingBoxMesh.position.set(centerX, centerY, 0);
		allMeshes.push(boundingBoxMesh);
	}

	return { meshes: allMeshes, levels: lodLevels };
}

/**
 * Enable/disable shadows for performance
 */
export function toggleShadows(
	mesh: THREE.Mesh | THREE.InstancedMesh,
	enabled: boolean,
): void {
	if (mesh instanceof THREE.InstancedMesh) {
		// For instanced meshes, we need to update all matrices
		const count = mesh.count;
		for (let i = 0; i < count; i++) {
			mesh.castShadow = enabled;
			mesh.receiveShadow = enabled;
		}
	} else {
		mesh.castShadow = enabled;
		mesh.receiveShadow = enabled;
	}
}

/**
 * Optimize material for performance
 */
export function optimizeMaterial(
	materialProps?: MeshMaterialProps,
): Partial<MeshMaterialProps> {
	const {
		color = "#808080",
		roughness = 0.5,
		metalness = 0.1,
		transparent = false,
		opacity = 1,
	} = materialProps || {};

	return {
		color: new THREE.Color(color),
		roughness: Math.max(0, Math.min(1, roughness)),
		metalness: Math.max(0, Math.min(1, metalness)),
		transparent,
		opacity: Math.max(0, Math.min(1, opacity)),
		// Disable expensive features for performance
		envMap: null,
		reflectivity: 0,
	};
}

/**
 * Create mesh with optimized material
 */
export function createOptimizedMesh(
	geometry: THREE.BufferGeometry | THREE.InstancedBufferAttribute,
	materialProps?: MeshMaterialProps,
): THREE.Mesh {
	const optimizedMaterial = optimizeMaterial(materialProps);

	return new THREE.Mesh(geometry, optimizedMaterial);
}

/**
 * Dispose of meshes and free memory
 */
export function disposeMeshes(meshes: THREE.Object3D[]): void {
	meshes.forEach((mesh) => {
		if (mesh.parent) {
			mesh.parent.remove(mesh);
		}

		if (mesh.geometry) {
			mesh.geometry.dispose();
		}

		if (mesh.material) {
			if (Array.isArray(mesh.material)) {
				mesh.material.forEach((m: THREE.Material) => m.dispose());
			} else {
				mesh.material.dispose();
			}
		}
	});
}

/**
 * Get memory usage estimate
 */
export function getMemoryUsageEstimate(
	geometry: PanelGeometry,
	useInstancing: boolean = true,
): number {
	const cells = geometry.cells;

	if (cells.length === 0) return 0;

	// Estimate per-cell memory in KB
	const avgCellSize =
		cells.reduce((sum, c) => sum + c.width * c.height, 0) / cells.length;

	if (useInstancing) {
		// Instanced mesh is more efficient
		return cells.length * 0.1 + avgCellSize * 0.001;
	} else {
		// Individual meshes use more memory
		return cells.length * 2 + avgCellSize * 0.01;
	}
}
