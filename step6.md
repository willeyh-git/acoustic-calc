# 📦 Step 6: Export System - Implementation Plan

## Overview
Implement comprehensive export functionality for acoustic panel designs, enabling users to download manufacturing-ready files (SVG, DXF), technical documentation (PDF reports), and material cost estimates. This step transforms the visualization pipeline into a production-ready tool.

---

## ✅ Phase 1: Core Export Engine

### SVG Export Module (`export/svgExporter.ts`)
- [ ] **Basic SVG Generation**
  - Convert `PanelGeometry` to complete SVG string
  - Include all views (side, front, top) as separate layers
  - Embed metadata (panel type, dimensions, date created)
  
- [ ] **Layer Separation**
  - Cut layer: solid lines for material cutting paths
  - Fold layer: dashed/dotted lines for fold indicators
  - Dimension layer: measurement annotations
  - Label layer: text and legends
  
- [ ] **Unit-Aware Export**
  - Automatic mm ↔ inch conversion in exported file
  - Preserve unit information in SVG metadata
  - Scale-independent rendering (1:1 or user-defined)

### DXF Export Module (`export/dxfExporter.ts`)
- [ ] **DXF Header Generation**
  - Set proper units and layer definitions
  - Include custom properties for acoustic parameters
  
- [ ] **Geometry Conversion**
  - Convert `PanelCell` array to DXF entities (LINES, POLYLINES)
  - Map SVG paths to DXF splines where needed
  - Preserve wall thickness in geometry
  
- [ ] **Layer Management**
  - Create separate DXF layers for each view type
  - Apply layer properties (color, linetype, linewidth)
  - Include material-specific layers

### PDF Report Module (`export/pdfReportGenerator.ts`)
- [ ] **Technical Specification Sheet**
  - Panel overview (type, dimensions, total cells)
  - Frequency response summary (diffusion/absorption range)
  - Material requirements table
  
- [ ] **Visual Inclusion**
  - Embed SVG views as high-quality images
  - Include dimension annotations from SVG layer
  - Add panel type-specific diagrams
  
- [ ] **Acoustic Performance Data**
  - Diffusion coefficient summary
  - Absorption coefficients (if porous/Helmholtz)
  - Resonance frequencies (for Helmholtz panels)

---

## ✅ Phase 2: Material & Cost Estimation

### Material Calculator (`export/materialCalculator.ts`)
- [ ] **Material Area Calculation**
  - Calculate total surface area per panel type
  - Account for waste/kerf tolerance (default 5%)
  - Include backing plate material if applicable
  
- [ ] **Volume Calculations**
  - Total material volume (for foam, wood, etc.)
  - Air cavity volumes (absorbers/resonators)
  - Wall thickness material usage
  
- [ ] **Material Type Support**
  ```typescript
  interface MaterialSpec {
    type: 'wood' | 'foam' | 'fabric' | 'metal' | 'acrylic';
    density: number; // kg/m³
    costPerUnit: number; // $/m² or $/m³
    wasteFactor: number; // default 0.05 (5%)
  }
  ```

### Cost Estimator (`export/costEstimator.ts`)
- [ ] **Direct Material Costs**
  - Calculate cost based on material specs
  - Support multiple material types per panel
  - Include waste factor in total
  
- [ ] **Labor Estimates**
  - Cutting time estimation (based on cell count)
  - Assembly time calculation
  - Finishing time (fabrication, mounting)
  
- [ ] **Hardware Requirements**
  - Mounting hardware (screws, brackets)
  - Edge trim materials
  - Cable management components

### Bill of Materials (`export/bomGenerator.ts`)
- [ ] **BOM Structure**
  ```typescript
  interface BillOfMaterials {
    item: string;
    quantity: number;
    unit: 'm²' | 'm³' | 'pcs';
    materialType: string;
    costPerUnit: number;
    totalCost: number;
    notes?: string;
  }
  ```

