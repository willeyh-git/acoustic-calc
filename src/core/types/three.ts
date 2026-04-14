import type { PanelGeometry } from "./types";

/**
 * Camera mode for Three.js viewport
 */
export type CameraMode = "perspective" | "orthographic";

/**
 * View mode for rendering panels
 */
export type ViewMode =
	| "solid"
	| "transparent"
	| "exploded"
	| "cutaway"
	| "wireframe";

/**
 * Material preset types
 */
export type MaterialPreset =
	| "wood-natural"
	| "wood-dark"
	| "wood-light"
	| "matte-fabric"
	| "metal-aluminum"
	| "acoustic-foam";

/**
 * Camera configuration options
 */
export interface CameraConfig {
	mode: CameraMode;
	fov?: number; // Field of view for perspective camera
	aspectRatio?: number;
	nearPlane?: number;
	farPlane?: number;

	// Position and orientation
	position?: [number, number, number];
	target?: [number, number, number];

	// Controls
	autoFit?: boolean; // Auto-fit to bounding box
	zoomSpeed?: number;
	panSpeed?: number;
	rotateSpeed?: number;
}

/**
 * Lighting configuration
 */
export interface LightingConfig {
	ambientIntensity: number;
	directionalIntensity: number;
	hemisphereLightEnabled: boolean;

	// Shadow settings
	castShadows: boolean;
	receiveShadows: boolean;
	shadowMapSize?: [number, number];
}

/**
 * Material properties for Three.js meshes
 */
export interface MeshMaterialProps {
	color: string | number;
	roughness?: number; // 0-1 (0 = mirror, 1 = matte)
	metalness?: number; // 0-1 (0 = plastic, 1 = metal)
	transparent?: boolean;
	opacity?: number; // 0-1

	// Wireframe option
	wireframe?: boolean;

	// Additional Three.js material properties
	side?: number; // FrontSide.DoubleSide.BackSide
}

/**
 * Cell mesh data structure
 */
export interface CellMeshData {
	cellIndex: number;
	position: [number, number, number];
	dimensions: [number, number, number];
	rotation?: [number, number, number];
	materialProps?: MeshMaterialProps;

	// Construction data
	wallThickness?: number;
	backingThickness?: number;
	flapGeometry?: boolean; // For QRD flaps
}

import * as THREE from "three";

/**
 * Default material preset configurations
 */
export const MATERIAL_PRESETS: Record<MaterialPreset, MeshMaterialProps> = {
	"wood-natural": {
		color: "#8B7355",
		roughness: 0.7,
		metalness: 0.1,
	},
	"wood-dark": {
		color: "#4A3728",
		roughness: 0.6,
		metalness: 0.1,
	},
	"wood-light": {
		color: "#D2B48C",
		roughness: 0.8,
		metalness: 0.05,
	},
	"matte-fabric": {
		color: "#6B7280",
		roughness: 0.95,
		metalness: 0.0,
	},
	"metal-aluminum": {
		color: "#C0C0C0",
		roughness: 0.3,
		metalness: 0.8,
	},
	"acoustic-foam": {
		color: "#9CA3AF",
		roughness: 0.9,
		metalness: 0.0,
	},
};

/**
 * Default camera configuration
 */
export const DEFAULT_CAMERA_CONFIG: CameraConfig = {
	mode: "perspective",
	fov: 45,
	aspectRatio: 16 / 9,
	nearPlane: 0.1,
	farPlane: 1000,
	autoFit: true,
	zoomSpeed: 0.5,
	panSpeed: 0.3,
	rotateSpeed: 0.2,
};

/**
 * Default lighting configuration
 */
export const DEFAULT_LIGHTING_CONFIG: LightingConfig = {
	ambientIntensity: 0.4,
	directionalIntensity: 1.0,
	hemisphereLightEnabled: true,
	castShadows: true,
	receiveShadows: true,
	shadowMapSize: [1024, 1024],
};

/**
 * Default view mode
 */
export const DEFAULT_VIEW_MODE: ViewMode = "solid";

/**
 * Raycast result for hover/click detection
 */
export interface RaycastResult {
	object: THREE.Object3D;
	cellIndex?: number;
	panelType?: string;
	position: [number, number, number];
	faceNormal?: [number, number, number];
	uv?: [number, number];
}

/**
 * Selection state for clicked elements
 */
export interface SelectionState {
	cellIndex: number | null;
	panelType: string | null;
	selectedObject: THREE.Object3D | null; // Three.js object reference

	// Display info
	tooltipText?: string;
	dimensions?: [number, number, number];
}

/**
 * Bounding box for auto-fit camera
 */
export interface BoundingBox {
	min: [number, number, number];
	max: [number, number, number];
	center: [number, number, number];
	size: [number, number, number];
}

/**
 * Three.js scene state management
 */
export interface SceneState {
	camera: THREE.Camera;
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;

	// Controls
	orbitControls?: THREE.OrbitControls;

	// Meshes (weak refs to avoid memory leaks)
	meshes: WeakMap<THREE.Object3D, CellMeshData> | null;

	// Selection tracking
	selectedObject: THREE.Object3D | null;
	hoveredObject: THREE.Object3D | null;

	// View mode
	viewMode: ViewMode;
	wireframeEnabled: boolean;

	// Lighting
	ambientLight: THREE.Light;
	directionalLight: THREE.Light;
	hemisphereLight?: THREE.Light;
}

/**
 * ThreeViewport props interface
 */
export interface ThreeViewportProps {
	panelGeometry: PanelGeometry | null;
	parameters?: Record<string, unknown>;

	// Camera config
	cameraConfig?: Partial<CameraConfig>;

	// Lighting config
	lightingConfig?: Partial<LightingConfig>;

	// Material preset
	materialPreset?: MaterialPreset;
}

/**
 * ThreeViewport events/emits interface
 */
export type ThreeViewportEmits = {
	"selection-change": [SelectionState];
	"view-mode-change": [ViewMode];
	"camera-mode-change": [CameraMode];
	"hover-cell": [RaycastResult];
	"click-cell": [RaycastResult];
};
