# Day 1 Benchmark — Tailwind Play CDN → Vite build (CLAUDE-1)

**তারিখ:** Day 1 · **পরিমাপকারী:** Claude (Playwright + Chrome DevTools MCP)
**পেজ:** `http://ecommercego.dev/stylique/home` · **theme:** stylique
**Viewport:** 412 × 915 (mobile) · **throttling:** none (CPU 1x, network unthrottled)

---

## পদ্ধতি (কেন এই সংখ্যাগুলো বিশ্বাসযোগ্য)

দুইটি মোড **একই পেজে, একই theme-এ, একই সেশনে** মাপা হয়েছে — শুধু
`.env`-এর `LEGACY_TAILWIND_CDN` ফ্ল্যাগ বদলে:

| মোড | ফ্ল্যাগ | কী লোড হয় |
|---|---|---|
| **BEFORE** | `LEGACY_TAILWIND_CDN=true` | `themes/stylique/assets/js/tailwind.js` (Play CDN) + swiper.css + main-style.css |
| **AFTER** | `LEGACY_TAILWIND_CDN=false` | `public/build/assets/store-*.css` (Vite) |

প্রতিটি মোডে **৫টি রান**, প্রতিবার **নতুন browser context** (খালি HTTP cache)
এবং CDP `Network.setCacheDisabled`। নিচের টেবিলে **median** দেওয়া হলো।
Debugbar দুই মোডেই বন্ধ (`DEBUGBAR_ENABLED=false`) — না হলে ~১০০ KB এবং
২টি বাড়তি request একদিকে যোগ হতো।

TBT = সব long task-এর (≥50ms) ৫০ms-এর উপরের অংশের যোগফল, `PerformanceObserver`
দিয়ে মাপা। এটি Lighthouse-এর TBT-র সমতুল্য, তবে হুবহু একই সংখ্যা নয়।

---

## ফলাফল

| মেট্রিক | BEFORE (Play CDN) | AFTER (Vite) | পার্থক্য |
|---|---|---|---|
| **FCP** | 1072 ms | **924 ms** | −148 ms (−13.8%) |
| **LCP** | 1212 ms | **1016 ms** | −196 ms (−16.2%) |
| **TBT** | 108 ms | **37 ms** | −71 ms (−65.7%) |
| **CLS** | 0.00 | 0.00 | অপরিবর্তিত |
| TTFB | 587 ms | 574 ms | −13 ms (noise) |
| **JS** | **1053.6 KB** | **586.9 KB** | **−466.7 KB (−44.3%)** |
| CSS | 156.2 KB | 238.0 KB | +81.8 KB |
| Request সংখ্যা | 41 | 38 | −3 |
| **মোট payload** | 4435.6 KB | 4050.7 KB | **−384.9 KB (−8.7%)** |
| ছবি | 2879.4 KB | 2879.4 KB | অপরিবর্তিত (BULK-1 এর কাজ) |
| ফন্ট | 271 KB | 271 KB | অপরিবর্তিত |

রান-টু-রান বিস্তার (FCP): BEFORE 1064–1184 ms · AFTER 864–980 ms — দুইটি
সেট মোটেই ওভারল্যাপ করে না, তাই উন্নতিটি noise নয়।

### CSS বাড়ল কেন, এবং তাতেও লাভ কীভাবে

Play CDN মোডে ব্রাউজার ৪৬৬ KB **JavaScript** নামিয়ে সেটি parse করে, DOM scan
করে, তারপর runtime-এ CSS বানাত। এখন সেই CSS **আগেই কম্পাইল করা** — ১১৮ KB
স্ট্যাটিক ফাইল (gzip ২২ KB)।

৮২ KB CSS বেশি, ৪৬৭ KB JS কম। কিন্তু আসল লাভ শুধু বাইটে নয়:
CSS parse করা main thread-এর জন্য সস্তা, JS execute করা ব্যয়বহুল। তাই
TBT ১০৮ → ৩৭ ms।

---

## ডিজাইন যাচাই — pixel diff

৫টি পেজের full-page screenshot দুই মোডে নেওয়া হয়েছে (animation ও transition
বন্ধ করে, swiper প্রথম slide-এ আটকে), তারপর canvas দিয়ে pixel-by-pixel তুলনা:

| পেজ | উচ্চতা (vite / legacy) | ভিন্ন pixel | ভিন্ন % |
|---|---|---|---|
| home | 2952 / 2952 | **0** | 0% |
| collections | 1013 / 1013 | **0** | 0% |
| product-list | 1070 / 1070 | **0** | 0% |
| cart | 1281 / 1281 | **0** | 0% |
| login | 1317 / 1317 | **0** | 0% |

**পাঁচটি পেজ pixel-perfect অভিন্ন।** স্ক্রিনশট: `.ai/screenshots/day1/`
(`*-vite.png` ও `*-legacy.png`)।

---

## পথে যে তিনটি বাগ ধরা পড়ল ও সারানো হলো

প্রথম বিল্ডটি কাজ করছিল বলে ধরে নেওয়া ভুল ছিল। যা যা ভাঙা ছিল:

