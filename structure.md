src/
│
├── app/                        # App-level setup
│   ├── main.ts
│   ├── App.vue
│   ├── router.ts
│
├── core/                       # 🔥 PURE LOGIC (no Vue, no Three)
│   ├── math/
│   │   ├── qrd.ts
│   │   ├── prd.ts
│   │   ├── skyline.ts
│   │   ├── abfusor.ts
│   │   ├── acoustics.ts       # freq ↔ wavelength
│   │   └── validation.ts
│   │
│   ├── geometry/
│   │   ├── panelBuilder.ts    # main geometry generator
│   │   ├── cell.ts            # PanelCell types
│   │   ├── transforms.ts
│   │   └── bounds.ts
│   │
│   └── types/
│       ├── panelTypes.ts
│       ├── parameters.ts
│       └── geometry.ts
│
├── features/                   # Feature-based modules
│   ├── qrd/
│   │   ├── useQrd.ts
│   │   ├── QrdForm.vue
│   │   └── qrdPreset.ts
│   │
│   ├── skyline/
│   ├── abfusor/
│   └── absorber/
│
├── renderers/                  # Rendering layer (separate!)
│   ├── three/
│   │   ├── scene.ts
│   │   ├── camera.ts
│   │   ├── controls.ts
│   │   ├── materials.ts
│   │   ├── meshBuilder.ts     # cells → meshes
│   │   └── ThreeViewport.vue
│   │
│   ├── svg/
│   │   ├── svgRenderer.ts     # cells → SVG paths
│   │   ├── projections.ts     # side/top/front views
│   │   ├── dimensions.ts
│   │   └── SvgViewport.vue
│
├── exporters/                  # Output layer
│   ├── svgExport.ts
│   ├── pdfExport.ts
│   ├── dxfExport.ts           # future
│
├── store/                      # State management (Pinia)
│   ├── panelStore.ts
│   ├── uiStore.ts
│
├── components/                 # Shared UI components
│   ├── layout/
│   ├── controls/
│   ├── inputs/
│   └── display/
│
├── composables/                # Vue composables
│   ├── usePanel.ts            # orchestrates pipeline
│   ├── useDebounce.ts
│   └── useUnits.ts
│
├── utils/                      # Generic helpers
│   ├── units.ts
│   ├── math.ts
│   └── format.ts
│
├── styles/
│   └── main.css
│
└── tests/
    ├── math/
    ├── geometry/
    └── integration/