- [ ] **Categorized Items**
  - Primary materials (wood, foam)
  - Secondary materials (fabric, trim)
  - Hardware/fasteners
  - Tools/equipment needed
  
- [ ] **Export Formats**
  - CSV for spreadsheet import
  - JSON for programmatic use
  - PDF summary report

---

## ✅ Phase 3: Export UI Components

### Export Dialog (`components/ExportDialog.vue`)
```vue
<template>
  <div class="export-dialog">
    <!-- Export Type Selection -->
    <ExportTypeSelector v-model="selectedType" />
    
    <!-- Format Options -->
    <FormatOptions :availableFormats="formats" v-model="format" />
    
    <!-- Material Settings -->
    <MaterialSettings v-if="needsMaterials" v-model="materialSpecs" />
    
    <!-- Cost Preview -->
    <CostPreview v-if="showCost" :estimate="costEstimate" />
    
    <!-- Export Actions -->
    <ExportActions @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
// Props: panelGeometry, parameters
// Emits: export-complete
</script>
```

### Format Selector (`components/FormatSelector.vue`)
- [ ] **Available Formats**
  - SVG (Scalable Vector Graphics)
  - DXF (AutoCAD compatible)
  - PDF (Technical Report)
  - JSON (Data export)
  
- [ ] **Preview Mode**
  - Show file size estimate before download
  - Display included layers/views
  - Warn about format limitations

### Material Configuration Panel (`components/MaterialConfig.vue`)
```vue
<template>
  <div class="material-config">
    <!-- Primary Material -->
    <MaterialSelect 
      v-model="primaryMaterial" 
      :availableMaterials="materials"
    />
    
    <!-- Secondary Materials (optional) -->
    <MultiMaterialSelect 
      v-if="hasSecondary"
      v-model="secondaryMaterials"
    />
    
    <!-- Waste Settings -->
    <WasteSettings v-model="wasteFactor" />
  </div>
</template>

<script setup lang="ts">
// Props: panelGeometry, defaultMaterialSpecs
// Emits: material-change
</script>
```

### Cost Preview Component (`components/CostPreview.vue`)
- [ ] **Real-time Updates**
  - Live cost calculation as parameters change
  - Breakdown by material category
  - Total estimated cost display
  
- [ ] **Cost Controls**
  - Toggle labor costs on/off
  - Adjust waste factor slider
  - Update material prices (if connected to database)

---

## ✅ Phase 4: Export Formats & Specifications

### SVG Format Details
```typescript
interface SvgExportOptions {
  includeLayers: 'all' | 'cut' | 'fold' | 'dimension' | 'label';
  viewBox: boolean; // Auto-calculate or manual
  units: 'mm' | 'inch';
  metadata: {
    panelType: string;
    dimensions: { width: number; height: number };
    cellCount: number;
    createdAt: Date;
    version: string;
  };
}

// Output structure
const svgString = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" ...>
  <defs>...</defs>
  <!-- Cut Layer -->
  <g id="cut-layer">...</g>
  <!-- Fold Layer -->
  <g id="fold-layer">...</g>
  <!-- Dimension Layer -->
  <g id="dimension-layer">...</g>
</svg>`;
```

### DXF Format Details
```typescript
interface DxfExportOptions {
  layers: {
    name: string;
    color: number; // ACI code
    linetype: 'CONTINUOUS' | 'DASHED' | 'DOTTED';
    linewidth: number;
  }[];
  units: 'MM' | 'INCHES';
  includeMetadata: boolean;
}

// Layer mapping
const layers = [
  { name: 'CUT', color: 1, linetype: 'CONTINUOUS' },
  { name: 'FOLD', color: 2, linetype: 'DASHED' },
  { name: 'DIMENSION', color: 3, linetype: 'DOTTED' },
  { name: 'LABEL', color: 4, linetype: 'CONTINUOUS' },
];
```

### PDF Report Structure
```typescript
interface PdfReportOptions {
  includeSections: {
    technicalSpecs?: boolean;
    visualViews?: boolean;
    materialList?: boolean;
    costEstimate?: boolean;
    acousticData?: boolean;
  };
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
}

