📋 Diffuser / Abfusor / Absorber App – TODO
🧠 1. Core Domain & Math Engine
Panel Types
 QRD (1D quadratic residue diffuser)
 PRD (primitive root diffuser)
 Skyline (2D QRD)
 Slat / Binary amplitude diffuser (abfusor)
 Perforated / Helmholtz absorbers
 Porous absorber panels
Parameter Schemas
 General
 width, height, depth
 material thickness
 well width
 max depth
 QRD
 prime number (N)
 design frequency
 speed of sound (configurable)
 Skyline
 2D grid size
 Abfusor
 binary sequence / custom pattern
 Absorbers
 cavity depth
 hole size / spacing
Math Engine (pure functions)
 QRD sequence generator (mod n²)
 PRD generator
 Depth calculation
 Frequency ↔ wavelength conversion
 Skyline matrix generator
 Binary pattern generator
 Panel subdivision into cells
 Validation rules
🧱 2. Geometry Builder
Geometry Model
 Define PanelCell structure
 Generate array of cells
 Compute bounding box
 Store metadata (cuts, materials)
Construction Features
 Wall thickness
 Backing plate
 Optional QRD flaps (extended walls)
 Edge framing
 Kerf / tolerance adjustments
🎨 3. 3D Visualization (Three.js)
Scene Setup
 Camera (perspective + orthographic toggle)
 Lighting (soft shadows)
 Orbit controls
 Grid / measurement guides
Rendering
 Convert cells → meshes
 Use instanced meshes
 Materials (wood, matte, etc.)
 Toggle walls visibility
 Exploded view
Interaction
 Hover highlight
 Click → show dimensions
 Live updates on parameter changes
📐 4. 2D Views (SVG-based)
View Types
 QRD
 side view (depth profile)
 front view
 Skyline
 top view
 side slices
 Abfusor
 front pattern view
 Absorbers
 cross-section
Implementation
 Projection functions (cells → SVG)
 Dimension annotations
 Scale-aware rendering
 Layer separation (cuts, labels, guides)
📄 5. Export System
SVG Export
 Clean vector output
 Layer separation (cuts, folds, labels)
 Unit handling (mm/inches)
PDF Export
 Integrate PDF library (e.g. pdf-lib / jsPDF)
 Multi-page support
 Add title + parameters
 Add scale reference
🧩 6. Vue App Architecture
State Management
 Setup store (Pinia or reactive)
 Store panel type
 Store parameters
 Store generated geometry
Components
 PanelConfigurator.vue
 ParameterForm.vue
 ThreeViewport.vue
 SvgViewport.vue
 ExportControls.vue
Data Flow
 Inputs → Math Engine → Geometry → Views
⚙️ 7. Performance
 Memoize calculations
 Debounce inputs
 Use instanced meshes
 Lazy render 2D views
 Move heavy math to Web Workers
🧪 8. Validation & Testing
 Unit tests (math functions)
 Validate sequences
 Validate depth calculations
 Compare with reference calculators
 Handle edge cases
 low frequencies
 large primes
 invalid inputs
🛠 9. Advanced Features
Acoustic Features
 Frequency response estimation
 Scattering approximation
Build Outputs
 Cut list generator
 Material estimates
 Assembly instructions
CAD Export
 DXF export
 STL export
🎛 10. UX Enhancements
 Presets (common primes: 7, 11, 13, 17…)
 Frequency range display
 Tooltips / help text
 Aspect ratio locking
 Unit switching (mm / inches)
🔄 Suggested Build Order
 Math engine (QRD first)
 Geometry builder
 Basic SVG side view
 Simple Three.js render
 Vue UI integration
 SVG export
 PDF export
 Additional panel types
 Advanced features
⚠️ Pitfalls to Avoid
 Don’t mix math logic with rendering
 Don’t rely on Three.js for 2D export
 Handle units early
 Account for real-world material constraints
💡 Architecture Principle
 Maintain pipeline:
 Params → Algorithm → Geometry → Views (3D / 2D / Export)
