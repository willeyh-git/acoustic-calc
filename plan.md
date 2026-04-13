# 📋 Diffuser / Abfusor / Absorber App – TODO

## ✅ COMPLETED: Core Domain & Math Engine (Phase 1)

### Panel Types - IMPLEMENTED
- ✅ **QRD** (1D quadratic residue diffuser) - `src/core/math/qrd.ts`
- ✅ **PRD** (primitive root diffuser) - `src/core/math/prd.ts`
- ✅ **Skyline** (2D QRD) - `src/core/math/skyline.ts`
- ⚠️ **Slat / Binary amplitude diffuser** (abfusor) - IMPLEMENTED but not integrated

### Parameter Schemas - COMPLETE
- ✅ General (width, height, depth, material thickness)
- ✅ Well width, max depth
- ✅ QRD (prime number N, design frequency, speed of sound)
- ✅ Skyline (2D grid size)
- ⚠️ Abfusor (binary sequence / custom pattern) - Schema ready
- ⚠️ Absorbers (cavity depth, hole size / spacing) - Schema ready

### Math Engine (pure functions) - PARTIALLY COMPLETE
- ✅ QRD sequence generator (`generateQrdSequence`)
- ✅ PRD generator (`computePRDFromQrd`, `validatePRDResults`)
- ✅ Depth calculation for QRD/Skyline
- ✅ Frequency ↔ wavelength conversion
- ✅ Skyline matrix generator (`generateSkylineSequence`)
- ⚠️ Binary pattern generator (abfusor) - Implemented but not wired
- ⚠️ Panel subdivision into cells - Partially implemented in builders
- ✅ Validation rules (helpers, math modules)

---

## 🧱 2. Geometry Builder - PARTIALLY DONE

### Geometry Model - COMPLETE
- ✅ Define `PanelCell` structure (`types.ts`)
- ✅ Generate array of cells (QRDBuilder, SkylineBuilder)
- ✅ Compute bounding box
- ✅ Store metadata (cuts, materials)

### Construction Features - ⚠️ NOT STARTED
- ❌ Wall thickness
- ❌ Backing plate
- ❌ Optional QRD flaps (extended walls)
- ❌ Edge framing
- ❌ Kerf / tolerance adjustments

---

## 🎨 3. 3D Visualization (Three.js) - ⚠️ NOT STARTED

### Scene Setup
- ❌ Camera (perspective + orthographic toggle)
- ❌ Lighting (soft shadows)
- ❌ Orbit controls
- ❌ Grid / measurement guides

### Rendering
- ❌ Convert cells → meshes
- ❌ Use instanced meshes
- ❌ Materials (wood, matte, etc.)
- ❌ Toggle walls visibility
- ❌ Exploded view

### Interaction
- ❌ Hover highlight
- ❌ Click → show dimensions
- ❌ Live updates on parameter changes

---

## 📐 4. 2D Views (SVG-based) - ⚠️ NOT STARTED

### View Types
- ❌ QRD: side view (depth profile), front view
- ❌ Skyline: top view, side slices
- ❌ Abfusor: front pattern view
- ❌ Absorbers: cross-section

### Implementation
- ❌ Projection functions (cells → SVG)
- ❌ Dimension annotations
- ❌ Scale-aware rendering
- ❌ Layer separation (cuts, labels, guides)

---

## 📄 5. Export System - ⚠️ NOT STARTED

### SVG Export
- ❌ Clean vector output
- ❌ Layer separation (cuts, folds, labels)
- ❌ Unit handling (mm/inches)

### PDF Export
- ❌ Integrate PDF library (e.g. pdf-lib / jsPDF)
- ❌ Multi-page support
- ❌ Add title + parameters
- ❌ Add scale reference

---

## 🧩 6. Vue App Architecture - ⚠️ MINIMAL SETUP

### State Management
- ❌ Setup store (Pinia or reactive)
- ❌ Store panel type
- ❌ Store parameters
- ❌ Store generated geometry

### Components
- ❌ PanelConfigurator.vue
- ❌ ParameterForm.vue
- ❌ ThreeViewport.vue
- ❌ SvgViewport.vue
- ❌ ExportControls.vue

### Data Flow
- ⚠️ Partially wired: Inputs → Math Engine → Geometry → Views (factory pattern exists)

---

## ⚙️ 7. Performance - ⚠️ NOT STARTED
- ❌ Memoize calculations
- ❌ Debounce inputs
- ❌ Use instanced meshes
- ❌ Lazy render 2D views
- ❌ Move heavy math to Web Workers

---

## 🧪 8. Validation & Testing - ⚠️ PARTIAL
- ✅ Unit tests (math functions) - Some validation exists
- ⚠️ Validate sequences - Partially implemented
- ⚠️ Validate depth calculations - Partially implemented
- ❌ Compare with reference calculators
- ❌ Handle edge cases (low frequencies, large primes, invalid inputs)

---

## 🛠 9. Advanced Features - ⚠️ NOT STARTED

### Acoustic Features
- ❌ Frequency response estimation
- ❌ Scattering approximation

### Build Outputs
- ❌ Cut list generator
- ❌ Material estimates
- ❌ Assembly instructions

### CAD Export
- ❌ DXF export
- ❌ STL export

---

## 🎛 10. UX Enhancements - ⚠️ NOT STARTED
- ❌ Presets (common primes: 7, 11, 13, 17…)
- ❌ Frequency range display
- ❌ Tooltips / help text
- ❌ Aspect ratio locking
- ❌ Unit switching (mm / inches)

---

## 🔄 Suggested Build Order - UPDATED

### ✅ COMPLETED:
1. Math engine (QRD, PRD, Skyline) ✓
2. Geometry builder for QRD & Skyline ✓
3. Parameter schemas ✓

### ⚠️ PENDING:
4. Abfusor math integration
5. Porous/Helmholtz absorber math
6. Basic SVG side view
7. Simple Three.js render
8. Vue UI integration (forms, state)
9. SVG export
10. PDF export
11. Additional panel types
12. Advanced features

---

## ⚠️ Pitfalls to Avoid
- Don't mix math logic with rendering
- Don't rely on Three.js for 2D export
- Handle units early
- Account for real-world material constraints

---

## 💡 Architecture Principle
Maintain pipeline: **Params → Algorithm → Geometry → Views (3D / 2D / Export)**

### Current Status Summary
| Section | Progress | Key Files |
|---------|----------|-----------|
| Math Engine | ~80% | `qrd.ts`, `prd.ts`, `skyline.ts`, `abfusor.ts` |
| Geometry Builder | ~60% | `QRDBuilder.ts`, `SkylineBuilder.ts` |
| Types & Schemas | 100% | `types.ts`, `panelTypes.ts` |
| Vue App | ~5% | `App.vue` (empty) |
| 3D/2D Views | 0% | - |
| Export System | 0% | - |

### Next Priority: Complete Abfusor Integration & Add Absorber Math