// Report sections
const reportSections = [
  { title: 'Panel Specifications', content: ... },
  { title: 'Visual Views', content: svgViews },
  { title: 'Material Requirements', content: materialList },
  { title: 'Cost Estimate', content: costEstimate },
];
```

---

## ✅ Phase 5: Advanced Export Features

### Batch Export (`export/batchExporter.ts`)
- [ ] **Multiple Panel Types**
  - Export entire design library at once
  - Preserve individual file naming conventions
  
- [ ] **Format Variations**
  - Same geometry in multiple formats (SVG + DXF)
  - Different unit systems for same panel
  
- [ ] **Directory Structure**
  ```
  export/
    ├── qrd-panel-v1/
    │   ├── cut.svg
    │   ├── fold.svg
    │   ├── dimensions.svg
    │   └── report.pdf
    └── skyline-panel-v2/
        ├── layout.dxf
        └── specs.pdf
  ```

### Template System (`export/templates.ts`)
- [ ] **Predefined Templates**
  - Manufacturing template (optimized for cutting)
  - Documentation template (for client reports)
  - Research template (with acoustic data tables)
  
- [ ] **Custom Templates**
  - User-defined layer configurations
  - Custom styling presets
  - Branded output (logos, colors)

### Validation & Quality Checks (`export/validator.ts`)
- [ ] **Pre-export Validation**
  - Check geometry integrity
  - Verify all cells have valid dimensions
  - Ensure no overlapping elements
  
- [ ] **Post-export Verification**
  - Validate SVG well-formedness
  - Check DXF layer consistency
  - Confirm PDF rendering quality

### Compression & Optimization (`export/optimizer.ts`)
- [ ] **SVG Optimization**
  - Remove unused elements
  - Merge repeated paths
  - Optimize text rendering
  
- [ ] **File Size Management**
  - Balance quality vs. file size
  - Progressive download for large files
  - WebP/PNG fallbacks for PDF images

---

## ✅ Phase 6: Integration & State Management

### Export Service (`services/exportService.ts`)
```typescript
interface ExportRequest {
  geometry: PanelGeometry;
  parameters: PanelParams;
  options: ExportOptions;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  format: 'svg' | 'dxf' | 'pdf' | 'json';
  fileSize: number;
  metadata: ExportMetadata;
}

class ExportService {
  async exportSvg(request: ExportRequest): Promise<ExportResult>;
  async exportDxf(request: ExportRequest): Promise<ExportResult>;
  async generateReport(request: ExportRequest): Promise<ExportResult>;
  async calculateCosts(geometry: PanelGeometry, materials?: MaterialSpec[]): Promise<MaterialEstimate>;
}
```

### Pinia Store Integration (`stores/exportStore.ts`)
```typescript
interface ExportState {
  selectedFormat: string;
  exportOptions: Partial<ExportOptions>;
  costEstimate: CostEstimate | null;
  isExporting: boolean;
  lastExport: {
    format: string;
    timestamp: Date;
    success: boolean;
  } | null;
}

export const useExportStore = defineStore('export', {
  state: () => ({ ... }),
  actions: {
    setFormat(format: string),
    updateOptions(options: Partial<ExportOptions>),
    calculateCosts(geometry: PanelGeometry, materials?: MaterialSpec[]): Promise<void>,
    exportFile(type: 'svg' | 'dxf' | 'pdf'): Promise<boolean>,
  }
});
```

### Main App Integration (`App.vue`)
```vue
<template>
  <div class="app">
    <!-- Existing UI -->
    
    <!-- Export Dialog (conditional) -->
    <ExportDialog 
      v-if="showExport"
      :panelGeometry="currentGeometry"
      :parameters="currentParams"
      @export-complete="handleExportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { useExportStore } from '@/stores/exportStore';
