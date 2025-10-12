# PagePerfect

A systematic PDF generation system that implements Josef Müller-Brockmann's grid system principles for professional typography and layout.

## 📚 Design Philosophy

PagePerfect is built on the foundational principles of Josef Müller-Brockmann's "Grid Systems in Graphic Design":

**[Grid Systems in Graphic Design - Josef Müller-Brockmann](https://ia902309.us.archive.org/4/items/GridSystemsInGraphicDesignJosefMullerBrockmann/Grid%20systems%20in%20graphic%20design%20-%20Josef%20Muller-Brockmann.pdf)**

Our implementation follows Müller-Brockmann's principles of:
- **Systematic organization** and rationalization
- **Baseline grid** for consistent vertical rhythm  
- **Typographic scale** based on proportional relationships
- **Grid-based spacing** for visual harmony

## Features

- **Grid-Based Typography**: Systematic typographic scale based on golden ratio
- **Baseline Grid**: Consistent vertical rhythm across all templates
- **Multiple Page Sizes**: Letter, A4, 6×9", Amazon KDP sizes, and more
- **Margin Presets**: 7 systematic margin options from minimal to generous
- **Template System**: Academic (Chicago) and Trade (Paperback) templates
- **Real-time Preview**: Instant PDF generation with live preview

## Quick Start

1. **Frontend**: `cd frontend && npm run dev`
2. **Backend**: `cd backend && npm start`
3. **Open**: `http://localhost:3000/app`

## Documentation

- **[Grid System Documentation](./GRID_SYSTEM.md)** - Detailed implementation guide
- **[Author Guide](./frontend/src/app/app/authorGuide.ts)** - User documentation
- **[Docs Page](./frontend/src/app/docs/page.tsx)** - Troubleshooting and references

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express and Pandoc
- **PDF Generation**: XeLaTeX with systematic grid templates
- **Deployment**: Netlify (frontend) + Railway (backend)

---

*PagePerfect embodies Müller-Brockmann's vision of design as a systematic, objective discipline that serves the content and the reader.*
# Vercel redeploy trigger Sun Oct 12 09:20:14 BST 2025
