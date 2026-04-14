/**
 * Performance Optimization Notes for Three.js Visualization
 */

// Key optimizations implemented:
// 1. Instanced Meshes - Use createInstancedMeshes() when cells have similar dimensions
//    - Reduces draw calls from N to 1
//    - Best for panels with many identical wells
//
// 2. Level of Detail (LOD) - Use createLODMeshes() for distant views
//    - High detail at close range
//    - Simplified bounding boxes at distance
//    - Reduces polygon count by up to 90%
//
// 3. Material Optimization - Use optimizeMaterial() to disable expensive features
//    - Removes envMap and reflectivity for better performance
//    - Clamps roughness/metalness to valid ranges
//
// 4. Shadow Management - Use toggleShadows() to enable/disable shadows dynamically
//    - Shadows can cost 2-3x rendering time
//    - Disable for screenshots or when not needed
//
// 5. Memory Management - Always dispose meshes when panel is destroyed
//    - Call disposeMeshes() in cleanup function
//    - Prevents memory leaks with large panels

// Performance thresholds:
// Performance thresholds for automatic optimization decisions
export const PERFORMANCE_THRESHOLDS = {
	// Switch to instanced meshes when...
	minCellsForInstancing: 10,

	// Enable LOD when...
	maxDistanceForLOD: 50, // meters

	// Shadow quality settings
	shadowMapSize: [1024, 1024], // Lower for better performance
	shadowBias: 0.001,
};

// Recommended usage patterns based on panel size
export const PERFORMANCE_GUIDELINES = {
	// For panels with < 50 cells: Individual meshes are fine
	smallPanel: "Use individual meshes (simpler raycasting)",

	// For panels with 50-200 cells: Consider instanced meshes
	mediumPanel: "Switch to instanced meshes for better performance",

	// For panels with > 200 cells: Use LOD + instancing
	largePanel: "Enable LOD system and use instanced meshes",

	// Always enable these settings:
	essentialSettings: [
		"antialias: true (for quality)",
		"shadowMap.enabled: false (if not needed)",
		"disposeMeshes() on cleanup (prevent leaks)",
	],
};
