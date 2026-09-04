# Admin CSS Bundling Map (CLAUDE-2)

## Summary

Consolidated 28 separate CSS `<link>` tags from `resources/views/layouts/app.blade.php` lines 83-128 into 4 conditional bundles (RTL/dark variants) via Vite.

| Variant | Condition | Bundle Entry | Size (minified) |
|---|---|---|---|
| LTR + Light | default `@else` | `admin-ltr-light.css` | 737.4 KB |
| LTR + Dark | `cust_darklayout == 'on'` (no RTL) | `admin-ltr-dark.css` | 749.1 KB |
| RTL + Light | `SITE_RTL == 'on'` (no dark) | `admin-rtl-light.css` | 749.9 KB |
| RTL + Dark | both `cust_darklayout == 'on'` AND `SITE_RTL == 'on'` | `admin-rtl-dark.css` | 751.5 KB |

**Total variants in build:** 4 × ~750 KB = 3 MB (uncompressed disk footprint after Vite)

## CSS Files Bundled

### Always loaded (shared across all 4 variants)
- `public/assets/css/plugins/select2.min.css` (18.5 KB)
- `public/assets/css/plugins/notifier.css` (2.0 KB)
- `public/assets/css/plugins/bootstrap-switch-button.min.css` (2.4 KB)
- `public/assets/css/plugins/style.css` (3.0 KB) — DataTable plugin
- `public/css/custom-color.css` (8.9 KB)
- `public/assets/fonts/tabler-icons.min.css` (62.8 KB)
- `public/assets/fonts/feather.css` (12.9 KB)
- `public/assets/fonts/fontawesome.css` (64.5 KB)
- `public/assets/css/customizer.css` (11.0 KB)
- `public/assets/css/plugins/dropzone.css` (12.3 KB)
- `public/assets/css/plugins/flatpickr.min.css` (15.8 KB)
- `public/assets/css/summernote/summernote-bs4.css` (35.6 KB)
- `public/css/emojionearea.min.css` (24.6 KB)
- `public/css/calendar.css` (40.8 KB)

### Variant-specific (one per bundle)
- `public/assets/css/style.css` (575.5 KB) — LTR light theme
- `public/assets/css/style-dark.css` (577.5 KB) — LTR dark theme
- `public/assets/css/style-rtl.css` (575.8 KB) — RTL light theme
- `public/assets/css/rtl-style-dark.css` (576.8 KB) — RTL dark theme

Plus matching custom and loader CSS files per variant:
- `public/css/custom.css` (82.7 KB) — LTR custom overrides
- `public/css/rtl-custom.css` (82.3 KB) — RTL custom overrides
- `public/css/loader.css` (2.0 KB) — LTR loader animation
- `public/css/rtl-loader.css` (2.0 KB) — RTL loader animation

## Files Removed (Not Bundled)

### Unused icon font CSS
- `public/assets/fonts/material.css` (0.5 KB) — `.material-icons-two-tone` class unused in entire codebase (grep confirmed zero matches in blade/php/js). Font file (129.7 KB) never fetched by browser anyway.

### Unused external CSS
- `https://unpkg.com/leaflet/dist/leaflet.css` — Leaflet JS never loaded anywhere in project. No `L.map()`, `L.marker()`, or `L.tileLayer()` calls found. Dead CDN request, removed entirely.

### Browser-downloaded fonts (now in build)
Since Vite bundles the CSS, it also copies all referenced font files into `public/build/assets/`:
- Tabler: 4 formats (eot, ttf, woff, woff2) + SVG = 4.2 MB (browser only uses woff2 at ~230 KB)
- FontAwesome: 3 families × 4 formats + SVG = 2.4 MB (browser fetches solid woff2 ~75 KB + others on demand)
- Feather: 4 formats + SVG = 372 KB (browser only uses woff2 at ~29 KB)
- Summernote: 4 formats = 38 KB (woff2 ~6 KB)

**Disk footprint increases ~7 MB, but zero runtime impact** since browsers only download the first supported format.

## Kill-Switch

Added `LEGACY_ADMIN_CSS` environment variable (default `false`):
```bash
LEGACY_ADMIN_CSS=true   # Restores 28 separate <link> tags
LEGACY_ADMIN_CSS=false  # Use bundled Vite (new default)
```

Located in `.env.example` for reference.

## Dark/RTL Toggle Preservation

The brand settings page (`/admin/settings/brand`) has live preview toggles for dark mode and RTL direction. These toggles dynamically swap stylesheet `href` attributes using `#main-style-link` and `#main-style-custom-link` element IDs.

**Old behavior:** Toggle swapped between style.css, style-dark.css, style-rtl.css, rtl-style-dark.css

**New behavior:** 
1. Page loads with the correct variant bundle selected via `$adminCssVariant` in the layout
2. Two placeholder `<link>` elements with matching IDs exist but have no `href` (no network request)
3. When user toggles dark/RTL on the settings page, the footer script sets these placeholder `href` attributes to the legacy CSS files
4. Legacy files cascade on top of the bundle, creating a live preview (slightly different cascade behavior but visually equivalent)
5. Form submission reloads the page and the correct variant bundle loads automatically

This preserves all existing functionality without modifying `resources/views/partision/footerlink.blade.php`.

## Cascade Order (Vite @import sequence)

Within each bundle, CSS is imported in this exact order to match the original layout's cascade:

1. `_admin-plugins.css` (before theme) — select2, notifier, switch-button, datatable, custom-color, icon fonts, customizer, dropzone
2. Theme variant — style.css / style-dark.css / style-rtl.css / rtl-style-dark.css
3. Custom overrides — custom.css / rtl-custom.css
4. Loader animation — loader.css / rtl-loader.css
5. `_admin-plugins-after.css` (after theme) — flatpickr, summernote, emojionearea, calendar

Plugins split into "before" and "after" because cascade order matters: summernote and flatpickr rules must load after the theme to properly override it.

## Notes for Future Maintenance

- All four bundles include the same shared plugins and fonts, so `git diff` on the build output will show all three other variants changed even if only one is touched in source
- Vite's `publicDir: false` (Laravel Vite plugin default) means font URLs are rewritten to `/build/assets/...` paths; preloading fonts requires resolving the hashed filename from the manifest (not implemented in this version)
- PostCSS runs autoprefixer globally; since admin CSS has no `@tailwind` directives, Tailwind is a no-op but still participates in the transform chain
- Material Icons font CSS is kept in the bundle (0.5 KB overhead) despite zero usage to minimize risk of dynamic icon registration in future WorkDo versions