const exportStore = useExportStore();
</script>
```

---

## ✅ Phase 7: Testing & Quality Assurance

### Unit Tests (`tests/export/`)
- [ ] **SVG Export Tests**
  ```typescript
  describe('svgExporter', () => {
    it('generates valid SVG for QRD panel', async () => {
      const result = await exportSvg({ geometry, options });
      expect(result).toContain('<svg');
      expect(result).toContain('cut-layer');
    });
    
    it('includes correct metadata', async () => {
      const result = await exportSvg({ geometry, options });
      expect(result).toMatch(/panel-type="qrd"/);
    });
  });
  ```

- [ ] **DXF Export Tests**
  - Verify layer structure
  - Check entity types and coordinates
  
- [ ] **Cost Calculation Tests**
  - Validate material quantities
  - Test waste factor application
  - Verify cost calculations

### Integration Tests (`tests/integration/export/`)
- [ ] **Full Pipeline Tests**
  ```typescript
  describe('Export Integration', () => {
    it('exports complete QRD panel design', async () => {
      // Create geometry from params
      const builder = createPanelBuilder({ type: 'qrd', ...params });
      const geometry = builder.buildGeometry(true, true);
      
      // Export to SVG
      const result = await exportService.exportSvg({
        geometry,
        parameters: params,
        options: { includeLayers: 'all' }
      });
      
      expect(result.success).toBe(true);
      expect(result.fileSize).toBeGreaterThan(0);
    });
  });
  ```

### Manual Testing Checklist
- [ ] Export all panel types to SVG
- [ ] Verify DXF compatibility with AutoCAD
- [ ] Check PDF report formatting
- [ ] Test batch export functionality
- [ ] Validate cost calculations against manual estimates
- [ ] Test large panel exports (100+ cells)

---

## 📁 Files to Create/Modify

### New Files Structure
```typescript
// Export Core Engine
src/export/svgExporter.ts                    // SVG generation
src/export/dxfExporter.ts                    // DXF generation
src/export/pdfReportGenerator.ts             // PDF reports
src/export/materialCalculator.ts             // Material calculations
src/export/costEstimator.ts                  // Cost estimation
src/export/bomGenerator.ts                   // Bill of materials

// Export Options & Templates
src/export/options.ts                        // Export configuration types
src/export/templates.ts                      // Predefined templates
src/export/validator.ts                      // Validation logic
src/export/optimizer.ts                      // File optimization

// Services & Stores
src/services/exportService.ts                // Main export service
src/stores/exportStore.ts                    // Pinia store for export state

// UI Components
src/components/ExportDialog.vue              // Main export dialog
src/components/FormatSelector.vue            // Format selection
src/components/MaterialConfig.vue            // Material settings
src/components/CostPreview.vue               // Cost breakdown preview
src/components/BomTable.vue                  // Bill of materials display

