# 09 — Design & Theme Reference

> This guide documents **every design token, font, colour, and animation** used in the existing LOOK@ME system. The Costing module MUST use these exact values.

---

## Font

| Property | Value |
|----------|-------|
| Font Family | **Outfit** (Google Fonts) |
| CSS Variable | `var(--font-outfit)`, `'Outfit'`, `sans-serif` |
| Import | `next/font/google` → `Outfit` with `variable: "--font-outfit"` |
| Numeric Style | `font-variant-numeric: lining-nums tabular-nums` |
| Rendering | `-webkit-font-smoothing: antialiased` |

**All text in the costing module must use Outfit.** No Inter, no Roboto, no system fonts.

---

## Colour Palette (CSS Variables)

### Brand

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-primary` | `#16a34a` | Green primary — buttons, active states, focus rings |
| `--color-primary-hover` | `#15803d` | Darker green for hover |
| `--color-primary-light` | `#dcfce7` | Light green background |
| `--color-primary-ring` | `rgba(22, 163, 74, 0.25)` | Focus ring shadow |

### Layout

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-background` | `#F0F4F8` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, modals |
| `--color-foreground` | `#0F172A` | Body text |
| `--color-border` | `#E2E8F0` | Borders, dividers |

### Status (Reuse for Profit Indicators)

| Variable | Hex | Usage in Costing |
|----------|-----|-----------------|
| `--color-success` / `bg-green-50` | `#dcfce7` | Profit ≥ 30% background |
| `text-green-700` | `#15803d` | Profit ≥ 30% text |
| `bg-amber-50` | `#fffbeb` | Profit 20-29% background |
| `text-amber-700` | `#b45309` | Profit 20-29% text |
| `bg-red-50` | `#fef2f2` | Profit < 20% background |
| `text-red-700` | `#b91c1c` | Profit < 20% text |

### Sidebar

| Variable | Value |
|----------|-------|
| `--color-sidebar` | `#0F172A` |
| Background | `linear-gradient(160deg, #0F172A 0%, #1E293B 100%)` |
| Active item | `linear-gradient(135deg, rgba(22,163,74,0.22) 0%, rgba(22,163,74,0.10) 100%)` |
| Active border | `1px solid rgba(22,163,74,0.25)` |
| Active bar | `bg-green-400` (left accent) |

---

## Shadows

| Variable | Value | Usage |
|----------|-------|-------|
| `--shadow-card` | `0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)` | Card default |
| `--shadow-card-hover` | `0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)` | Card hover |
| `--shadow-sidebar` | `4px 0 24px rgba(0,0,0,0.15)` | Sidebar drop shadow |
| `--shadow-glow-green` | `0 0 20px rgba(22, 163, 74, 0.2)` | Green glow effect |

### Button Shadow (Primary)

```css
shadow-[0_4px_14px_rgba(22,163,74,0.28)]
hover:shadow-[0_6px_20px_rgba(22,163,74,0.38)]
```

---

## Border Radius

| Variable | Value | Usage |
|----------|-------|-------|
| `--radius-sm` | `8px` | Small elements |
| `--radius-md` | `12px` | `rounded-xl` — buttons, inputs, tags |
| `--radius-lg` | `16px` | `rounded-2xl` — cards, containers |
| `--radius-xl` | `20px` | `rounded-2xl` — large modals |

---

## Typography Scale

| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-2xl font-black tracking-tight` | 24px | 900 | Page titles |
| `text-lg font-bold` | 18px | 700 | Modal titles |
| `text-base font-bold` | 16px | 700 | Section headers |
| `text-sm font-semibold` | 14px | 600 | Nav items, table cells |
| `text-sm text-slate-500` | 14px | 400 | Subtitles, descriptions |
| `text-xs font-bold` | 12px | 700 | Form labels |
| `text-[11px] font-bold uppercase tracking-wider` | 11px | 700 | Table headers, stat labels |
| `text-[10px]` | 10px | — | Extra small labels |

---

## Component Styling Reference

### Table Container
```css
bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden
```

### Table Header Row
```css
border-b border-slate-100 bg-slate-50/60
```

### Table Header Text
```css
text-[11px] font-bold text-slate-500 uppercase tracking-wider
```

### Table Cell
```css
px-5 py-3 whitespace-nowrap text-sm
```

### Table Row (Data)
```css
group border-b border-slate-50 last:border-0 transition-colors cursor-pointer
```

### Stat Card
```css
rounded-xl px-4 py-3 border border-slate-100 shadow-sm {bg-color}
```

### Stat Label
```css
text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5
```

### Stat Value
```css
text-lg font-black truncate {text-color}
```

### Search Input
```css
rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-800
placeholder:text-slate-400 focus:ring-1 focus:ring-green-500 focus:border-green-500
bg-slate-50 focus:bg-white transition-all
```

### Filter Drawer Select
```css
w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-8 text-sm text-slate-700
focus:ring-1 focus:ring-green-500 focus:border-green-500 appearance-none shadow-sm
```

### Form Input
```css
mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 sm:text-sm
bg-gray-50 focus:bg-white
```

### Badge (Status/Size)
```css
inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide
```

### Primary Button
```css
background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
shadow: 0 4px 14px rgba(22,163,74,0.28);
text: white; font-weight: 600; border-radius: 12px;
```

### Pagination
```css
/* Container */
border-t border-slate-100 bg-slate-50/50 px-5 py-3

/* Info text */
text-xs text-slate-500

/* Buttons */
h-8 w-8 rounded-lg text-slate-500 hover:bg-white hover:shadow-sm
border border-transparent hover:border-slate-200
```

---

## Animations (from globals.css)

| Class | Animation | Duration |
|-------|-----------|----------|
| `animate-fade-in-up` | Translate Y 10px → 0 + fade | 0.45s |
| `animate-fade-in-left` | Translate X -12px → 0 + fade | 0.35s |
| `animate-fade-in` | Opacity 0 → 1 | 0.3s |
| `animate-scale-in` | Scale 0.95 → 1 + fade | 0.3s |
| `animate-slide-right` | Translate X 16px → 0 + fade | 0.35s |
| `animate-slide-toast` | Translate X 30px → 0 + fade | 0.35s |
| `animate-float` | Translate Y ±8px | 3s infinite |
| `animate-spin-slow` | Rotate 360° | 8s linear |
| `animate-pulse-glow` | Green box-shadow pulse | 2s infinite |
| `animate-bounce-in` | Scale 0 → 1.25 → 1 | 0.4s |

### Usage in Costing Module

- **Page enter**: `animate-fade-in` on the outer container
- **Stats cards**: `animate-fade-in-up` on the stats grid
- **Table rows**: `transition-colors` for hover
- **Form steps**: `animate-in slide-in-from-right-4 fade-in duration-300`
- **Toasts**: `animate-slide-toast`
- **Loading spinner**: `border-2 border-slate-200 border-t-green-500 rounded-full animate-spin`

---

## Utility Classes (from globals.css)

### Glass Effect
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}
```

### Skeleton Loading
```css
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 400px 100%;
  animation: shimmer 1.4s infinite;
}
```

### Custom Scrollbar
```css
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
```

---

## Icons (Lucide React)

All icons come from `lucide-react`. Commonly used in this module:

| Icon | Import | Usage |
|------|--------|-------|
| `CircleDollarSign` | Sidebar nav | Costing nav item |
| `Plus` | Action button | "Add Costing" |
| `Search` | Filter bar | Search input icon |
| `Filter` | Filter bar | Filters button |
| `ArrowUpDown` | Table headers | Sortable column indicator |
| `ChevronLeft/Right` | Pagination | Page navigation |
| `Eye` | Table actions | View detail |
| `Edit2` | Table actions | Edit record |
| `Trash2` | Table actions | Delete record |
| `Hash` | Detail modal | Design number |
| `Package` | Detail modal | Description |
| `Ruler` | Detail modal | Size |
| `Scissors` | Detail modal | Fabric name |
| `DollarSign` | Detail modal | Costs |
| `CheckCircle2` | Form stepper | Completed step |
| `ChevronRight/Left` | Form nav | Next/Back |
| `AlertCircle` | Form notice | Info box |
| `X` | Modal/Drawer | Close button |

---

> **Next:** [10-file-structure.md](./10-file-structure.md)