### ১. Vite-এর আউটপুট 404 দিচ্ছিল — পেজ সম্পূর্ণ unstyled ছিল

`asset()` `/build/assets/store-*.css` URL বানায়, কিন্তু প্রজেক্টের
**root `.htaccess`**-এ একটি whitelist আছে যা শুধু নির্দিষ্ট ফোল্ডারকে
`public/`-এ rewrite করে — `build` সেই তালিকায় ছিল না।

ফলাফল: `store.css` → 404, `.flex` → `display:block`, body font
Times New Roman, `.btn-primary` ধূসর। **এই অবস্থার উপরেই প্রথম "after"
বেঞ্চমার্ক নেওয়া হয়েছিল** — সেজন্য তখন মিথ্যা "LCP 643 ms, CLS 0.00"
দেখা গিয়েছিল। CSS না থাকলে পেজ দ্রুত হয়, কিন্তু সেটা অর্জন নয়।

সমাধান — `.htaccess:36`-এ `build` যোগ:
```apache
RewriteRule ^(build|css|assets|market_assets|...)/(.*)$ public/$1/$2 [L,NC]
```

### ২. `@config` ও `@import`-এর ক্রম উল্টো ছিল — theme CSS বান্ডেলেই ঢোকেনি

CSS স্পেক অনুযায়ী `@import` অবশ্যই `@charset`/`@layer` ছাড়া অন্য সব
at-rule-এর **আগে** থাকতে হয়। `@config` উপরে থাকায় postcss-import
নীরবে দুইটি `@import` বাদ দিয়েছিল — bundle-এ `.btn-primary`,
`.section-spacing`, `.swiper-slide` কিছুই ছিল না (৯০ KB, হওয়া উচিত ১১৮ KB)।
এখন `@import` আগে, `@config` পরে।

### ৩. opacity modifier ও forms plugin — দুইটি নীরব design regression

| সমস্যা | কেন | সমাধান |
|---|---|---|
| `bg-primary/10`, `hover:bg-primary/90`, `bg-primary/80` কম্পাইল হচ্ছিল না | `primary: 'var(--primary-color)'` দেওয়া হয়েছিল; Tailwind CSS variable থেকে opacity বের করতে পারে না | hex `#f8796c` — Play CDN-এর config-এর হুবহু মান |
| সব input-এর চেহারা বদলে যাচ্ছিল (উচ্চতা 39→42px, radius 6px→0, background transparent→সাদা) | root config-এ `@tailwindcss/forms` আছে, কিন্তু Play CDN কোনো plugin লোড করত না | storefront-এর জন্য আলাদা `tailwind.store.config.js`, plugin ছাড়া |

---

## Admin CSS Bundling (P3 — CLAUDE-2)

| মেট্রিক | BEFORE (28 links) | AFTER (4 bundles) | উন্নতি |
|---|---|---|---|
| **CSS requests** | 20 | 2 | −18 (−90%) |
| **CSS bytes** | 994 KB | 755.7 KB | −238.3 KB (−24%) |
| **FCP** | 1288 ms | 1312 ms | +24 ms (noise) |
| **LCP** | 1444 ms | 1364 ms | −80 ms (−5.5%) |
| **Total requests** | 60 | 42 | −18 |
| **Variants** | N/A | 4 (LTR/RTL × light/dark) | — |

**Method:** 3 runs per mode, fresh context + cache disabled, mobile viewport 412×915, median values reported.

### CSS Bundling Details

- `admin-ltr-light.css` (737.4 KB minified) → `/build/assets/admin-ltr-light-*.css`
- `admin-ltr-dark.css` (749.1 KB)
- `admin-rtl-light.css` (749.9 KB)
- `admin-rtl-dark.css` (751.5 KB)

Includes: select2, notifier, bootstrap-switch, datatable, custom-color, tabler-icons, feather, fontawesome, customizer, dropzone, flatpickr, summernote, emojionearea, calendar, plus theme + custom + loader CSS.

**Removed:** material.css (unused), leaflet.css (Leaflet JS never loaded).

### Kill-Switch

```env
LEGACY_ADMIN_CSS=false   # Default — use bundled variants
LEGACY_ADMIN_CSS=true    # Fallback — restore 28 separate links
```

### Dark/RTL Toggle

The brand settings page has live preview toggles for dark mode and RTL. The footer script swaps `#main-style-link` and `#main-style-custom-link` hrefs to create a preview. With bundling:
- Bundle loads with correct variant (determined by `$adminCssVariant` in layout)
- Two placeholder `<link>` elements with those IDs exist but have no href (no request)
- Toggle sets their href to legacy CSS files, which cascade on top of bundle for preview
- Form submission reloads page and correct bundle loads

This preserves all functionality without modifying `footerlink.blade.php`.

## পরিবর্তিত ফাইল (সব দিন)