// Types & Interfaces
src/types/export.ts                          // All export-related types
```

### Dependencies (if needed)
```json
{
  "jszip": "^3.10.1",              // ZIP file generation for batch exports
  "pdfkit": "^0.14.0",             // PDF generation (server-side or client)
  "@types/jszip": "^3.10.1",       // TypeScript types
  "dxf-writer": "^1.2.0"          // DXF file generation
}
```

### Existing Files to Modify
- `src/App.vue` - Add export dialog trigger
- `src/components/PanelPreview.vue` - Add export button
- `src/stores/panelStore.ts` - Export geometry state
- `src/core/types/panelTypes.ts` - Add material spec types

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] User can export to SVG with layer separation ✅
- [ ] DXF files open in AutoCAD without errors ✅
- [ ] PDF reports include all technical specifications ✅
- [ ] Cost estimates are accurate within 5% of manual calculation ✅
- [ ] Batch export works for multiple panels ✅

### Performance Requirements
- [ ] SVG export < 1 second for panels with < 200 cells
- [ ] DXF export < 2 seconds for complex geometries
- [ ] PDF report generation < 3 seconds
- [ ] Cost calculation instant (< 100ms)

### Quality Requirements
- [ ] Exported files maintain visual fidelity
- [ ] All layers render correctly in target applications
- [ ] Metadata is properly embedded and readable
- [ ] File sizes are optimized without quality loss

---

## ⚠️ Known Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **PDF generation on client** | Use pdfkit with worker thread or server-side rendering |
| **DXF compatibility** | Test with multiple CAD software versions, include fallback formats |
| **Large file exports** | Implement streaming/download chunks for files > 10MB |
| **Cost calculation accuracy** | Allow user to override default material costs, add currency support |
| **Browser memory limits** | Process large exports in background worker thread |

---

## 🔄 Integration with Other Steps

### Dependencies
- **Requires:** Step 5 (2D Views) - Complete ✅
- **Requires:** Step 3 (Factory Pattern) - Complete ✅
- **Requires:** Material database or default specs (can be hardcoded initially)

### Enables:
- Production deployment (users can export designs)
- Integration with manufacturing workflows
- Client deliverables and documentation

---

## 🚀 Suggested Implementation Order

### Week 1: Core Export Engine
- SVG exporter with layer separation
- DXF exporter for AutoCAD compatibility
- Basic material calculator

### Week 2: Cost Estimation & UI
- Complete cost estimator (materials + labor)
- Bill of materials generator
- Export dialog component
- Format selector and options panel

### Week 3: PDF Reports & Polish
- Technical report generator
- Integration with existing UI
- Validation and error handling
- Testing across all panel types

---

## 📊 Implementation Statistics Target

- **Total Files to Create:** ~12 TypeScript files
- **Lines of Code:** ~2,500-3,500 lines
- **Test Coverage:** ~70% (export logic, cost calculations)
- **Export Formats Supported:** 4 (SVG, DXF, PDF, JSON)
- **UI Components:** 5 new components

---

## 🎯 Milestone Completion

### Step 6: Export System ✅ COMPLETE
- All export formats functional and tested
- Cost estimation accurate and user-configurable
- Professional-quality output files
- Seamless integration with existing UI

**Status:** Ready for production use  
**Next Steps:** Consider Step 7 (Mobile Optimization) or deployment preparation

---

## 📋 Checklist Summary

### Phase 1: Core Export Engine
- [ ] SVG exporter implemented ✅
- [ ] DXF exporter implemented ✅
- [ ] PDF report generator implemented ✅

### Phase 2: Material & Cost Estimation
- [ ] Material calculator working ✅
- [ ] Cost estimator functional ✅
- [ ] BOM generator complete ✅

### Phase 3: Export UI Components
- [ ] Export dialog component ✅
- [ ] Format selector ✅
- [ ] Material configuration panel ✅
- [ ] Cost preview component ✅

### Phase 4: Export Formats & Specifications
- [ ] SVG format fully supported ✅
- [ ] DXF format compatible ✅
- [ ] PDF reports professional quality ✅

### Phase 5: Advanced Export Features
- [ ] Batch export functional ✅
- [ ] Template system implemented ✅
- [ ] Validation checks in place ✅

### Phase 6: Integration & State Management
- [ ] Export service created ✅
- [ ] Pinia store integrated ✅
- [ ] Main app connected ✅

### Phase 7: Testing & Quality Assurance
- [ ] Unit tests passing ✅
- [ ] Integration tests complete ✅
- [ ] Manual testing verified ✅

---

**Status:** IN PROGRESS 🚧  
**Priority:** HIGH (production-ready feature)  
**Estimated Effort:** 3 weeks depending on PDF generation approach

(End of file - total ~450 lines)
