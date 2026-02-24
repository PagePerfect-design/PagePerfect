declare module 'lucide-react' {
  import { FC, SVGProps } from 'react'

  interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    color?: string
    strokeWidth?: number | string
    absoluteStrokeWidth?: boolean
    className?: string
  }

  type Icon = FC<IconProps>

  export const AlertCircle: Icon
  export const AlertTriangle: Icon
  export const ArrowLeft: Icon
  export const ArrowRight: Icon
  export const BarChart3: Icon
  export const Bold: Icon
  export const BookOpen: Icon
  export const Check: Icon
  export const ChevronDown: Icon
  export const ChevronLeft: Icon
  export const ChevronRight: Icon
  export const ChevronUp: Icon
  export const Cloud: Icon
  export const CloudOff: Icon
  export const Code: Icon
  export const Download: Icon
  export const FileText: Icon
  export const Fingerprint: Icon
  export const FolderOpen: Icon
  export const Globe2: Icon
  export const Heading1: Icon
  export const Heading2: Icon
  export const Heading3: Icon
  export const Image: Icon
  export const ImageIcon: Icon
  export const Info: Icon
  export const Italic: Icon
  export const Keyboard: Icon
  export const Languages: Icon
  export const List: Icon
  export const ListOrdered: Icon
  export const Loader2: Icon
  export const Lock: Icon
  export const Minus: Icon
  export const Package: Icon
  export const Paintbrush: Icon
  export const Palette: Icon
  export const Plus: Icon
  export const Printer: Icon
  export const Quote: Icon
  export const Redo: Icon
  export const RotateCcw: Icon
  export const Ruler: Icon
  export const Settings2: Icon
  export const Shield: Icon
  export const Trash2: Icon
  export const Undo: Icon
  export const Upload: Icon
  export const Wrench: Icon
  export const X: Icon
}
