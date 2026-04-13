# Step 1: Complete Core Domain & Math Engine

## Status Overview

The first major item from plan.md needs completion. Here's what exists vs what's missing.

---

## ✅ Already Implemented

### Panel Types (3/6)
- [x] **QRD** - Quadratic Residue Diffuser (1D)
  - `src/core/math/qrd.ts`
  - Sequence generation: `(n * n) % prime`
  - Depth calculation based on wavelength
  
- [x] **PRD** - Power Ratio Difference  
  - `src/core/math/prd.ts`
  - Calculates power ratio distribution across depths
  - Validation included

- [x] **Skyline** - 2D QRD Pattern
  - `src/core/math/skyline.ts`
  - Skyline matrix generator with row offsets
  - Depth computation for 2D grid

### Parameter Schemas (Partial)
- [x] General dimensions (`width`, `height`, `depth`)
- [x] Material thickness, well width, max depth
- [x] QRD: prime number N, design frequency, speed of sound
- [x] Skyline: 2D grid size
- [ ] Abfusor: binary sequence / custom pattern (defined but no math)
- [ ] Absorbers: cavity depth, hole size/spacing (defined but no math)

### Math Engine Functions
- [x] QRD sequence generator (`generateQrdSequence`)
- [x] PRD calculation (`computePRDFromQrd`, `validatePRDResults`)
- [x] Depth calculations for QRD and Skyline
- [x] Frequency ↔ wavelength conversion
- [x] Comprehensive validation rules (`src/core/math/validation.ts`)

### Utilities & Helpers
- [x] `DEFAULT_SPEED_OF_SOUND` = 343 m/s
- [x] `computeDiffusionRange()` 
- [x] `isPrime()` utility
- [x] Parameter validation helpers in `helpers.ts`

---

## ❌ Missing Implementations (Priority Order)

### 1. Abfusor Math Engine 🔴 HIGH PRIORITY
**File:** `src/core/math/abfusor.ts` (currently empty)

**Required Functions:**
```typescript
// Generate binary amplitude diffuser pattern
function generateAbfusorPattern(
  width: number, 
  height: number,
  cellSize: number,
  sequenceLength?: number
): number[][];

// Calculate depths for A/B alternating wells
function computeAbfusorDepths(
  pattern: number[][],
  wavelength: number,
  depthA: number,
  depthB: number
): number[][];

// Validate binary pattern (should be 0/1 or similar)
function validateAbfusorPattern(pattern: any[]): string[];

// Main computation function
export function computeAbfusor(
  width: number,
  height: number,
  cellSize: number,
  depthA: number,
  depthB: number,
  designFrequency: number,
  speedOfSound?: number
): AbfusorResult;
```

**Interface:**
```typescript
export interface AbfusorResult {
  pattern: number[][];
  depths: number[][];
  wavelength: number;
  diffusion: DiffusionRange;
}
```

---

### 2. Porous Absorber Math 🔴 HIGH PRIORITY  
**File:** `src/core/math/porousAbsorber.ts` (needs creation)

**Required Functions:**
```typescript
// Calculate absorption coefficient based on porosity and thickness
function computeAbsorptionCoefficient(
  porosity: number,
  flowResistivity: number,
  frequency: number,
  thickness: number
): number;

// Calculate resonant frequencies for porous layer
function computePorousResonances(
  thickness: number,
  speedOfSound: number,
  density: number
): number[];

// Main computation function
export function computePorousAbsorber(
  width: number,
  height: number,
  depth: number,
  porosity?: number,
  flowResistivity?: number,
  designFrequency?: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND
): PorousResult;
```

**Interface:**
```typescript
export interface PorousResult {
  absorptionCoefficients: number[]; // per frequency band
  resonantFrequencies: number[];
  wavelength: number;
}
```

---

### 3. Helmholtz Resonator Math 🔴 HIGH PRIORITY
**File:** `src/core/math/helmholtz.ts` (needs creation)

**Required Functions:**
```typescript
// Calculate resonant frequency of Helmholtz cavity
function computeHelmholtzFrequency(
  holeArea: number,      // total hole area
  holePerimeter: number, // affects edge correction
  neckLength: number,    // effective length with end corrections
  cavityVolume: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND
): number;

// Calculate absorption bandwidth (Q factor)
function computeHelmholtzBandwidth(
  frequency: number,
  holeArea: number,
  neckLength: number,
  cavityVolume: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND
): number; // Hz bandwidth at -3dB

// Main computation function  
export function computeHelmholtzAbsorber(
  width: number,
  height: number,
  cavityDepth: number,
  holeDiameter: number,
  holeSpacing: number,
  designFrequency?: number,
  speedOfSound = DEFAULT_SPEED_OF_SOUND
): HelmholtzResult;
```

