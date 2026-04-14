<script setup lang="ts">
import type { PanelGeometry } from "@/core/types/types";
import type { PanelParams } from "@/core/types/panelTypes";
import type { SvgViewType } from "@/core/types/svg";
import { computed } from "vue";
import {
	createSvgViewForPanel,
	getRecommendedViewType,
	getAvailableViewTypes,
} from "@/core/factories/createSvgView";

const props = defineProps<{
	panelGeometry: PanelGeometry | null;
	parameters?: Record<string, unknown>;
	viewType?: SvgViewType;
	showDimensions?: boolean;
	showLabels?: boolean;
}>();

const emits = defineEmits<{
	"update:view-type": [viewType: SvgViewType];
	"selection-change": [cellIndex: number | null];
	"zoom-level-change": [zoomLevel: number];
}>();

// Computed properties
const availableViewTypes = computed<SvgViewType[]>(() => {
	if (!props.panelGeometry) return [];
	const params = props.parameters as unknown as PanelParams;
	return getAvailableViewTypes(params);
});

const currentViewType = computed<SvgViewType>(
	() =>
		props.viewType ||
		getRecommendedViewType(props.parameters as unknown as PanelParams),
);

// Generate SVG views
const svgViews = computed(() => {
	if (!props.panelGeometry) return [];
	const params = props.parameters as unknown as PanelParams;
	return createSvgViewForPanel(
		props.panelGeometry,
		params,
		currentViewType.value,
	);
});

// Handle view type change
function handleViewTypeChange(newType: SvgViewType) {
	emits("update:view-type", newType);
}

// Handle cell selection (placeholder - would need raycasting for actual implementation)
function handleCellSelection(cellIndex: number | null) {
	emits("selection-change", cellIndex);
}

// Handle zoom level change
function handleZoomLevelChange(zoomLevel: number) {
	emits("zoom-level-change", zoomLevel);
}

/**
 * Get display name for view type
 */
function getDisplayName(viewType: SvgViewType): string {
	const names = {
		side: "Side View",
		front: "Front View",
		top: "Top View",
	};
	return names[viewType] || viewType;
}

/**
 * Handle mouse move for panning (placeholder)
 */
function handleMouseMove(event: MouseEvent) {
	// TODO: Implement panning logic when needed
}

/**
 * Handle wheel for zooming
 */
function handleWheel(event: WheelEvent) {
	if (event.ctrlKey || event.metaKey) {
		const delta = -event.deltaY;
		const newZoom = Math.min(Math.max(0.2, 1 + delta * 0.001), 3);
		emits("zoom-level-change", newZoom);
		event.preventDefault();
	}
}

/**
 * Get layer elements from SVG view data
 */
function getLayerElements(layers: Record<string, any>): Record<string, any> {
	return layers;
}
</script>

<template>
	<div class="svg-viewport" @mousemove="handleMouseMove" @wheel="handleWheel">
		<!-- View type selector -->
		<div class="view-selector">
			<button
				v-for="viewType in availableViewTypes"
				:key="viewType"
				:class="{ active: currentViewType === viewType }"
				@click.prevent="handleViewTypeChange(viewType)"
			>
				{{ getDisplayName(viewType) }}
			</button>
		</div>

		<!-- SVG container -->
		<div class="svg-container">
			<svg
				v-if="svgViews.length > 0"
				:key="currentViewType"
				viewBox="0 0 {{ svgViews[0].svgData.boundingBox.width }} {{ svgViews[0].svgData.boundingBox.height }}"
				width="100%"
				height="100%"
			>
				<!-- Cut layer -->
				<g v-for="(elements, layer) in getLayerElements(svgViews[0]?.svgData?.layers || {})" :key="layer">
					<template v-if="layer === 'cut'">
						<rect
							v-for="el in elements"
							:key="`cut-${Math.random()}`"
							:x="el.x"
							:y="el.y"
							:width="el.width"
							:height="el.height"
							:stroke="el.stroke || '#000'"
							:stroke-width="el.strokeWidth || 1.5"
							fill="none"
						/>
					</template>

					<template v-if="layer === 'fold'">
						<line
							v-for="el in elements"
							:key="`fold-${Math.random()}`"
							:x1="el.x1"
							:y1="el.y1"
							:x2="el.x2"
							:y2="el.y2"
							:stroke="el.stroke || '#6B7280'"
							:stroke-width="el.strokeWidth || 1"
							:stroke-dasharray="el.dasharray || '3,3'"
						/>
					</template>

					<template v-if="layer === 'dimension'">
						<text
							v-for="el in elements"
							:key="`dim-${Math.random()}`"
							:x="(el.x1 + el.x2) / 2"
							:y="(el.y1 + el.y2) / 2 - 5"
							font-size="10"
							text-anchor="middle"
						>
							{{ el.value }}
						</text>
					</template>

					<template v-if="layer === 'label'">
						<text
							v-for="el in elements"
							:key="`label-${Math.random()}`"
							:x="el.x"
							:y="el.y"
							font-size="10"
						>
							{{ el.text }}
						</text>
					</template>

					<template v-if="layer === 'hidden'">
						<rect
							v-for="el in elements"
							:key="`hidden-${Math.random()}`"
							:x="el.x"
							:y="el.y"
							:width="el.width"
							:height="el.height"
							:stroke="el.stroke || '#9CA3AF'"
							:stroke-width="el.strokeWidth || 1"
							fill="none"
							:stroke-dasharray="el.dasharray || '5,5'"
						/>
					</template>
				</g>
			</svg>

			<!-- Empty state -->
			<div v-else class="empty-state">
				<p>No geometry available to display</p>
			</div>
		</div>

		<!-- Info panel -->
		<div v-if="svgViews.length > 0" class="info-panel">
			<h3>{{ svgViews[0]?.viewName || "SVG View" }}</h3>
			<p>Unit: {{ svgViews[0]?.svgData?.unit || "mm" }}</p>
			<p>Scale: {{ svgViews[0]?.svgData?.scale ?? 1 }}x</p>
		</div>
	</div>
</template>

<style scoped>
.svg-viewport {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	padding: 1rem;
	background-color: #f9fafb;
	border-radius: 0.5rem;
}

.view-selector {
	display: flex;
	gap: 0.5rem;
	justify-content: center;
}

.view-selector button {
	padding: 0.5rem 1rem;
	border: 1px solid #d1d5db;
	background-color: white;
	border-radius: 0.375rem;
	cursor: pointer;
	font-size: 0.875rem;
	transition: all 0.2s;
}

.view-selector button:hover {
	background-color: #f3f4f6;
}

.view-selector button.active {
	background-color: #3b82f6;
	color: white;
	border-color: #3b82f6;
}

.svg-container {
	flex: 1;
	min-height: 400px;
	border: 1px solid #e5e7eb;
	border-radius: 0.375rem;
	overflow: auto;
	background-color: white;
}

.empty-state {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 100%;
	color: #6b7280;
}

.info-panel {
	padding: 0.75rem;
	background-color: white;
	border-radius: 0.375rem;
	border: 1px solid #e5e7eb;
}

.info-panel h3 {
	margin: 0 0 0.5rem 0;
	font-size: 1rem;
	color: #1f2937;
}

.info-panel p {
	margin: 0.25rem 0;
	font-size: 0.875rem;
	color: #6b7280;
}
</style>
