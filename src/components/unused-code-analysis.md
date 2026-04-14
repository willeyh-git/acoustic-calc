# Unused Code Analysis - Components

## Summary of Actual Issues Found

### 1. SvgViewport.vue

#### ❌ UNUSED IMPORTS:
- **`ProjectionConfig`** (line 4) - Imported but never used anywhere in the file
- **`createSvgViewForPanel`** (line 7) - Actually USED in line 43 ✓
- **`getRecommendedViewType`** (line 8) - Actually USED in line 36 ✓  
- **`getAvailableViewTypes`** (line 9) - Actually USED in line 30 ✓

#### ✅ CORRECTLY USED:
- `availableViewTypes` computed property is used in template (v-for loop)
- `currentViewType` computed property is used in template comparison
- `svgViews` computed property is used throughout component

**Issue:** Only `ProjectionConfig` import is unused. The rest are properly utilized.

---

### 2. ScaleBar.vue

#### ❌ DUPLICATE PROPS:
```typescript
const props = defineProps<{
    unit: Unit;
    length?: number; // Line 6 - Optional prop from parent
}>();

// Line 10 - Creates local constant with same name!
const length = props.length || 100;
```

**Problem:** 
- `length` is defined as an optional prop (line 6)
- Then a new constant `length` shadows it (line 10)
- This creates confusion about which one to use

#### ❌ UNUSED VARIABLE:
- **`barWidth`** (line 15) - Used in template line 21 ✓
  ```typescript
  const barWidth = length * 1; // Line 15
  ```
  Actually used in: `<div :style="{ width: \`${barWidth}px\` }">`

**Status:** `barWidth` IS used, but the multiplication by 1 is unnecessary.

---

### 3. DimensionAnnotations.vue

#### ✅ NO ISSUES FOUND
All imports and computed properties are properly used throughout the component.

---

### 4. CameraControls.vue

#### ✅ NO ISSUES FOUND  
All Vue imports (ref, watch) and type imports are actively used in the component logic.

---

### 5. SelectionTooltip.vue

#### ✅ NO ISSUES FOUND
All computed properties are properly utilized in both template and internal logic.

---

## Recommendations

### High Priority:
1. **Remove unused `ProjectionConfig` import** from SvgViewport.vue (line 4)
2. **Fix duplicate `length`** in ScaleBar.vue - either remove the prop or rename the constant

### Low Priority:
3. Remove unnecessary `* 1` multiplication in ScaleBar.vue line 15

---

## Files Requiring Changes

1. `src/components/SvgViewport.vue` - Remove unused import
2. `src/components/ScaleBar.vue` - Fix duplicate variable naming