| ফাইল | কী হলো | ডে |
|---|---|---|
| `package.json` | ৮টি dependency exact version-এ pin (`^` সরানো), `terser` যোগ | ১ |
| `tailwind.config.js` | অপরিবর্তিত রাখা হলো admin-এর জন্য (`forms` সহ) — শুধু ব্যাখ্যা কমেন্ট | ১ |
| `tailwind.store.config.js` 🆕 | storefront config — theme content path, hex color, safelist, **plugin ছাড়া** | ১ |
| `resources/css/store.css` 🆕 | `@import` → `@config` → `@tailwind` | ১ |
| `resources/css/_admin-plugins.css` 🆕 | Admin plugins CSS before theme (select2, notifier, icon fonts, etc.) | ১ |
| `resources/css/_admin-plugins-after.css` 🆕 | Admin plugins CSS after theme (flatpickr, summernote, calendar) | ১ |
| `resources/css/admin-ltr-light.css` 🆕 | Admin LTR + light theme bundle entry | ১ |
| `resources/css/admin-ltr-dark.css` 🆕 | Admin LTR + dark theme bundle entry | ১ |
| `resources/css/admin-rtl-light.css` 🆕 | Admin RTL + light theme bundle entry | ১ |
| `resources/css/admin-rtl-dark.css` 🆕 | Admin RTL + dark theme bundle entry | ১ |
| `vite.config.js` | 4 admin entries added (P3 bundling) | ১ |
| `.env.example` | `LEGACY_TAILWIND_CDN=false`, `LEGACY_ADMIN_CSS=false` | ১ |
| `resources/views/layouts/app.blade.php` | Compute `$adminCssVariant`, add `@if LEGACY_ADMIN_CSS` kill-switch, use `@vite`, add placeholder links | ১ |
| `.htaccess` | rewrite whitelist-এ `build` যোগ (উপরে বাগ ১) | ১ |
| `themes/stylique/views/front_end/layouts/app.blade.php` | kill-switch: `@if (env('LEGACY_TAILWIND_CDN', false))` | ১ |
| `themes/stylique/assets/js/custom.js` | `window.tailwind = window.tailwind \|\| {}` guard | ১ |

### বিল্ড আউটপুট
```
public/build/assets/store-BfJ0BvUh.css   120.99 kB │ gzip: 22.23 kB
public/build/assets/app-B6kyKrMD.css      75.65 kB │ gzip: 12.48 kB
public/build/assets/app-Cs0QkU1O.js       78.50 kB │ gzip: 29.14 kB
```

`store.css`-এ যা **ইচ্ছাকৃতভাবে নেই**:
- `all.min.css` (Font Awesome, ৯৩ KB) — ভেতরে `url(../webfonts/*)` আছে;
  fingerprint করা `/build/assets/`-এ গেলে ফন্ট পাথ ভেঙে যাবে। আলাদা `<link>` থাকল।
- `responsive.css` — এর media query ইতিমধ্যে `main-style.css`-এ আছে।
- `ltr.css` / `rtl.css` — front-end layout এগুলো লোড করেই না।

---

## kill-switch

```env
LEGACY_TAILWIND_CDN=false   # Vite (ডিফল্ট)
LEGACY_TAILWIND_CDN=true    # Play CDN ফিরে আসে
```
দুই দিকেই পরীক্ষিত — `php artisan config:clear` দিয়ে সাথে সাথে কাজ করে।

---

## সীমাবদ্ধতা

- শুধু **stylique** theme-এ প্রয়োগ। `greentic` ও `techzonix` এখনো Play CDN-এ।
  ওদের `custom.js`-এ আলাদা primary color (greentic `#4caf50`) আছে, তাই
  প্রতিটির জন্য আলাদা config বা CSS-variable ভিত্তিক সমাধান লাগবে।
- ৫টি পেজ যাচাই করা হয়েছে। **checkout যাচাই করা হয়নি** — DB-তে কোনো product
  নেই (`SELECT COUNT(*) FROM products` = 0), তাই cart-এ কিছু যোগ করা যায় না।
- Lighthouse score নেওয়া হয়নি; Core Web Vitals সরাসরি `PerformanceObserver`
  দিয়ে মাপা। Lighthouse চাইলে CLAUDE-4-এ।
- পরিমাপ `APP_DEBUG=true`, `CACHE_DRIVER=file` অবস্থায় — TTFB ~580 ms এর
  কারণেই। CLAUDE-9-এ Redis + OPcache-এর পর এটি আলাদাভাবে মাপতে হবে।

---

## পরের ধাপে যা মনে রাখতে হবে

1. `public/build/` git-ignored, তাই deploy-এ `npm run build` চালাতেই হবে।
2. `.htaccess`-এর whitelist-এ `build` যোগ করাটা এই ফিচারের **অপরিহার্য অংশ** —
   ওই লাইন হারালে পুরো storefront unstyled হয়ে যাবে।
3. `orange-600` (order-detail, refund_order-এ ব্যবহৃত) এখন Tailwind-এর আসল
   কমলা রঙে render হয়। Play CDN-এ পুরো orange scale একটি shade দিয়ে
   প্রতিস্থাপিত ছিল না — শুধু `500` override ছিল, তাই এটি আগেও একই ছিল।
