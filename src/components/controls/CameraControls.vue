<script setup lang="ts">
import { ref, watch } from "vue";
import type { CameraMode, ViewMode } from "@/core/types/three";

// Props
const props = defineProps<{
	cameraMode?: CameraMode;
	viewMode?: ViewMode;
}>();

// Emits
const emit = defineEmits<{
	"update:camera-mode": [mode: CameraMode];
	"update:view-mode": [mode: ViewMode];
}>();

// Local state (synced with props)
const localCameraMode = ref(props.cameraMode || "perspective");
const localViewMode = ref(props.viewMode || "solid");

// Watch for prop changes
watch(
	() => props.cameraMode,
	(newVal) => {
		if (newVal !== localCameraMode.value) {
			localCameraMode.value = newVal;
		}
	},
);

watch(
	() => props.viewMode,
	(newVal) => {
		if (newVal !== localViewMode.value) {
			localViewMode.value = newVal;
		}
	},
);

// Camera mode toggle
const cameraModes: CameraMode[] = ["perspective", "orthographic"];
const currentCameraIndex = cameraModes.indexOf(localCameraMode.value);

function nextCameraMode() {
	const newIndex = (currentCameraIndex + 1) % cameraModes.length;
	localCameraMode.value = cameraModes[newIndex];
	emit("update:camera-mode", localCameraMode.value);
}

// View mode toggle
const viewModes: ViewMode[] = ["solid", "transparent", "wireframe", "exploded"];
const currentViewIndex = viewModes.indexOf(localViewMode.value);

function nextViewMode() {
	const newIndex = (currentViewIndex + 1) % viewModes.length;
	localViewMode.value = viewModes[newIndex];
	emit("update:view-mode", localViewMode.value);
}

// Keyboard shortcuts
const handleKeyDown = (event: KeyboardEvent) => {
	switch (event.key.toLowerCase()) {
		case "q":
			nextCameraMode();
			break;
		case "w":
			nextViewMode();
			break;
	}
};

// Expose methods for parent component
defineExpose({
	localCameraMode,
	localViewMode,
});
</script>

<template>
  <div class="controls-panel">
    <!-- Camera Mode Controls -->
    <div class="control-group">
      <label class="control-label">
        <span class="icon">📷</span>
        Camera View
      </label>
      
      <div class="mode-selector">
        <button 
          v-for="mode in cameraModes" 
          :key="mode"
          @click="localCameraMode = mode"
          :class="{ active: localCameraMode === mode }"
          :title="mode === 'perspective' ? 'Perspective view (Q)' : 'Orthographic view'"
        >
          {{ mode === 'perspective' ? '3D' : '2D' }}
        </button>
      </div>
    </div>

    <!-- View Mode Controls -->
    <div class="control-group">
      <label class="control-label">
        <span class="icon">🎨</span>
        Display Mode
      </label>
      
      <div class="mode-selector">
        <button 
          v-for="mode in viewModes" 
          :key="mode"
          @click="localViewMode = mode"
          :class="{ active: localViewMode === mode }"
          :title="`Toggle ${mode} mode (W)`"
        >
          {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
        </button>
      </div>
    </div>

    <!-- Keyboard Shortcuts Info -->
    <div class="shortcuts-info">
      <span title="Toggle camera view (Q/W/E)">Q: Camera</span>
      <span title="Toggle display mode (W)">W: View Mode</span>
    </div>
  </div>
</template>

<style scoped>
.controls-panel {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 100;
}

.control-group {
  margin-bottom: 12px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.icon {
  font-size: 16px;
}

.mode-selector {
  display: flex;
  gap: 4px;
}

.mode-selector button {
  padding: 6px 12px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-selector button:hover {
  border-color: #666;
  background: #f8f8f8;
}

.mode-selector button.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #3b82f6;
}

.shortcuts-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ddd;
  font-size: 11px;
  color: #666;
  display: flex;
  gap: 16px;
}

.shortcuts-info span {
  cursor: default;
}
</style>

