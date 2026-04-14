import * as THREE from "three";
import type { MeshMaterialProps, MaterialPreset } from "@/core/types/three";

/**
 * Create a Three.js material from props
 */
export function createMeshMaterial(
	props: MeshMaterialProps = {},
): Record<string, unknown> {
	const {
		color = "#808080",
		roughness = 0.5,
		metalness = 0.1,
		transparent = false,
		opacity = 1,
		wireframe = false,
		side = 2, // DoubleSide
	} = props;

	return {
		color: new THREE.Color(color),
		roughness,
		metalness,
		transparent,
		opacity,
		side,
		wireframe,
	};
}

/**
 * Get material configuration for a preset
 */
export function getMaterialPreset(preset: MaterialPreset): MeshMaterialProps {
	return MATERIAL_PRESETS[preset] || MATERIAL_PRESETS["wood-natural"];
}

/**
 * Apply material to Three.js mesh
 */
export function applyMaterialToMesh(
	mesh: THREE.Mesh,
	props: MeshMaterialProps = {},
): void {
	const materialConfig = createMeshMaterial(props);

	if (mesh.material) {
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((m: THREE.Material, i: number) => {
				Object.assign(m, materialConfig);
			});
		} else {
			Object.assign(mesh.material, materialConfig);
		}
	} else {
		mesh.material = new THREE.MeshStandardMaterial(materialConfig);
	}

	// Apply wireframe if requested
	if (props.wireframe) {
		mesh.material.wireframe = true;
	}
}

/**
 * Reset material to default preset
 */
export function resetMaterialToPreset(
	mesh: THREE.Mesh,
	preset: MaterialPreset = "wood-natural",
): void {
	const props = getMaterialPreset(preset);
	applyMaterialToMesh(mesh, props);
}

/**
 * Set transparency on material
 */
export function setTransparency(
	mesh: THREE.Mesh,
	transparent: boolean,
	opacity?: number,
): void {
	if (mesh.material) {
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((m: THREE.Material) => {
				m.transparent = transparent;
				m.opacity = opacity ?? 1;
			});
		} else {
			mesh.material.transparent = transparent;
			mesh.material.opacity = opacity ?? 1;
		}
	}
}

/**
 * Enable/disable wireframe mode
 */
export function setWireframe(mesh: THREE.Mesh, enabled: boolean): void {
	if (mesh.material) {
		if (Array.isArray(mesh.material)) {
			mesh.material.forEach((m: THREE.Material) => {
				m.wireframe = enabled;
			});
		} else {
			mesh.material.wireframe = enabled;
		}
	}
}

/**
 * Get all material presets as array
 */
export function getMaterialPresets(): MaterialPreset[] {
	return Object.keys(MATERIAL_PRESETS) as MaterialPreset[];
}

/**
 * Get preset by name (case-insensitive)
 */
export function getPresetByName(name: string): MaterialPreset | null {
	const presets = getMaterialPresets();
	return presets.find((p) => p.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Highlight material for hover effects
 */
export const HIGHLIGHT_MATERIAL = {
	color: "#FFD700", // Gold for highlighting
	roughness: 0.3,
	metalness: 0.8,
};

/**
 * Selection material for selected cells
 */
export const SELECTION_MATERIAL = {
	color: "#00FFFF", // Cyan for selection
	roughness: 0.5,
	metalness: 0.2,
};
