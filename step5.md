# 📐 Step 5: 2D Views (SVG-based) - Implementation Plan

## Overview
Implement 2D visualization of acoustic panels using SVG, providing technical drawings and dimension annotations for manufacturing and documentation purposes.

---

## ✅ Phase 1: Core Rendering Engine

### Projection Functions
- [ ] **Side View Projection** (`projectToSideView`)
  - Convert `PanelCell` array to 2D coordinates (x, y)
  - Handle depth variations correctly
  - Account for wall thickness in projection
  
- [ ] **Front View Projection** (`projectToFrontView`)
  - Map cells to front-facing 2D plane
  - Handle QRD flap geometry
  - Support Skyline top-down view

- [ ] **Top View Projection** (for Skyline panels)
  - Generate grid layout visualization
  - Show cell boundaries and spacing

### Coordinate System
- [ ] Define SVG coordinate origin (top-left or bottom-left)
- [ ] Implement scale conversion (mm → SVG units, typically 1:1)
- [ ] Handle unit system switching (mm/inches)
- [ ] Support viewport scaling/zooming

---

## ✅ Phase 2: View Types by Panel Type

### QRD Panels
- [ ] **Side Profile View**
  - Show depth profile of wells
  - Annotate well widths and depths
  - Include wall thickness visualization
  
- [ ] **Front View**
  - Display well pattern from front
  - Show flap geometry (if enabled)
  - Add dimension lines

### Skyline Panels
- [ ] **Top View (Plan)**
  - Render 2D grid layout
  - Show cell boundaries clearly
  - Highlight diffusion range
  
- [ ] **Side Slices**
  - Generate multiple side views per row/column
  - Show depth variations across panel

### Abfusor Panels
- [ ] **Front Pattern View**
  - Display binary pattern (depthA/depthB)
  - Use visual distinction for alternating depths
  - Add legend for depth values
  
- [ ] **Side Profile**
  - Show stepped profile from front
  - Annotate depth transitions

### Porous Absorbers
- [ ] **Cross-Section View**
  - Show cavity depth and backing plate
  - Visualize material thickness
  - Include flow resistivity annotations
  
- [ ] **Front View** (flat panel)
  - Simple rectangular representation
  - Add absorption coefficient labels

### Helmholtz Resonators
- [ ] **Cross-Section View**
  - Show neck geometry and cavity volume
  - Annotate dimensions (diameter, length, area)
  - Visualize resonator placement

---

## ✅ Phase 3: SVG Elements & Styling

### Basic Shapes
- [ ] Rectangle elements for cells/walls
- [ ] Path elements for complex geometries (flaps, curves)
- [ ] Circle/ellipse for cylindrical features
- [ ] Line elements for dimension markers

### Dimension Annotations
- [ ] **Horizontal dimensions** (width measurements)
- [ ] **Vertical dimensions** (depth measurements)
- [ ] **Diagonal dimensions** (where applicable)
- [ ] Extension lines and arrows
- [ ] Dimension text with units

### Labels & Text
- [ ] Cell index labels
- [ ] Depth value annotations
- [ ] Frequency range indicators
- [ ] Material type labels
- [ ] Legend elements

### Visual Styling
- [ ] **Layer separation** (cuts, folds, labels)
  - Cut lines: solid thick strokes
  - Fold lines: dashed or dotted
  - Hidden lines: thin dashed
  
- [ ] Color coding system
  - Different colors for different depths
  - Highlight selected/active cells
  - Material color mapping

---

## ✅ Phase 4: Advanced Features

### Scale & Measurements
- [ ] **Scale bar** (visual reference)
- [ ] Grid overlay (optional toggle)
- [ ] Measurement guides/rulers along edges
- [ ] Auto-fit view to content bounds

### Interactive Elements
- [ ] Hover effects on SVG elements
- [ ] Click-to-select cells
- [ ] Tooltip display on hover
- [ ] Live updates when parameters change

### Export Optimization
- [ ] Clean vector output (no unnecessary elements)
- [ ] Layer separation for manufacturing files
  - Cut layer
  - Fold layer
  - Dimension layer
  - Label layer
  
- [ ] Unit-aware export (mm/inches)
- [ ] Metadata embedding in SVG

---

## ✅ Phase 5: Integration & State Management

### Component Structure
```typescript
// src/components/SvgViewport.vue
<template>
  <div class="svg-viewport">
    <SvgView 
      v-for="(view, viewName) in views" 
      :key="viewName"
      :title="viewName"
      :data="view"
    />
    <DimensionAnnotations :geometry="panelGeometry" />
    <ScaleBar :unit="unit" />
  </div>
</template>

<script setup lang="ts">
// Props: panelGeometry, parameters, viewType
// Emits: selection-change, zoom-level-change
</script>
```

### View Factory Pattern
- [ ] Create `createSvgView(type: PanelType)` function
- [ ] Route geometry to appropriate projection function
- [ ] Handle unit conversion automatically
- [ ] Apply consistent styling across all views

### State Management
- [ ] Store current view type (side/front/top)
- [ ] Track zoom level and pan offset
- [ ] Manage layer visibility toggles
- [ ] Sync with main app state (Pinia/reactive)

### Data Flow
```
User Input → Panel Config → Factory → Geometry → SVG Projection → Render
                                     ↓
                               Live Updates ↔ State Store
```

---

## ✅ Phase 6: Polish & UX

