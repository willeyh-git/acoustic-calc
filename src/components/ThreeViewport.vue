<script setup lang="ts">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { onMounted, onUnmounted, ref } from "vue";
import type { CameraMode, MaterialPreset, ViewMode } from "@/core/types/three";
import type { PanelGeometry } from "@/core/types/types";
import {
	applyViewMode,
	generateExplodedViewMeshes,
	generatePanelMeshes,
} from "@/core/visualization/cellToMesh";
import {
	createMeshMaterial,
	getMaterialPreset,
	HIGHLIGHT_MATERIAL,
	SELECTION_MATERIAL,
} from "@/core/visualization/materials";

// Refs
const gl = ref<HTMLCanvasElement | null>(null);
const container = ref<HTMLElement | null>(null);

// Scene state
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let controls: OrbitControls | null = null;

// Meshes storage
const meshes = new Map<number, THREE.Mesh>();
const cellDataMap = new Map<number, CellMeshData | undefined>();

// Selection state
const selectedCellIndex = ref<number | null>(null);
const hoveredCellIndex = ref<number | null>(null);

// Configuration
let cameraMode: CameraMode = "perspective";
let viewMode: ViewMode = "solid";
let materialPreset: MaterialPreset = "wood-natural";

// Animation frame ID
let animationFrameId: number | null = null;

// Props (will be passed from parent)
const props = defineProps<{
	panelGeometry?: PanelGeometry | null;
	materialPreset?: MaterialPreset;
}>();

// Emits
const emit = defineEmits<{
	"selection-change": [cellIndex: number | null];
	"view-mode-change": [mode: ViewMode];
	"camera-mode-change": [mode: CameraMode];
	"hover-cell": [cellIndex: number, data: CellMeshData | undefined];
	"click-cell": [cellIndex: number, event: MouseEvent];
}>();

// Initialize Three.js scene
function initThreeJS() {
	if (!container.value) return;

	// Scene
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xf0f0f0);

	// Camera (Perspective by default)
	const aspect = container.value.clientWidth / container.value.clientHeight;
	camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
	camera.position.set(3, 3, 5);

	// Renderer
	renderer = new THREE.WebGLRenderer({
		canvas: gl.value!,
		antialias: true,
		preserveDrawingBuffer: false,
	});
	renderer.setSize(container.value.clientWidth, container.value.clientHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	// Orbit Controls
	controls = new OrbitControls(camera, gl.value!);
	controls.enableDamping = true;
	controls.dampingFactor = 0.05;
	controls.minDistance = 1;
	controls.maxDistance = 50;
	controls.enablePan = true;

	// Lighting
	setupLighting();

	// Helpers
	addSceneHelpers();

	// Start render loop
	startRenderLoop();
}

// Setup lighting system
function setupLighting() {
	if (!scene || !camera) return;

	// Ambient light (soft base illumination)
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
	scene.add(ambientLight);

	// Directional light with shadows
	const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
	directionalLight.position.set(5, 10, 7);
	directionalLight.castShadow = true;
	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;
	scene.add(directionalLight);

	// Hemisphere light for natural lighting simulation
	const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
	scene.add(hemisphereLight);
}

// Add scene helpers (grid, axes)
function addSceneHelpers() {
	if (!scene) return;

	// Grid helper with measurements
	const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0xcccccc);
	scene.add(gridHelper);

	// Axis helpers (X/Y/Z orientation)
	const axesHelper = new THREE.AxesHelper(2);
	scene.add(axesHelper);
}

// Generate meshes from panel geometry
function generateMeshes() {
	if (!props.panelGeometry || !camera) return;

	// Clear existing meshes
	clearMeshes();

	// Get material props for preset
	const materialProps = getMaterialPreset(materialPreset);

	// Generate mesh data based on view mode
	let meshData: CellMeshData[];

	if (viewMode === "exploded") {
		// Use exploded view generation with configurable parameters
		meshData = generateExplodedViewMeshes(
			props.panelGeometry,
			3, // wallThickness in mm
			20, // backingThickness in mm
			15, // separationDistance in mm
		);
	} else {
		// Standard view mode with configurable parameters
		const standardMeshData = generatePanelMeshes(
			props.panelGeometry,
			3, // wallThickness in mm
			0, // backingThickness (can be configured)
			materialProps,
		);

		// Apply view mode
		meshData = applyViewMode(standardMeshData, viewMode);
	}

	// Create Three.js meshes for each cell
	meshData.forEach((data, index) => {
		createCellMesh(data);
	});

	// Auto-fit camera to bounding box
	fitCameraToGeometry();
}

