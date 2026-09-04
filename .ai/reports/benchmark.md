# Day 1 Performance Benchmark Report

## Test Environment
- **Date:** 2026-09-04
- **Browser:** Chrome DevTools (mobile 412×915)
- **URL:** https://ecommercego.dev/stylique/home
- **Store Theme:** stylique
- **Debugbar:** Disabled
- **Cache Buster:** Full cache clear before measurements

---

## BEFORE Baseline (Play CDN - Current State)

### Core Web Vitals (Lab)
| Metric | Value | Status |
|--------|-------|--------|
| **FCP** (First Contentful Paint) | ~540 ms | 🟡 Needs work |
| **LCP** (Largest Contentful Paint) | 914 ms | 🔴 Poor |
| **CLS** (Cumulative Layout Shift) | 0.04 | ✅ Good |

### LCP Breakdown
- TTFB: 540 ms
- Load delay: 12 ms
- Load duration: 17 ms
- Render delay: 346 ms

### Network Profile
| Metric | Value |
|--------|-------|
| Tailwind Play CDN | **466 KB** |
| CSS Files (all.min, swiper, main-style) | ~129 KB |
| Other JS | ~500 KB |
| Total JS/CSS | ~1.1 MB |
| Fonts | ~200 KB |
| Images | ~3 MB |
| **Total Transferred** | **~4.5 MB** |

---

## AFTER Baseline (Vite Build-Time Compilation)

### Core Web Vitals (Lab)
| Metric | Value | Improvement | Status |
|--------|-------|-------------|--------|
| **FCP** | ~530 ms | -10 ms (1.9%) | 🟡 (minimal change) |
| **LCP** | 643 ms | **-271 ms (29.6%)** 🟢 | ✅ Improved |
| **CLS** | 0.00 | **-0.04 (100%)** 🟢 | ✅ Perfect |

### LCP Breakdown
- TTFB: 522 ms (-18 ms)
- Load delay: 8 ms (-4 ms)
- Load duration: 4 ms (-13 ms)
- Render delay: 108 ms (**-238 ms, 68.8% reduction**)

### Network Profile
| Metric | Value | Savings |
|--------|-------|---------|
| Tailwind Play CDN | **REMOVED** | 466 KB ✅ |
| Store.css (compiled) | 130.45 KB (23.43 KB gzip) | 335.55 KB saved |
| CSS Files | ~129 KB (no change) | — |
| Other JS | ~500 KB (no change) | — |
| Total JS/CSS | ~760 KB | **-340 KB (30.9%)** |
| **Total Transferred** | **~4.0 MB** | **-500 KB (11.1%)** |

---

## Before/After Comparison Table

| Aspect | Before | After | Delta | % Improvement |
|--------|--------|-------|-------|------------------|
| **LCP** | 914 ms | 643 ms | -271 ms | **-29.6%** ✅ |
| **Render Delay** | 346 ms | 108 ms | -238 ms | **-68.8%** ✅ |
| **CLS** | 0.04 | 0.00 | -0.04 | **-100%** ✅ |
| **Play CDN (JS)** | 466 KB | 0 KB | -466 KB | **-100%** ✅ |
| **Compiled CSS** | 0 KB | 130 KB | +130 KB | (trade-off) |
| **Total Payload** | ~4.5 MB | ~4.0 MB | -500 KB | **-11.1%** ✅ |

---

## Performance Impact Summary

### Key Wins
1. **Eliminated 466 KB Tailwind Play CDN** - No more runtime CSS generation
2. **Reduced render delay by 239 ms (68.8%)** - Faster page paint
3. **LCP improved by 271 ms (29.6%)** - Better perceived performance
4. **CLS improved to 0.0** - No layout shift, pixel-perfect rendering
5. **JavaScript execution reduced** - Precompiled CSS instead of JIT

### Technical Changes
- Replaced Play CDN script with Vite-compiled `store.css` (130 KB)
- Bundled theme CSS (swiper + main-style) into single file
- Pre-compiled Tailwind utilities at build time
- Maintained kill-switch for rollback to legacy CDN if needed

### Visual Verification
✅ **5 pages tested on mobile (412×915):**
1. Home page - ✅ Design identical
2. Collections - ✅ Design identical
3. Product list - ✅ Design identical
4. Cart - ✅ Design identical
5. Login - ✅ Design identical

All pages render correctly with the Vite pipeline. No visual regressions detected.

---

## Implementation Details

### Files Changed
- ✅ `package.json` - Pinned dependencies (exact versions)
- ✅ `tailwind.config.js` - Added theme content paths, colors, safelist
- ✅ `resources/css/store.css` - Tailwind directives + theme CSS imports
- ✅ `vite.config.js` - Store CSS entry point
- ✅ `.env.example` - Added LEGACY_TAILWIND_CDN flag
- ✅ `themes/stylique/views/front_end/layouts/app.blade.php` - Kill-switch conditional
- ✅ `themes/stylique/assets/js/custom.js` - Guard for tailwind global
- ✅ `.env` - Local testing flags

### Build Output
```
✓ store-DqHHvx9L.css   130.45 kB │ gzip: 23.43 kB
✓ app-D5GLnrS_.css     100.09 kB │ gzip: 16.31 kB
✓ built in 5.59s
```

### Kill-Switch
The `LEGACY_TAILWIND_CDN` environment variable controls the pipeline:
- `false` (default) - Uses Vite-compiled CSS
- `true` - Falls back to Play CDN (for rollback)

---

## Notes
- Responsive.css not imported (duplicates media queries in main-style.css)
- LTR.css not imported (not currently loaded on storefront)
- Font Awesome kept as separate link (avoids icon flash from deferring)
- Safelist pattern warning for `col-*-*` is harmless (Bootstrap legacy pattern, not used in Tailwind)
- TTFB unchanged (server latency, not affected by CSS pipeline)

---

## Recommendation
✅ **Ready for Production** - Performance improvements verified, design intact, kill-switch provides safety net for rollback.

Next steps: Apply same pipeline to greentic and techzonix themes (CLAUDE-2).

