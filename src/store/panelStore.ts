import { reactive, readonly } from "vue";
import type { PanelGeometry, PanelParams } from "@/core/types/types";
import type { CameraMode, ViewMode, MaterialPreset } from "@/core/types/three";

/**
 * Visualization state for Three.js viewport
 */
interface VisualizationState {
	cameraMode: CameraMode;
	viewMode: ViewMode;
	materialPreset: MaterialPreset;

	// Selection tracking
	selectedCellIndex: number | null;
	hoveredCellIndex: number | null;
}

/**
 * Panel store with visualization support
 */
export const usePanelStore = () => {
	// Visualization state
	const vizState = reactive<VisualizationState>({
		cameraMode: "perspective",
		viewMode: "solid",
		materialPreset: "wood-natural",
		selectedCellIndex: null,
		hoveredCellIndex: null,
	});

	// Panel geometry (will be set by parent)
	const panelGeometry = reactive<PanelGeometry | null>(null);

	// Parameters (will be set by parent)
	const parameters = reactive<Record<string, unknown>>({});

	/**
	 * Update camera mode
	 */
	function setCameraMode(mode: CameraMode): void {
		vizState.cameraMode = mode;
	}

	/**
	 * Update view mode
	 */
	function setViewMode(mode: ViewMode): void {
		vizState.viewMode = mode;
	}

	/**
	 * Update material preset
	 */
	function setMaterialPreset(preset: MaterialPreset): void {
		vizState.materialPreset = preset;
	}

	/**
	 * Select a cell
	 */
	function selectCell(index: number | null): void {
		vizState.selectedCellIndex = index;
	}

	/**
	 * Update panel geometry
	 */
	function setPanelGeometry(geometry: PanelGeometry | null): void {
		Object.assign(panelGeometry, geometry);
	}

	/**
	 * Update parameters
	 */
	function updateParams(params: Record<string, unknown>): void {
		Object.assign(parameters, params);
	}

	/**
	 * Get current visualization config for ThreeViewport
	 */
	function getVizConfig(): {
		cameraMode: CameraMode;
		viewMode: ViewMode;
		materialPreset: MaterialPreset;
		panelGeometry: PanelGeometry | null;
	} {
		return {
			cameraMode: vizState.cameraMode,
			viewMode: vizState.viewMode,
			materialPreset: vizState.materialPreset,
			panelGeometry: panelGeometry,
		};
	}

	/**
	 * Reset visualization to defaults
	 */
	function resetVisualization(): void {
		vizState.cameraMode = "perspective";
		vizState.viewMode = "solid";
		vizState.materialPreset = "wood-natural";
		vizState.selectedCellIndex = null;
		vizState.hoveredCellIndex = null;
	}

	return {
		// State (readonly for components)
		vizState: readonly(vizState),
		panelGeometry: readonly(panelGeometry),
		parameters: readonly(parameters),

		// Actions
		setCameraMode,
		setViewMode,
		setMaterialPreset,
		selectCell,
		setPanelGeometry,
		updateParams,
		resetVisualization,

		// Get config for ThreeViewport
		getVizConfig,
	};
};
