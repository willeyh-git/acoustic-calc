# AGENTS.md - Acoustic Calculator Development Guide

## Repository Overview

**Type:** Vue 3 + TypeScript + Vite SPA  
**Domain:** Acoustic diffuser/absorber panel calculator with math engine, geometry builders, and visualization pipeline  
**Status:** Core math & geometry complete (Step 1). Visualization/export pending.

---

## Architecture Pipeline

```
Params → Math Engine → Geometry Builders → Views (3D/2D) → Export
```

### Layer Separation Rule
- **`src/core/`**: Pure logic only (no Vue, no Three.js). Never import from here into UI layers.
- **`src/app/`, `src/features/`, `src/renderers/`**: Vue/Three layers that consume core outputs.

---

## Core Domain Structure

### Math Engine (`src/core/math/`)
Pure functions for acoustic calculations:
- `qrd.ts` - Quadratic residue diffuser sequence & depths
- `prd.ts` - Power ratio difference validation
- `skyline.ts` - 2D skyline pattern generation
- `abfusor.ts` - Binary amplitude diffuser (depthA/depthB)
- `porousAbsorber.ts` - Delany-Bazley absorption model
- `helmholtz.ts` - Resonator frequency & bandwidth

### Geometry Builders (`src/core/geometry/`)
All extend `PanelBuilder` base class:
- `QRDBuilder`, `SkylineBuilder`, `AbfusorBuilder`
- `PorousAbsorberBuilder`, `HelmholtzAbsorberBuilder`

Each builder:
1. Generates sequence via math module
2. Computes depths with constraints (maxDepth, wallThickness)
3. Creates `PanelCell[]` array with x/y positioning
4. Calculates bounding box
5. Stores metadata (diffusion range, material usage)

### Factory Pattern (`src/core/factories/createPanelBuilder.ts`)
```typescript
createPanelBuilder(params: PanelParams) → Builder instance
```
Switches on `params.type`: `"qrd" | "skyline" | "abfusor" | "porous-absorber" | "helmholtz-absorber"`

---

## Types & Schemas

### Central Type Location
All types live in `src/core/types/` and are exported from there. **Never use `any`.**

Key interfaces:
- `PanelParamsBase` - Common params (type, unit, dimensions, material)
- `QrdResult`, `SkylineResult`, `AbfusorResult`, etc. - Math output types
- `PanelGeometry` - Geometry with cells + bounding box + metadata
- `MaterialUsage`, `WasteAnalysis`, `EstimatedCost` - Cost estimation (Step 2+)

### Unit System
Default unit: **mm** (`Unit = "mm" | "cm" | "inch"`). Convert early and consistently.

---

## Development Commands

```bash
# Install dependencies
npm install

# Dev server with hot-reload
npm run dev

# Type-check (required before build)
npm run type-check  # vue-tsc --build

# Build for production
npm run build       # runs type-check + vite build

# Run tests
npm test            # vitest (watch mode)
npm run coverage    # vitest run --coverage

# Single test file
npx vitest src/tests/math/qrd.test.ts
```

### Test Prerequisites
- Tests use Vitest globals (`describe`, `it`, `expect` imported from vitest)
- Integration tests in `src/tests/integration/` test full pipeline (params → builder → geometry)
- Math unit tests verify pure functions; geometry tests verify builders

---

## Key Conventions & Gotchas

### 1. No `any` Types
Enforced by existing `AGENT.md`. All types must be defined in `src/core/types/`.

### 2. Path Aliases
Use `@/*` for imports (configured in `tsconfig.app.json`):
```typescript
import { QrdBuilder } from "@/core/geometry/QRDBuilder";
import type { PanelParams } from "@/core/types/panelTypes";
```

### 3. Builder Interface Consistency
All builders must:
- Accept `PanelParams` (or typed subset)
- Call `buildGeometry(withWalls, withFrame)` returning geometry object
- Include validation in constructor or builder methods

### 4. Construction Features (Step 2+)
When adding new features to builders:
- Add optional params to type definitions first (`src/core/types/`)
- Update all 5 builders consistently
- Test integration across all panel types
- Default values should be documented in param schemas

### 5. Math vs Geometry Separation
- **Math modules**: Pure functions, no side effects, return result objects
- **Builders**: Create geometry structures, handle constraints, validate inputs
- Never mix math logic with rendering or UI concerns

---

## Testing Strategy

### Unit Tests (`src/tests/math/`)
Test pure math functions in isolation:
```typescript
import { generateQrdSequence } from "@/core/math/qrd";
expect(generateQrdSequence(7)).toEqual([0, 1, 4, 2, 3, 6, 5]);
```

### Geometry Tests (`src/tests/geometry/`)
Test builders with realistic params:
```typescript
import { QrdBuilder } from "@/core/geometry/QRDBuilder";
const builder = new QrdBuilder(params);
const geometry = builder.buildGeometry(false, false);
expect(geometry.cells).toBeDefined();
```

### Integration Tests (`src/tests/integration/`)
Test full pipeline with construction features:
- Wall thickness impact on cell dimensions
- Backing plate effect on bounding box depth
- Frame profile calculations
- Kerf tolerance adjustments

---

## Common Mistakes to Avoid

1. **Mixing layers**: Don't import Three.js or Vue into `src/core/`
2. **Using `any`**: All types must be defined in `src/core/types/`
3. **Inconsistent builder patterns**: Follow the 5-step builder interface
4. **Unit mismatches**: Convert mm ↔ meters early; document conversions
5. **Missing validation**: Validate params before computation (use helpers)

---

## Quick Reference

### File Ownership
| Directory | Purpose | Who Touches |
|-----------|---------|-------------|
| `src/core/math/` | Pure math functions | Math/logic work only |
| `src/core/geometry/` | Geometry builders | Geometry/constraints work |
| `src/core/types/` | Type definitions | Schema changes, new types |
| `src/tests/` | Test suites | Tests for any layer |
| `src/app/`, `src/features/` | Vue components | UI/state work (Step 4+) |
| `src/renderers/` | Three.js/SVG rendering | Visualization work (Step 3+) |

### Adding New Panel Type
1. Create math module in `src/core/math/` with result type
2. Create builder in `src/core/geometry/` extending base class
3. Add params interface to `src/core/types/panelTypes.ts`
4. Update factory in `createPanelBuilder.ts`
5. Write unit + geometry tests

### Adding New Feature (e.g., wall thickness)
1. Add optional param to type definitions
2. Implement logic in all 5 builders consistently
3. Update integration tests for each builder
4. Document defaults and constraints

