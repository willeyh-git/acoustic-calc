<script setup lang="ts">
import type { PanelGeometry } from "@/core/types/types";
import type { Unit } from "@/core/types/types";

const props = defineProps<{
	geometry: PanelGeometry | null;
	unit?: Unit;
	showDimensions?: boolean;
}>();

// Calculate dimensions for display
const panelDimensions = computed(() => {
	if (!props.geometry) return null;

	return {
		width: props.geometry.boundingBox.width,
		height: props.geometry.boundingBox.height,
		depth: props.geometry.boundingBox.depth || 0,
	};
});
</script>

<template>
	<div class="dimension-annotations">
		<!-- Overall panel dimensions -->
		<div v-if="panelDimensions && showDimensions" class="overall-dimensions">
			<div class="dimension-row">
				<span class="label">Width:</span>
				<span class="value">{{ panelDimensions.width.toFixed(1) }} {{ unit }}</span>
			</div>
			<div class="dimension-row">
				<span class="label">Height:</span>
				<span class="value">{{ panelDimensions.height.toFixed(1) }} {{ unit }}</span>
			</div>
			<div v-if="panelDimensions.depth > 0" class="dimension-row">
				<span class="label">Depth:</span>
				<span class="value">{{ panelDimensions.depth.toFixed(1) }} {{ unit }}</span>
			</div>
		</div>

		<!-- Cell dimensions (show first few cells) -->
		<div v-if="geometry && showDimensions" class="cell-dimensions">
			<h4 class="section-title">Cell Dimensions (first 5)</h4>
			<table class="dimensions-table">
				<thead>
					<tr>
						<th>#</th>
						<th>X Position</th>
						<th>Width</th>
						<th>Height</th>
						<th>Depth</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(cell, index) in geometry.cells.slice(0, 5)" :key="index">
						<td>{{ index + 1 }}</td>
						<td>{{ cell.x.toFixed(1) }} {{ unit }}</td>
						<td>{{ (cell.width || 0).toFixed(1) }} {{ unit }}</td>
						<td>{{ (cell.height || 0).toFixed(1) }} {{ unit }}</td>
						<td>{{ (cell.depth || 0).toFixed(1) }} {{ unit }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Construction features -->
		<div v-if="geometry && showDimensions" class="construction-features">
			<h4 class="section-title">Construction Features</h4>
			<ul class="features-list">
				<li v-if="geometry.metadata?.wallThickness">
					Wall Thickness: {{ geometry.metadata.wallThickness.toFixed(1) }} {{ unit }}
				</li>
				<li v-if="geometry.metadata?.backingPlateThickness">
					Backing Plate: {{ geometry.metadata.backingPlateThickness.toFixed(1) }} {{ unit }}
				</li>
				<li v-if="geometry.metadata?.kerf">
					Kerf Tolerance: {{ geometry.metadata.kerf.toFixed(2) }} {{ unit }}
				</li>
			</ul>
		</div>
	</div>
</template>

<style scoped>
.dimension-annotations {
	padding: 1rem;
	background-color: white;
	border-radius: 0.375rem;
	border: 1px solid #e5e7eb;
}

.overall-dimensions {
	margin-bottom: 1.5rem;
}

.dimension-row {
	display: flex;
	align-items: baseline;
	gap: 0.5rem;
	margin-bottom: 0.5rem;
}

.dimension-row .label {
	font-weight: 600;
	color: #374151;
	min-width: 80px;
}

.dimension-row .value {
	color: #1f2937;
	font-size: 1.125rem;
}

.section-title {
	margin: 0 0 0.75rem 0;
	font-size: 0.875rem;
	font-weight: 600;
	color: #374151;
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.dimensions-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.875rem;
	margin-bottom: 1.5rem;
}

.dimensions-table th,
.dimensions-table td {
	padding: 0.5rem;
	text-align: left;
	border-bottom: 1px solid #e5e7eb;
}

.dimensions-table th {
	font-weight: 600;
	color: #374151;
	background-color: #f9fafb;
}

.dimensions-table td {
	color: #6b7280;
}

.features-list {
	list-style-type: none;
	padding: 0;
	margin: 0;
}

.features-list li {
	padding: 0.5rem 0;
	border-bottom: 1px solid #f3f4f6;
	color: #4b5563;
	font-size: 0.875rem;
}

.features-list li:last-child {
	border-bottom: none;
}
</style>