// Create a single cell mesh
function createCellMesh(data: CellMeshData) {
	if (!scene || !camera) return;

	const { position, dimensions, materialProps } = data;

	// Geometry (box for wells)
	const geometry = new THREE.BoxGeometry(
		Math.max(0.1, dimensions[0]),
		Math.max(0.1, dimensions[1]),
		Math.max(0.1, dimensions[2]),
	);

	// Material
	const material = createMeshMaterial(materialProps);

	// Create mesh
	const mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(position[0], position[1], position[2]);
	mesh.castShadow = true;
	mesh.receiveShadow = true;
	mesh.name = `cell-${data.cellIndex}`;

	// Store cell data for raycasting
	const cellData = {
		...data,
		mesh,
		index: data.cellIndex ?? -1,
	};

	scene.add(mesh);
	meshes.set(data.cellIndex ?? -1, mesh);
	cellDataMap.set(data.cellIndex ?? -1, cellData);
}

// Clear all meshes from scene
function clearMeshes() {
	if (!scene) return;

	// Remove all meshes
	meshes.forEach((mesh) => {
		scene.remove(mesh);
		mesh.geometry?.dispose();
		mesh.material?.dispose();
	});

	meshes.clear();
	cellDataMap.clear();
}

// Fit camera to panel geometry bounding box
function fitCameraToGeometry() {
	if (!camera || !scene) return;

	// Get bounding box of all meshes
	const boxes = new THREE.Box3();

	meshes.forEach((mesh) => {
		const box = new THREE.Box3().setFromObject(mesh);
		boxes.expandByBox(box);
	});

	if (boxes.isEmpty()) return;

	// Calculate center and size
	const center = boxes.getCenter(new THREE.Vector3());
	const size = boxes.getSize(new THREE.Vector3());

	// Position camera to view the object
	const distance = Math.max(size.x, size.y, size.z) * 1.5;
	camera.position.set(
		center.x + distance,
		center.y + distance,
		center.z + distance,
	);
	camera.lookAt(center);

	controls?.target.copy(center);
	controls.update();
}

// Handle mouse hover over meshes
function onMeshHover(event: MouseEvent) {
	if (!camera || !gl.value) return;

	// Raycaster for hover detection
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(event, camera);

	// Intersect with meshes
	const intersects = raycaster.intersectObjects(meshes.values(), false);

	if (intersects.length > 0) {
		const object = intersects[0].object;
		const cellIndexStr = object.name.split("-")[1];
		const cellIndex = cellIndexStr ? parseInt(cellIndexStr, 10) : -1;
		const cellData = cellDataMap.get(cellIndex);

		hoveredCellIndex.value = cellData?.index ?? null;

		emit("hover-cell", cellData?.index ?? -1, cellData);

		// Highlight effect
		if (object.material) {
			const originalColor = object.material.color.getHex();
			object.material.color.setHex(HIGHLIGHT_MATERIAL.color);

			setTimeout(() => {
				object.material.color.setHex(originalColor);
			}, 200);
		}
	} else {
		hoveredCellIndex.value = null;
		emit("hover-cell", -1, null);
	}
}

// Start render loop
function startRenderLoop() {
	function animate() {
		animationFrameId = requestAnimationFrame(animate);

		if (controls) {
			controls.update();
		}

		if (renderer && scene && camera) {
			renderer.render(scene, camera);
		}
	}

	animate();
}

// Handle window resize
function onResize() {
	if (!container.value || !camera || !renderer) return;

	const width = container.value.clientWidth;
	const height = container.value.clientHeight;

	camera.aspect = width / height;
	camera.updateProjectionMatrix();

	renderer.setSize(width, height);
}

// Cleanup
function cleanup() {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);
	}

	if (renderer) {
		renderer.dispose();
	}

	if (scene) {
		scene.traverse((object: THREE.Object3D) => {
			if (object.geometry) object.geometry.dispose();
			if (object.material) object.material.dispose();
		});
	}
}

// Lifecycle hooks
onMounted(() => {
	initThreeJS();

	window.addEventListener("resize", onResize);
});

onUnmounted(() => {
	cleanup();
	window.removeEventListener("resize", onResize);
});
</script>

<template>
  <div ref="container" class="three-viewport">
    <canvas ref="gl"></canvas>
    
    <!-- Loading indicator (optional) -->
    <div v-if="!panelGeometry" class="loading-indicator">
      <p>Loading 3D viewer...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="panelGeometry && panelGeometry.cells.length === 0" class="empty-state">
      <p>No cells to display</p>
    </div>
  </div>
</template>

<style scoped>
.three-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f0f0f0;
}

.loading-indicator,
.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #666;
  font-size: 14px;
}

.loading-indicator p,
.empty-state p {
  margin: 0;
}
</style>

