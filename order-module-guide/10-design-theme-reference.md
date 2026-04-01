# 10 — Design & Theme Reference

> This guide documents **every design token, font, colour, and animation** used in the existing LOOK@ME system. The Orders module MUST use these exact values. This is identical to `costing-module-guide/09-design-theme-reference.md`.

---

## Font

| Property | Value |
|----------|-------|
| Font Family | **Outfit** (Google Fonts) |
| CSS Variable | `var(--font-outfit)`, `'Outfit'`, `sans-serif` |
| Import | `next/font/google` → `Outfit` with `variable: "--font-outfit"` |
| Numeric Style | `font-variant-numeric: lining-nums tabular-nums` |
| Rendering | `-webkit-font-smoothing: antialiased` |

**All text in the orders module must use Outfit.** No Inter, no Roboto, no system fonts.

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

### Status Colors (Specific to Orders Module)

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| PENDING | `bg-amber-50` (#fffbeb) | `text-amber-700` (#b45309) | `border-amber-200` |
| IN_PRODUCTION | `bg-blue-50` (#eff6ff) | `text-blue-700` (#1d4ed8) | `border-blue-200` |
| DISPATCHED | `bg-violet-50` (#f5f3ff) | `text-violet-700` (#6d28d9) | `border-violet-200` |
| DELIVERED | `bg-green-50` (#f0fdf4) | `text-green-700` (#15803d) | `border-green-200` |
| CANCELLED | `bg-slate-100` (#f1f5f9) | `text-slate-500` (#64748b) | `border-slate-200` |

### Shop Colors (Specific to Orders Module)

| Shop | Primary Color | Light bg | Dark text |
|------|--------------|----------|-----------|
| Shop 1 | Blue | `bg-blue-50` | `text-blue-700` |
| Shop 2 | Violet | `bg-violet-50` | `text-violet-700` |
| Shop 3 | Emerald | `bg-emerald-50` | `text-emerald-700` |

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

### Primary Button
```css
background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
shadow: 0 4px 14px rgba(22,163,74,0.28);
text: white; font-weight: 600; border-radius: 12px;
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
| `animate-bounce-in` | Scale 0 → 1.25 → 1 | 0.4s |

### Usage in Orders Module

- **Page enter**: `animate-fade-in` on the outer container
- **Stats cards**: `animate-fade-in-up` on the stats grid
- **Table rows**: `transition-colors` for hover
- **Form steps**: `animate-in slide-in-from-right-4 fade-in duration-300`
- **Toasts**: `animate-slide-toast`
- **Design info card**: `animate-fade-in` when design is selected
- **Loading spinner**: `border-2 border-slate-200 border-t-green-500 rounded-full animate-spin`

---

## Icons (Lucide React)

All icons come from `lucide-react`. Orders module icons:

| Icon | Import | Usage |
|------|--------|-------|
| `FileText` | Sidebar nav | Orders nav item |
| `Plus` | Action button | "Add Order" |
| `Search` | Filter bar | Search input icon |
| `Filter` | Filter bar | Filters button |
| `ArrowUpDown` | Table headers | Sortable column indicator |
| `ChevronLeft/Right` | Pagination, navigation | Page navigation, back link |
| `Eye` | Table actions | View detail |
| `Edit2` | Table actions | Edit record |
| `Trash2` | Table actions | Delete record |
| `Hash` | Detail modal | Design number |
| `Package` | Detail modal | Description |
| `Store` | Detail modal, form | Shop indicators |
| `Calendar` | Detail modal | Order date |
| `TrendingUp` | Stats, detail | Revenue/profit indicators |
| `DollarSign` | Detail modal | Pricing info |
| `CheckCircle2` | Form stepper | Completed step |
| `AlertCircle` | Form notice | Info box |

---

> **Next:** [11-file-structure.md](./11-file-structure.md)