**Interface:**
```typescript
export interface HelmholtzResult {
  resonantFrequency: number;
  bandwidth: number; // Hz
  absorptionCoefficient: number; // at resonance
  wavelength: number;
}
```

---

### 4. Binary Pattern Generators 🟡 MEDIUM PRIORITY

**File:** `src/core/math/patternGenerators.ts` (needs creation)

**Required Functions:**
```typescript
// Generate binary sequence for abfusor/skyline variants
function generateBinarySequence(
  length: number,
  seed?: number,
  patternType?: 'random' | 'alternating' | 'gradient'
): number[];

// Generate custom pattern from user input
function validateCustomPattern(pattern: any[]): string[];

// Convert binary to depth values (A/B alternating)
function convertBinaryToDepths(
  binary: number[],
  depthA: number,
  depthB: number
): number[];
```

---

### 5. Panel Cell Subdivision 🟡 MEDIUM PRIORITY

**File:** `src/core/math/cellSubdivision.ts` (needs creation)

**Required Functions:**
```typescript
// Subdivide panel into acoustic cells based on type
function subdividePanel(
  params: PanelParams,
  cellSize?: number
): PanelCell[];

// Calculate cell positions for QRD/Skyline
function calculateQRDCells(
  sequence: Sequence1D | Sequence2D,
  wellWidth: number,
  panelDimensions: Dimensions
): PanelCell[];

// Calculate cell positions for Abfusor
function calculateAbfusorCells(
  pattern: number[][],
  cellSize: number,
  panelDimensions: Dimensions
): PanelCell[];
```

---

## 📋 Implementation Checklist

### Phase 1: Abfusor (Priority 1)
- [ ] Create `src/core/math/abfusor.ts` with all functions
- [ ] Define `AbfusorResult` interface  
- [ ] Add validation for binary patterns
- [ ] Test with sample patterns
- [ ] Update types if needed

### Phase 2: Porous Absorber (Priority 1)
- [ ] Create `src/core/math/porousAbsorber.ts`
- [ ] Implement absorption coefficient calculation
- [ ] Add resonant frequency computation
- [ ] Define `PorousResult` interface
- [ ] Test with typical parameters

### Phase 3: Helmholtz Resonator (Priority 1)
- [ ] Create `src/core/math/helmholtz.ts`
- [ ] Implement Helmholtz frequency formula
- [ ] Add bandwidth/Q factor calculation
- [ ] Define `HelmholtzResult` interface  
- [ ] Test with sample cavities

### Phase 4: Pattern Generators (Priority 2)
- [ ] Create `src/core/math/patternGenerators.ts`
- [ ] Implement binary sequence generators
- [ ] Add custom pattern validation
- [ ] Export utility functions

### Phase 5: Cell Subdivision (Priority 2)
- [ ] Create `src/core/math/cellSubdivision.ts`
- [ ] Implement panel subdivision logic
- [ ] Calculate positions for each panel type
- [ ] Integrate with geometry builders

---

## 🔗 Dependencies & Integration Points

### Files to Update After Implementation:
1. **`src/core/types/panelTypes.ts`** - Add result interfaces if needed
2. **`src/core/factories/createPanelBuilder.ts`** - Add abfusor/absorber builders
3. **`src/core/geometry/panelBuilder.ts`** - Support new panel types
4. **`src/App.vue` / Vue components** - UI for new panel types

### Existing Files to Reference:
- `src/core/helpers.ts` - Use existing utilities (speed of sound, diffusion range)
- `src/core/math/validation.ts` - Extend validation functions
- `src/core/types/types.ts` - Add new result interfaces

---

## 🧪 Testing Requirements

For each implementation:
1. **Unit tests** for individual math functions
2. **Edge case handling**: invalid inputs, boundary conditions
3. **Integration test** with geometry builders
4. **Validation test** ensuring error messages are clear

### Test Cases to Include:
- QRD: prime = 7, 11, 13 (common values)
- Skyline: grid sizes 5, 7, 11
- Abfusor: various binary patterns
- Porous: different porosities and thicknesses
- Helmholtz: various cavity volumes and neck dimensions

---

## 📝 Notes & References

### Acoustic Formulas Needed:

**Helmholtz Resonator:**
```
f = (c / 2π) * √(A / (V * L))
```
Where:
- c = speed of sound
- A = hole area
- V = cavity volume  
- L = effective neck length (includes end corrections)

**Porous Absorption:**
Use Delany-Babarko model or similar for flow resistivity → absorption coefficient conversion.

**Abfusor Pattern:**
Binary amplitude diffuser uses alternating depths based on binary sequence:
- 0 → depth A
- 1 → depth B

---

## 🚀 Next Steps

1. Start with **Abfusor math** (most critical missing piece)
2. Implement one panel type at a time
3. Test thoroughly before moving to next
4. Update documentation as you go
