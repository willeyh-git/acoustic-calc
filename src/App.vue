<script setup lang="ts">
import { ref } from "vue";
import ThreeViewport from "@/components/ThreeViewport.vue";
import CameraControls from "@/components/controls/CameraControls.vue";
import SelectionTooltip from "@/components/display/SelectionTooltip.vue";
import type { PanelGeometry } from "@/core/types/types";
import type { CellMeshData } from "@/core/types/three";

// Sample panel geometry for demonstration
const sampleQrdGeometry: PanelGeometry = {
	cells: [
		{ x: 0, y: 0, width: 50, height: 50 },
		{ x: 60, y: 0, width: 40, height: 40 },
		{ x: 120, y: 0, width: 30, height: 30 },
		{ x: 0, y: 60, width: 50, height: 50 },
		{ x: 60, y: 60, width: 40, height: 40 },
	],
	boundingBox: {
		width: 180,
		height: 120,
		depth: 50,
	},
};

// State
const panelGeometry = ref<PanelGeometry | null>(sampleQrdGeometry);
const selectedCellIndex = ref<number | null>(null);
const hoveredCellIndex = ref<number | null>(null);

// Event handlers
function handleSelectionChange(index: number) {
	selectedCellIndex.value = index;
}

function handleHoverCell(index: number, data: CellMeshData | undefined) {
	hoveredCellIndex.value = index;
}

function handleClickCell(index: number, event: MouseEvent) {
	console.log(`Clicked cell ${index}`, event);
}
</script>

<template>
  <div class="app-container">
    <!-- Main content area -->
    <main class="main-content">
      <!-- Three.js Viewport -->
      <ThreeViewport
        :panel-geometry="panelGeometry"
        @selection-change="handleSelectionChange"
        @hover-cell="handleHoverCell"
        @click-cell="handleClickCell"
      />

      <!-- Selection Tooltip (positioned near selection) -->
      <SelectionTooltip
        v-if="selectedCellIndex !== null"
        :cell-index="selectedCellIndex"
        :panel-type="'qrd'"
        :dimensions="[50, 50, 3]"
        @close="selectedCellIndex = null"
      />

      <!-- Controls Panel (floating) -->
      <CameraControls
        :camera-mode="'perspective'"
        :view-mode="'solid'"
      />
    </main>

    <!-- Overlay instructions -->
    <div class="overlay-instructions">
      <h2>🎵 Acoustic Panel 3D Viewer</h2>
      <p><strong>Orbit:</strong> Left-click drag to rotate view</p>
      <p><strong>Zoom:</strong> Scroll wheel to zoom in/out</p>
      <p><strong>Pan:</strong> Shift + drag to pan</p>
      <p><strong>Hover:</strong> Move cursor over cells for details</p>
      <p><strong>Click:</strong> Select a cell to view information</p>
    </div>

    <!-- Empty state -->
    <div v-if="!panelGeometry" class="empty-state">
      <h2>Loading...</h2>
      <p>Please wait while we set up the 3D viewer</p>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f5f5;
}

.main-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.overlay-instructions {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(255, 255, 255, 0.95);
  padding: 16px 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.overlay-instructions h2 {
  margin: 0 0 12px 0;
  font-size: 18px;
  color: #333;
}

.overlay-instructions p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

.empty-state h2 {
  margin-bottom: 8px;
  font-size: 24px;
}

.empty-state p {
  font-size: 16px;
}
</style>
