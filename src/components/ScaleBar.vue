<script setup lang="ts">
import type { Unit } from "@/core/types/types";

const props = defineProps<{
	unit: Unit;
	length?: number; // Length to show on scale bar (default 100mm)
	showValue?: boolean;
}>();

// Use prop directly, no need for local constant
const displayLength =
	props.showValue !== false ? `${props.length || 100} ${props.unit}` : "";

// Convert to visual units (assuming SVG uses mm as base unit)
const barWidth = props.length || 100; // Removed unnecessary * 1 multiplication
</script>

<template>
	<div class="scale-bar-container">
		<!-- Scale bar -->
		<div class="scale-bar" :style="{ width: `${barWidth}px` }">
			<!-- Tick marks -->
			<div
				v-for="i in 10"
				:key="i"
				class="tick-mark"
				:class="{ long: i % 5 === 0, medium: i % 2 === 0 }"
				:style="{ left: `${(i / 10) * 100}%` }"
			/>

			<!-- Tick labels -->
			<div
				v-for="i in 10"
				:key="i"
				class="tick-label"
				:class="{ long: i % 5 === 0, medium: i % 2 === 0 }"
				:style="{ left: `${(i / 10) * 100}%` }"
			>
				<span class="value">{{ (i / 10) * (props.length || 100) }}</span>
			</div>

			<!-- End ticks -->
			<div class="end-tick left" />
			<div class="end-tick right" />
		</div>

		<!-- Label -->
		<div v-if="displayLength" class="scale-label">
			{{ displayLength }}
		</div>
	</div>
</template>

<style scoped>
.scale-bar-container {
	display: flex;
	align-items: center;
	gap: 1rem;
	padding: 0.75rem;
	background-color: white;
	border-radius: 0.375rem;
	border: 1px solid #e5e7eb;
}

.scale-bar {
	position: relative;
	height: 20px;
	background-color: #f3f4f6;
	border-radius: 2px;
	overflow: hidden;
}

.tick-mark {
	position: absolute;
	top: 0;
	width: 1px;
	height: 5px;
	background-color: #374151;
}

.tick-mark.long {
	height: 10px;
}

.tick-label {
	position: absolute;
	bottom: -20px;
	transform: translateX(-50%);
	font-size: 0.75rem;
	color: #6b7280;
	white-space: nowrap;
}

.tick-label.long {
	font-weight: 600;
	color: #374151;
}

.tick-label .value {
	display: block;
}

.end-tick {
	position: absolute;
	top: 0;
	width: 1px;
	height: 10px;
	background-color: #374151;
}

.end-tick.left {
	left: 0;
}

.end-tick.right {
	right: 0;
}

.scale-label {
	font-size: 0.875rem;
	color: #374151;
	font-weight: 500;
	white-space: nowrap;
}
</style>
