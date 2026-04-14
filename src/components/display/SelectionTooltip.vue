<script setup lang="ts">
import { computed } from "vue";
import type { DiffusionRange, PanelCell } from "@/core/types/types";

// Props
const props = defineProps<{
	cellIndex?: number | null;
	cellData?: Partial<PanelCell>;
	panelType?: string;
	dimensions?: [number, number, number];
}>();

// Computed properties
const isSelected = computed(() => props.cellIndex !== null);

// Format dimensions for display
const formattedDimensions = computed(() => {
	if (!props.dimensions) return "";

	const [width, height, depth] = props.dimensions;
	return `${width.toFixed(1)} × ${height.toFixed(1)} × ${depth ? depth.toFixed(1) : "0"} mm`;
});

// Format cell info
const cellInfo = computed(() => {
	if (!props.cellData || !props.panelType) return "";

	const typeLabels: Record<string, string> = {
		qrd: "Quadratic Residue Diffuser",
		skyline: "Skyline Pattern",
		abfusor: "Binary Amplitude Diffuser",
		porous: "Porous Absorber",
		helmholtz: "Helmholtz Resonator",
	};

	const typeLabel = typeLabels[props.panelType] || props.panelType;

	return `Cell #${props.cellIndex + 1} - ${typeLabel}`;
});

// Format diffusion range if available
const diffusionRange = computed(() => {
	if (!props.cellData) return "";

	const cell = props.cellData as Partial<
		PanelCell & { diffusion?: DiffusionRange }
	>;
	if (cell.diffusion && "minFrequency" in cell.diffusion) {
		const diff = cell.diffusion as DiffusionRange;
		return `Freq: ${diff.minFrequency.toFixed(1)} - ${diff.maxFrequency.toFixed(1)} Hz`;
	}

	return "";
});

// Main tooltip text
const tooltipText = computed(() => {
	if (!props.cellIndex) return "Select a cell to view details";

	const parts = [cellInfo.value, formattedDimensions.value];
	if (diffusionRange.value) {
		parts.push(diffusionRange.value);
	}

	return parts.join(" | ");
});

// Expose methods for parent component
defineExpose({
	tooltipText,
});
</script>

<template>
  <div v-if="cellIndex !== null" class="selection-tooltip">
    <div class="tooltip-content">
      <div class="header">
        <span class="icon">{{ isSelected ? '✓' : '●' }}</span>
        <span>{{ tooltipText }}</span>
      </div>
      
      <!-- Dimensions -->
      <div v-if="dimensions" class="dimension-row">
        <span class="label">Dimensions:</span>
        <span class="value">{{ formattedDimensions }}</span>
      </div>

      <!-- Additional info (if available) -->
      <div v-if="cellData?.diffusion" class="info-row">
        <span class="label">Diffusion Range:</span>
        <span class="value">{{ diffusionRange }}</span>
      </div>
    </div>

    <!-- Close button -->
    <button @click="$emit('close')" class="close-btn">×</button>
  </div>
</template>

<style scoped>
.selection-tooltip {
  position: absolute;
  background: rgba(31, 41, 55, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 200px;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.icon {
  color: #3b82f6;
  font-size: 16px;
}

.dimension-row,
.info-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #d1d5db;
}

.label {
  color: #9ca3af;
  min-width: 80px;
}

.value {
  color: white;
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 12px;
}

.close-btn {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: white;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}
</style>