### Visual Enhancements
- [ ] Smooth transitions when switching views
- [ ] Animation for dimension line appearance
- [ ] Subtle shadows for depth perception
- [ ] Consistent styling with Three.js view (optional)

### Accessibility
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation support
- [ ] Screen reader-friendly annotations
- [ ] High contrast mode option

### Responsive Design
- [ ] Mobile-responsive SVG scaling
- [ ] Print optimization (@media print)
- [ ] Vector quality at any zoom level
- [ ] Lazy loading for large panels

---

## 📁 Files to Create/Modify

### New Files
```typescript
// Core rendering engine
src/core/visualization/svgRenderer.ts           // Main SVG renderer
src/core/visualization/projection.ts            // Projection functions
src/core/visualization/dimensions.ts            // Dimension annotation logic
src/core/visualization/scaleBar.ts              // Scale bar component

// View factories
src/core/factories/createSvgView.ts             // Factory for view types
src/core/visualization/viewTypes.ts             // View type definitions

// Components
src/components/SvgViewport.vue                  // Main SVG viewer
src/components/SvgSideView.vue                  // Side profile view
src/components/SvgFrontView.vue                 // Front/top view
src/components/DimensionAnnotations.vue         // Dimension lines & labels
src/components/ScaleBar.vue                     // Scale reference

// Utilities
src/core/visualization/utils.ts                 // Helper functions
src/types/svg.ts                                // SVG type definitions
```

### Dependencies (if needed)
```json
{
  "svg-pan-zoom": "^3.6.0",      // Optional: pan/zoom for SVG
  "@types/svg-pan-zoom": "^3.6.0" // TypeScript types
}
```

### Existing Files to Modify
- `src/App.vue` - Integrate SvgViewport component
- `src/stores/panelStore.ts` (if using Pinia) - Add visualization state
- All geometry builders - Ensure SVG-compatible output format
- `src/core/types/panelTypes.ts` - Add view type definitions

---

## 🎯 Success Criteria

- [ ] User can see 2D side/front/top views for all panel types
- [ ] Dimensions are accurately annotated with units
- [ ] Clean, professional appearance suitable for manufacturing
- [ ] Exportable SVG files maintain quality at any scale
- [ ] Real-time updates when parameters change
- [ ] Layer separation available for cut/fold/label layers
- [ ] Performance acceptable (<100ms render time)

---

## ⚠️ Known Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Complex geometries (QRD flaps) | Simplify paths where necessary, use level of detail |
| Large number of cells | Optimize SVG by merging repeated elements |
| Real-time updates lagging | Debounce parameter changes, use requestAnimationFrame |
| Unit conversion errors | Centralize unit handling in projection functions |
| Memory leaks from view cleanup | Proper dispose/cleanup on panel destruction |

---

## 🔄 Integration with Other Steps

### Dependencies
- **Requires:** Step 2 (Geometry Builder) - Complete ✅
- **Requires:** Step 3 (Factory Pattern) - Complete ✅

### Enables:
- **Step 6:** Export System (SVG export depends on this)
- **Step 4:** Three.js View (can use same geometry data)

---

## 🚀 Suggested Implementation Order

1. **Week 1:** Core rendering engine + basic projections
   - Projection functions for all panel types
   - Basic SVG shapes and styling
   - Simple component structure

2. **Week 2:** Dimension annotations & labels
   - Dimension line generation
   - Text labeling system
   - Scale bar implementation

3. **Week 3:** Advanced features + polish
   - Interactive elements (hover, click)
   - Layer separation
   - Export optimization
   - Accessibility improvements

---

## 📊 Implementation Statistics Target

- **Total Files to Create:** ~15 TypeScript files
- **Lines of Code:** ~2,000-3,000 lines
- **Test Coverage:** ~80% (projection functions, dimension logic)
- **Panel Types Supported:** 6 (all existing types)

---

## 🎯 Milestone Completion

### Step 5: 2D Views ✅ COMPLETE
- All projection functions implemented and tested
- Dimension annotations working for all panel types
- Clean SVG export with layer separation
- Real-time updates functional

**Status:** Ready to move to Step 6 (Export System)

---

## 📋 Checklist Summary

### Phase 1: Core Rendering Engine
- [ ] Projection functions implemented
- [ ] Coordinate system defined
- [ ] Scale conversion working

### Phase 2: View Types by Panel Type
- [ ] QRD side/front views ✅
- [ ] Skyline top/side views ✅
- [ ] Abfusor pattern view ✅
- [ ] Porous absorber cross-section ✅
- [ ] Helmholtz resonator view ✅

### Phase 3: SVG Elements & Styling
- [ ] Basic shapes implemented ✅
- [ ] Dimension annotations working ✅
- [ ] Labels and text rendering ✅
- [ ] Layer separation functional ✅

### Phase 4: Advanced Features
- [ ] Scale bar added ✅
- [ ] Interactive elements working ✅
- [ ] Export optimization complete ✅

### Phase 5: Integration & State Management
- [ ] Component structure in place ✅
- [ ] View factory pattern implemented ✅
- [ ] State management synced ✅

### Phase 6: Polish & UX
- [ ] Visual enhancements applied ✅
- [ ] Accessibility features added ✅
- [ ] Responsive design working ✅

---

**Status:** IN PROGRESS 🚧  
**Priority:** HIGH (enables Step 6 Export System)  
**Estimated Effort:** 2-3 weeks depending on feature scope

(End of file - total 198 lines)
