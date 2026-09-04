# Asset Inventory Report — `public/` Audit

**Task:** GEMINI-1 (Asset Inventory Audit)
**Date:** 2026-09-04
**Scope:** `C:\laragon\www\ecommercego\public\`

## 1. Summary of Public Directory
The `public/` directory contains a mix of core Laravel assets, vendor libraries, theme-specific assets, and some redundant source files. 

| Category | Approx. Count | Key Locations |
|---|---|---|
| Large JS (>500KB) | 5 | `public/js/`, `public/assets/js/plugins/tinymce/` |
| Huge CSS (>1MB) | 1 | `public/authorizenet/assets/css/style.css` (2.5MB) |
| Images | ~50 | `public/market_assets/images/`, `public/authorizenet/assets/images/` |
| Redundant Source | ~20 | `public/installer/css/sass/`, `public/installer/css/scss/` |

---

## 2. High-Impact Findings (P1-P8 context)

### 🔴 Critical Bloat
- **`public/authorizenet/assets/css/style.css` (2.5 MB):** This is extremely large for a single CSS file. It likely contains embedded base64 images or is unminified.
- **TinyMCE Themes:** `silver/theme.js` (1.1 MB) and `mobile/theme.js` (437 KB). Total TinyMCE footprint is significant.
- **`public/js/app.js` (688 KB):** Needs to be checked if this is a bundle or a single logic file.

### 🟠 Redundancy & Fragmentation
- **jQuery Duplication:** 
  - `public/js/jquery-3.6.0.min.js` (89 KB)
  - `public/js/jquery.min.js` (86 KB)
  - `public/authorizenet/assets/js/jquery.min.js` (89 KB)
  - `public/market_assets/js/jquery.min.js` (89 KB)
- **Source Files in Public:** `.sass` and `.scss` files found in `public/installer/css/`. These should be in `resources/` and only the compiled CSS should be in `public/`.
- **Moment.js Locales:** `public/js/moment/locale/` contains 120+ separate `.js` files. These should be bundled or loaded on demand.

---

## 3. Large Asset List (>100KB)

| File Path | Size | Type | Note |
|---|---|---|---|
| `public/authorizenet/assets/css/style.css` | 2.5 MB | CSS | **Action:** Minify/Audit |
| `public/assets/js/plugins/tinymce/themes/silver/theme.js` | 1.1 MB | JS | |
| `public/authorizenet/assets/images/banner-image.png` | 983 KB | PNG | **Action:** Convert to WebP |
| `public/js/app.js` | 688 KB | JS | |
| `public/market_assets/images/taskly_image1.png` | 692 KB | PNG | |
| `public/market_assets/images/pos_image1.png` | 642 KB | PNG | |
| `public/market_assets/images/hrm_image1.png` | 564 KB | PNG | |
| `public/js/calendar.js` | 517 KB | JS | FullCalendar? |
| `public/js/apexcharts.min.js` | 509 KB | JS | |
| `public/js/html2pdf.bundle.min.js` | 480 KB | JS | |
| `public/installer/img/background.png` | 465 KB | PNG | |
| `public/assets/js/plugins/tinymce/themes/mobile/theme.js` | 437 KB | JS | |
| `public/assets/js/plugins/tinymce/themes/silver/theme.min.js` | 403 KB | JS | |
| `public/js/jspdf.umd.min.js` | 364 KB | JS | |
| `public/authorizenet/assets/images/banner-image-2.png` | 312 KB | PNG | |

---

## 4. Optimization Recommendations

1. **WebP Conversion:** All PNGs in `market_assets` and `authorizenet` should be converted to WebP. This could save ~2-3 MB.
2. **CSS Minification:** Audit `authorizenet/assets/css/style.css`. If it's used only for payment pages, ensure it's lazy-loaded.
3. **Library Consolidation:** Standardize on one jQuery version and point all layouts to it.
4. **Remove Source Files:** Delete `.sass` and `.scss` from `public/` after verifying they are backed up in `resources/`.
5. **Vite Bundling:** (CLAUDE-1 to CLAUDE-3) Move large libraries to `resources/js` and let Vite bundle them with tree-shaking where possible.

---

## 5. Next Steps
- GEMINI-2: Scan for Tailwind classes to prepare for the JIT build.
- CLAUDE-1: Implement Vite and replace these fragmented assets with a clean bundle.
