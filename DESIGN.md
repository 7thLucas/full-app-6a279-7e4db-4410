# WareVision 3D — Design Guidelines

## Color Palette
- **Primary background**: Deep navy `#0F1629` (structure, sidebar, top nav)
- **Surface / card**: `#1A2340` (cards, panels, modals)
- **Accent primary**: Amber / safety-yellow `#F59E0B` (highlights, CTAs, 3D item glow, alerts)
- **Accent secondary**: Emerald `#10B981` (status OK, in-stock, success states)
- **Danger / low-stock**: Red `#EF4444`
- **Text primary**: `#F1F5F9` (slate-100)
- **Text secondary**: `#94A3B8` (slate-400)
- **Border / divider**: `#2D3F5E`

## Typography
- **Font family**: Inter (Google Fonts) — clean, industrial, highly legible
- **Heading**: 700 weight, tracked slightly wide
- **Body**: 400–500 weight, 14–16px
- **Mono / SKU / codes**: `font-mono`, slate-300

## Elevation & Depth
- Cards: `box-shadow: 0 2px 12px rgba(0,0,0,0.4)`
- Modals: `box-shadow: 0 8px 40px rgba(0,0,0,0.6)`
- 3D canvas: full-bleed, dark background `#080E1C`

## Component Style
- **Buttons**: Rounded-lg, amber fill for primary actions, slate outline for secondary
- **Inputs**: Dark fill `#0F1629`, amber focus ring, monospace for barcode/SKU fields
- **Tables**: Striped dark rows, amber hover, sticky header
- **Badges**: Pill-shaped — green (in stock), amber (low stock), red (out of stock)
- **Sidebar**: Fixed left, 240px, navy background, amber active indicator
- **Nav**: Top bar with breadcrumb + user role chip

## 3D Viewport
- Background: `#080E1C` (near-black, industrial)
- Rack/shelf geometry: slate-blue `#334155`
- Zone color-coding: distinct hues per zone (blue, teal, violet, orange quadrants)
- Selected / highlighted bin: glowing amber pulse animation
- Navigation path: dashed amber line from entrance to target bin
- Ambient + directional lighting; subtle grid floor

## Layout
- **Sidebar** (fixed 240px left) + **main content** area
- **Dashboard** grid: 4-column stat cards + 2-column lower panels
- **3D Viewer**: full viewport height panel, resizable split with inventory detail panel
- **Tables**: full-width, sticky header, paginated
- **Mobile/tablet**: sidebar collapses to bottom nav, 3D viewer goes full screen on tap

## Key UX Principles
- Search is always visible and instant (debounced, highlights 3D location on result)
- Low-stock alerts appear as a persistent amber banner and badge in sidebar
- Role chip in top nav always visible — clear context of Employee vs Manager
- Manager-only actions are gated with a distinct visual treatment (lock icon + amber border)
- 3D model loads progressively — floor plan first, then racks, then items