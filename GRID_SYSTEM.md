# PagePerfect Grid System

PagePerfect implements a systematic grid system based on Josef Müller-Brockmann's principles of clarity, objectivity, and systematic organization.

## 📚 Reference Material

For a comprehensive understanding of grid systems in graphic design, we recommend Josef Müller-Brockmann's seminal work:

**[Grid Systems in Graphic Design - Josef Müller-Brockmann](https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf)**

## Implementation Principles

PagePerfect follows Müller-Brockmann's core principles:

### 1. Systematic Organization
- All spacing and typography based on grid multiples
- Consistent visual relationships across all page sizes
- Rational, mathematical approach to layout

### 2. Baseline Grid
- **Academic templates**: 12pt baseline grid
- **Trade templates**: 11pt baseline grid
- All text aligns to baseline for consistent vertical rhythm

### 3. Typographic Scale
Based on the golden ratio (1.618) for visual harmony:
- **H1**: 2.25× base size
- **H2**: 1.75× base size  
- **H3**: 1.375× base size
- **Body**: 1× base size
- **Small**: 0.875× base size

### 4. Grid-Based Spacing
Six spacing levels as multiples of baseline:
- **XS**: 0.25× baseline
- **SM**: 0.5× baseline
- **MD**: 1× baseline
- **LG**: 1.5× baseline
- **XL**: 2× baseline
- **XXL**: 3× baseline

### 5. Margin System
Seven margin presets as grid multiples:
- **Minimal**: 2 grid units
- **Compact**: 3 grid units
- **Narrow**: 4 grid units
- **Normal**: 5 grid units
- **Wide**: 6 grid units
- **Academic**: 7 grid units
- **Generous**: 8 grid units

## Technical Implementation

### Grid System Class
Located in `backend/grid-system.js`, the `GridSystem` class provides:
- Baseline grid calculations
- Typographic scale generation
- Margin calculations based on grid units
- LaTeX command generation

### Template Integration
Both LaTeX templates (`chicago.latex` and `paperback.latex`) include:
- Grid-based typography commands
- Systematic spacing definitions
- Baseline-aligned line heights

### Backend Integration
The backend automatically applies grid principles to:
- All page sizes (Letter, A4, 6×9", etc.)
- All margin presets
- Both academic and trade templates

## Benefits

- **Visual Harmony**: Consistent spacing and alignment
- **Professional Typography**: Publisher-quality typographic scale
- **Systematic Organization**: Grid-based layout principles
- **Scalability**: Works across all page sizes and margin presets
- **Brand Consistency**: Cohesive design language

## Usage

The grid system is automatically applied to all PDF generation. Users can:
- Select from 7 margin presets
- Choose from 11 page sizes
- Switch between academic and trade templates
- All options maintain grid-based consistency

---

*This implementation embodies Müller-Brockmann's vision of design as a systematic, objective discipline that serves the content and the reader.*
