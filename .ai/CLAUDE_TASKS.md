# CLAUDE — কাজের প্রম্পট

**ব্যবহারবিধি:** নিচের প্রম্পটগুলো **একটি একটি করে** Claude-কে দেবেন।

**Claude-এর ভূমিকা:** আর্কিটেকচার, integration, ব্রাউজার টেস্ট, সব merge ও review।
Claude-র হাতে Playwright MCP + chrome-devtools MCP আছে — সে নিজে ব্রাউজারে টেস্ট করবে।

---

## প্রম্পট ১ — Vite pipeline + Tailwind Play CDN অপসারণ (Day 1)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো (বাধ্যতামূলক):
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/tailwind-classes.md   ← Gemini তৈরি করেছে
4. .ai/reports/asset-inventory.md    ← Gemini তৈরি করেছে

⚠️ যদি ৩ বা ৪ নম্বর ফাইল না থাকে → থামো, ব্যবহারকারীকে জানাও যে GEMINI-1 ও
GEMINI-2 আগে শেষ করতে হবে। Play CDN সরানোর আগে class inventory ছাড়া কাজ
করা মানে ডিজাইন ভাঙার ঝুঁকি নেওয়া।

branch:
cd C:\laragon\www\ecommercego
git checkout -b day1/asset-pipeline
(থাকলে: git checkout day1/asset-pipeline)

### সমস্যা (P1, P7) — প্রজেক্টের সবচেয়ে বড় performance killer

`themes/*/assets/js/tailwind.js` = **466 KB Tailwind Play CDN**, যা ব্রাউজারে
runtime-এ CSS তৈরি করে। এর মানে প্রতিটি পেজ লোডে ৪৬৬ KB JS parse হয়, তারপর
সম্পূর্ণ Tailwind engine চলে DOM scan করে CSS বানায়। এটি FCP, LCP, TBT — সব নষ্ট করে।

একইসাথে `vite.config.js` কার্যত অব্যবহৃত: `resources/css/app.css` = 59 bytes,
`resources/js/app.js` = 96 bytes।

### তোমার কাজ (CLAUDE-1)

**ধাপ ১: বর্তমান অবস্থা মাপো (before বেঞ্চমার্ক)**

Playwright/chrome-devtools MCP দিয়ে storefront-এর হোমপেজে যাও (URL
`.ai/PROGRESS.md`-এর Environment সেকশনে)। মোবাইল viewport (412×915) এ:
- মোট transferred bytes
- JS bytes, CSS bytes
- FCP, LCP, TBT, CLS
- request সংখ্যা

এগুলো `.ai/reports/benchmark.md`-এ "Before (baseline)" শিরোনামে লিখে রাখো।
এটাই পরে প্রমাণ হবে যে কাজ হয়েছে।

**ধাপ ২: Tailwind build pipeline তৈরি করো**

- `package.json`-এ প্রয়োজনীয় dependency যোগ করো। **নির্দিষ্ট version pin করবে**,
  open range (`^`) নয়। Tailwind 3.x-এই থাকবে (৪-এ যাবে না — breaking change)।
- `tailwind.config.js`-এর `content` path-এ theme ফোল্ডার যোগ করো:
  `./themes/**/views/**/*.blade.php`, `./themes/**/assets/js/**/*.js`,
  `./resources/views/**/*.blade.php`
- Gemini-র রিপোর্ট থেকে পাওয়া dynamic class-গুলো `safelist`-এ যোগ করো
- `vite.config.js` লেখো: storefront ও admin-এর জন্য আলাদা entry, code splitting,
  manifest, CSS minify

**ধাপ ৩: Play CDN প্রতিস্থাপন — সাবধানে, kill-switch সহ**

`themes/stylique/views/front_end/layouts/app.blade.php:20` এ Play CDN load হয়।
এটি সরাবে, কিন্তু এভাবে:

```blade
@if (env('LEGACY_TAILWIND_CDN', false))
    {{-- kill-switch: .env এ LEGACY_TAILWIND_CDN=true দিলে পুরনো আচরণ ফিরে আসবে --}}
    <script src="{{ asset('themes/' . $currentTheme . '/assets/js/tailwind.js') }}"></script>
@else
    @vite(['resources/css/store.css'])
@endif
```

- `.env.example`-এ `LEGACY_TAILWIND_CDN=false` যোগ করো
- **প্রথমে শুধু `stylique` theme-এ করবে।** বাকি দুই theme পরে, টেস্ট পাস করার পর।
- `themes/*/assets/js/tailwind.js` ফাইলটি **মুছবে না** — kill-switch-এর জন্য দরকার

**ধাপ ৪: `resources/css/store.css` তৈরি করো**

- Tailwind directive (`@tailwind base/components/utilities`)
- theme-এর নিজস্ব CSS import করো: `main-style.css`, `responsive.css`, `ltr.css`
- `all.min.css` (93 KB) — Gemini-র রিপোর্ট দেখে সিদ্ধান্ত নাও এটি bundle-এ
  ঢোকাবে নাকি আলাদা রাখবে (এটি সম্ভবত font-awesome, তাহলে আলাদা ও deferred)

**ধাপ ৫: build ও যাচাই**

```
cd C:\laragon\www\ecommercego
npm install
npm run build
```
build সফল হলে ব্রাউজারে টেস্ট করো।

### 🔴 ভেরিফিকেশন — এটি বাধ্যতামূলক, বাদ দেওয়া যাবে না

Playwright MCP দিয়ে `stylique` storefront-এর এই পেজগুলো মোবাইল viewport-এ
স্ক্রিনশট নাও এবং **চোখে দেখে যাচাই করো** ডিজাইন অপরিবর্তিত কি না:
1. হোমপেজ
2. category listing
3. product detail
4. cart
5. checkout (login করে)

স্ক্রিনশট রাখো `.ai/screenshots/day1/` ফোল্ডারে।

তারপর "After" বেঞ্চমার্ক নাও এবং `.ai/reports/benchmark.md`-এ যোগ করো।
Before/After তুলনার টেবিল বানাও।

⛔ যদি কোনো পেজের ডিজাইন ভেঙে যায়:
- ভাঙা class চিহ্নিত করো
- `safelist`-এ যোগ করো
- আবার build ও টেস্ট
- ৩ বার চেষ্টার পরও না হলে → `.env`-এ `LEGACY_TAILWIND_CDN=true` করে
  পুরনো অবস্থায় ফিরে যাও, `.ai/PROGRESS.md`-এর Blockers-এ লিখো, ব্যবহারকারীকে জানাও

### সম্পন্ন করার পর

১. `.ai/reports/benchmark.md` — before/after তুলনা
২. `.ai/PROGRESS.md`-এ CLAUDE-1 → ✅ DONE, কমিট hash সহ
৩. commit:
git add -A
git commit -m "perf(vite): replace Tailwind Play CDN with build-time compilation  [CLAUDE-1]"
৪. ব্যবহারকারীকে বাংলায় জানাও: কত KB কমেছে, Lighthouse কত থেকে কত হলো,
   কোনো ডিজাইন ভেঙেছে কি না।
```

---

## প্রম্পট ২ — Admin ২৮ CSS bundle (Day 1)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/asset-inventory.md
4. .ai/reports/benchmark.md

branch: git checkout day1/asset-pipeline

### সমস্যা (P3)

`resources/views/layouts/app.blade.php:83-128` এ **২৮টি আলাদা CSS link** আছে।
মোবাইল নেটওয়ার্কে ২৮টি আলাদা HTTP request = বিশাল দেরি। এগুলো একটি bundle হতে হবে।

জটিলতা: এই CSS গুলো শর্তসাপেক্ষে load হয় — RTL/LTR এবং dark/light অনুযায়ী
আলাদা ফাইল (`style.css`, `style-dark.css`, `style-rtl.css`, `rtl-style-dark.css`)।
তাই একটি bundle নয়, **চারটি variant** দরকার।

### তোমার কাজ (CLAUDE-2)

**ধাপ ১: before বেঞ্চমার্ক** — admin dashboard-এ (login করে), মোবাইল viewport।
request সংখ্যা, CSS bytes, FCP/LCP নোট করো।

**ধাপ ২: layout ফাইলটি পড়ে শর্তগুলো ম্যাপ করো**

`resources/views/layouts/app.blade.php:100-128` এর `@if`/`@else` গঠন বুঝে নাও।
কোন শর্তে কোন ফাইল load হয় — একটি টেবিল বানাও `.ai/reports/admin-css-map.md`-এ।

**ধাপ ৩: চারটি entry CSS তৈরি করো**

```
resources/css/admin-ltr-light.css
resources/css/admin-ltr-dark.css
resources/css/admin-rtl-light.css
resources/css/admin-rtl-dark.css
```

প্রতিটিতে `@import` দিয়ে সংশ্লিষ্ট CSS ফাইলগুলো আনবে। plugin CSS (select2,
notifier, bootstrap-switch, dropzone, flatpickr, summernote, emojionearea,
calendar) সব variant-এ common — একটি `resources/css/_admin-plugins.css` বানিয়ে
সেটি চারটিতেই import করো।

**ফন্ট CSS আলাদা রাখো।** `tabler-icons`, `feather`, `fontawesome`, `material` —
এগুলো মোট কত KB দেখো। যদি বড় হয়:
- Gemini-র inventory দেখে কোন icon set আসলে ব্যবহৃত হয় বের করো
- অব্যবহৃতগুলো bundle থেকে বাদ দাও, কিন্তু ফাইল মুছবে না
- ব্যবহৃতগুলো `<link rel="preload" as="font">` দিয়ে দাও

**leaflet CSS** (`https://unpkg.com/leaflet/...`) — external CDN। এটি কোন পেজে
লাগে খুঁজে বের করো। যদি শুধু ১-২ পেজে লাগে, সেই পেজের `@push('css')`-এ সরাও,
global layout থেকে বাদ দাও।

**ধাপ ৪: layout-এ প্রতিস্থাপন — kill-switch সহ**

```blade
@if (env('LEGACY_ADMIN_CSS', false))
    {{-- পুরনো ২৮টি link, হুবহু অপরিবর্তিত রাখো --}}
    ... (বর্তমান কোড) ...
@else
    @vite(['resources/css/' . $adminCssVariant . '.css'])
@endif
```

`$adminCssVariant` নির্ধারণ করবে layout-এর শুরুর `@php` ব্লকে, বিদ্যমান
`$setting['SITE_RTL']` ও `$setting['cust_darklayout']` variable ব্যবহার করে।

`.env.example`-এ `LEGACY_ADMIN_CSS=false` যোগ করো।

**ধাপ ৫: build ও টেস্ট**

### 🔴 ভেরিফিকেশন — বাধ্যতামূলক

Playwright দিয়ে admin-এ login করে এই ১০টি পেজ মোবাইল ও ডেস্কটপ viewport-এ
স্ক্রিনশট নাও, ডিজাইন অপরিবর্তিত কি না চোখে যাচাই করো:
1. Dashboard
2. Product list (DataTable)
3. Product create (form + summernote + select2 + dropzone)
4. Order list
5. Order detail
6. Coupon list
7. Customer list
8. Settings
9. Report (ApexCharts)
10. যেকোনো একটি modal খোলা অবস্থায়

চারটি variant-ই টেস্ট করতে হবে:
- LTR + light
- LTR + dark
- RTL + light (settings থেকে RTL চালু করে)
- RTL + dark

স্ক্রিনশট: `.ai/screenshots/day1-admin/`

⛔ কিছু ভাঙলে: `.env`-এ `LEGACY_ADMIN_CSS=true` করে ফিরে যাও, Blockers-এ লিখো।

### সম্পন্ন করার পর

১. `.ai/reports/benchmark.md`-এ admin before/after যোগ করো
২. `.ai/PROGRESS.md`-এ CLAUDE-2 → ✅ DONE
৩. commit:
git add -A
git commit -m "perf(vite): bundle 28 admin stylesheets into 4 conditional variants  [CLAUDE-2]"
৪. বাংলায় রিপোর্ট: request কত থেকে কত, CSS KB কত কমেছে
```

---

## প্রম্পট ৩ — Cache-buster ঠিক করা (Day 1)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো: .ai/PROJECT_CONTEXT.md এবং .ai/PROGRESS.md

branch: git checkout day1/asset-pipeline

### সমস্যা (P5)

৭টি blade ফাইলে `?v=' . time()` বা অনুরূপ cache-buster আছে। উদাহরণ:
`resources/views/layouts/app.blade.php:104,108,112,116`

`time()` মানে প্রতি সেকেন্ডে নতুন URL — ব্রাউজার কখনো cache করতে পারে না।
এটি শুধু performance নষ্ট করে না, PWA-র Workbox caching-ও সম্পূর্ণ অকার্যকর
করে দেবে (Day 3-এ যা বসাবো)।

### তোমার কাজ (CLAUDE-3)

**ধাপ ১: সব খুঁজে বের করো**

`resources/views/` এবং `themes/` এ `time()`, `rand()`, `uniqid()` দিয়ে তৈরি
কোনো asset URL খুঁজে তালিকা করো।

**ধাপ ২: প্রতিস্থাপন কৌশল**

যে ফাইলগুলো Vite bundle-এ চলে গেছে (CLAUDE-1, CLAUDE-2 এ) → `?v=time()`
এমনিতেই চলে গেছে, কারণ Vite নিজেই hash দেয়। যাচাই করো।

যেগুলো এখনো Vite-এর বাইরে (যেমন `css/custom.css`, `css/loader.css` — এগুলো
runtime-এ ব্যবহারকারীর setting থেকে তৈরি হতে পারে):
- `time()` এর বদলে **ফাইলের mtime** ব্যবহার করো:
  `?v={{ file_exists(public_path('css/custom.css')) ? filemtime(public_path('css/custom.css')) : '1' }}`
- ফাইল বদলালে URL বদলাবে, না বদলালে cache কাজ করবে

⚠️ কিন্তু blade-এ এত লম্বা expression বারবার লেখা খারাপ। তাই একটি helper বানাও।

**ধাপ ৩: Helper**

`app/Helper/helper.php` ফাইলটি ইতিমধ্যে `composer.json`-এর autoload files-এ আছে।
সেখানে একটি নতুন function যোগ করো:

```php
if (!function_exists('asset_v')) {
    /**
     * Asset URL with a stable cache-busting version based on file mtime.
     * Unlike time(), this only changes when the file actually changes.
     */
    function asset_v($path) { ... }
}
```

⚠️ এটি `app/` ফোল্ডারে একটি ব্যতিক্রম — PROJECT_CONTEXT-এ `app/` নিষিদ্ধ বলা হয়েছে,
কিন্তু `app/Helper/helper.php`-এ **শুধু নতুন function যোগ করা** নিরাপদ ও অনুমোদিত।
বিদ্যমান কোনো function পরিবর্তন করবে না।

**ধাপ ৪: blade-এ প্রতিস্থাপন**

`{{ asset('css/custom.css') }}{{ '?v=' . time() }}` → `{{ asset_v('css/custom.css') }}`

**ধাপ ৫: `.htaccess`-এ cache header**

`C:\laragon\www\ecommercego\.htaccess` পড়ো। যদি `mod_expires` / `Cache-Control`
নিয়ম না থাকে, যোগ করো:
- CSS/JS/font/image → `max-age=31536000, immutable` (এখন URL versioned, তাই নিরাপদ)
- HTML → `no-cache`

⚠️ `.htaccess` পরিবর্তনের আগে একটি ব্যাকআপ কমেন্ট রাখো যাতে ফেরানো সহজ হয়।

### 🔴 ভেরিফিকেশন

Playwright/chrome-devtools দিয়ে:
1. একটি পেজ দুইবার লোড করো
2. দ্বিতীয়বার CSS/JS `200` না এসে `304` বা `(from disk cache)` আসছে কি নিশ্চিত করো
3. স্ক্রিনশট দিয়ে ডিজাইন অপরিবর্তিত যাচাই করো

### সম্পন্ন করার পর

১. `.ai/PROGRESS.md`-এ CLAUDE-3 → ✅ DONE
২. commit:
git add -A
git commit -m "perf(cache): replace time() cache-busters with mtime-based versioning  [CLAUDE-3]"
৩. বাংলায় রিপোর্ট
```

---

## প্রম্পট ৪ — Day 1 চূড়ান্ত টেস্ট ও merge (Day 1)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/benchmark.md

branch: git checkout day1/asset-pipeline

### তোমার কাজ (CLAUDE-4): Day 1-এর সব কাজ যাচাই করে master-এ merge

**ধাপ ১: সব কাজ হয়েছে কি যাচাই করো**

`.ai/PROGRESS.md`-এ Day 1-এর সব টাস্ক (GEMINI-1, GEMINI-2, CLAUDE-1, CLAUDE-2,
CLAUDE-3, BULK-1) ✅ DONE কি? না হলে কোনটা বাকি সেটা জানাও এবং merge করবে না।

**ধাপ ২: পূর্ণ regression টেস্ট**

Playwright MCP দিয়ে মোবাইল (412×915) ও ডেস্কটপ (1440×900) — দুই viewport-এ:

**Storefront (stylique theme):**
1. হোমপেজ — banner/slider ঘুরছে কি (Swiper কাজ করছে?)
2. category listing — filter, sort কাজ করছে কি
3. product detail — image gallery, variant select, quantity
4. add to cart → cart drawer/page
5. wishlist যোগ ও অপসারণ
6. search — suggestion আসছে কি
7. login → account dashboard
8. checkout ধাপগুলো (payment ধাপ পর্যন্ত, আসল payment নয়)

**Admin:**
9. login
10. dashboard — chart render হচ্ছে কি
11. product list — DataTable pagination, search, sort
12. product create — summernote editor, select2, image upload widget
13. order list → order detail
14. একটি modal খোলা (`data-ajax-popup`)
15. settings পেজ
16. dark mode toggle
17. RTL toggle (তারপর আবার LTR-এ ফেরাও)

প্রতিটি ধাপে console error আছে কি দেখো। **যেকোনো নতুন console error = ব্লকার।**

স্ক্রিনশট: `.ai/screenshots/day1-final/`

**ধাপ ৩: Lighthouse**

chrome-devtools MCP দিয়ে performance trace নাও:
- storefront হোমপেজ (mobile)
- admin dashboard (mobile)

`.ai/reports/benchmark.md`-এ "Day 1 Final" সেকশনে লিখো, baseline-এর সাথে তুলনা।

**ধাপ ৪: সিদ্ধান্ত**

✅ যদি সব ঠিক থাকে:
```
git checkout master
git merge day1/asset-pipeline --no-ff -m "merge: Day 1 asset pipeline optimization"
git tag -a day1-complete -m "Day 1: Vite pipeline, Tailwind build, CSS bundling, cache fix"
```

❌ যদি কিছু ভাঙা থাকে:
- merge করবে না
- `.ai/PROGRESS.md`-এর Blockers-এ বিস্তারিত লিখো
- ব্যবহারকারীকে জানাও কী ভেঙেছে এবং কী দরকার

**ধাপ ৫: Day 2-এর প্রস্তুতি**

`.ai/PROGRESS.md`-এ "বর্তমান পর্যায়" আপডেট করো → "Day 2 শুরুর জন্য প্রস্তুত"

### রিপোর্ট

ব্যবহারকারীকে বাংলায় একটি স্পষ্ট টেবিল দাও:

| মেট্রিক | Before | After | পরিবর্তন |
| storefront total KB | | | |
| storefront JS KB | | | |
| storefront request | | | |
| storefront LCP | | | |
| admin request | | | |
| admin CSS KB | | | |

এবং বলো: কোনো ফিচার ভেঙেছে কি না, Day 2-তে যাওয়া নিরাপদ কি না।
```

---

## প্রম্পট ৫ — Turbo Drive ইনস্টল + bootstrap (Day 2)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো (বাধ্যতামূলক):
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/script-inventory.md   ← Gemini তৈরি করেছে (GEMINI-3)

⚠️ যদি script-inventory.md না থাকে → থামো। GEMINI-3 আগে শেষ করতে হবে।
কোন script কোন শ্রেণির তা না জেনে Turbo বসালে ১৭০টি জায়গায় অন্ধভাবে কাজ করতে হবে।

⚠️ যাচাই করো Day 1 merge হয়েছে: `git tag -l` এ `day1-complete` আছে কি?
না থাকলে থামো — CLAUDE-4 আগে শেষ করতে হবে।

branch:
cd C:\laragon\www\ecommercego
git checkout -b day2/turbo-drive

### লক্ষ্য

Hotwired Turbo Drive বসানো — যাতে পেজ navigation-এ full reload না হয়।
এটিই "SPA feel"-এর মূল অংশ।

কিন্তু এটিই সবচেয়ে ঝুঁকিপূর্ণ ধাপ। তাই ধাপে ধাপে, kill-switch সহ, এবং
**প্রথমে শুধু storefront-এ**, admin-এ পরে।

### তোমার কাজ (CLAUDE-5)

**ধাপ ১: Turbo যোগ করো**

`package.json`-এ `@hotwired/turbo` — নির্দিষ্ট version pin করো (৮.x)।
`npm install` চালাও।

**ধাপ ২: `resources/js/turbo-bootstrap.js` তৈরি করো**

এই ফাইলটি BULK মডেলের সব batch কাজের ভিত্তি, তাই এটি নিখুঁত হতে হবে।
এতে থাকবে:

```js
// ── Turbo Drive bootstrap ────────────────────────────────────────────
// Kill-switch: window.__TURBO_DISABLED__ = true হলে Turbo চালু হবে না।
// এই flag layout থেকে .env দিয়ে সেট হয়।

// ১. Turbo import ও conditional start
// ২. window.onTurboLoad(fn)
//      - প্রতি turbo:load এ চলবে
//      - প্রথম লোডেও চলবে (DOMContentLoaded আগে হয়ে গেলেও)
//      - Turbo বন্ধ থাকলে $(document).ready-র মতো আচরণ করবে (fallback)
// ৩. window.onTurboOnce(fn)
//      - শুধু একবার চলবে, কখনো দুইবার নয়
//      - Turbo বন্ধ থাকলেও একবার চলবে
// ৪. Vue island registry-র জন্য mount/unmount hook (CLAUDE-15 ব্যবহার করবে)
//      - turbo:before-cache এ সব island unmount হবে (memory leak রোধ)
// ৫. Turbo progress bar কনফিগার
// ৬. turbo:before-fetch-request এ CSRF token যোগ (Laravel-এর জন্য জরুরি)
```

কঠোর শর্ত:
- `onTurboLoad` এ নিবন্ধিত function একই পেজে **দুইবার চলবে না**
- Turbo বন্ধ থাকলে (kill-switch) সব helper তবুও কাজ করবে — নয়তো
  kill-switch চালু করলেই সব ভেঙে যাবে
- কোনো jQuery নির্ভরতা থাকবে না (jQuery হয়তো পরে load হয়)
- কিন্তু jQuery থাকলে `$(document).ready` fallback-ও সমর্থন করবে

**ধাপ ৩: `resources/js/store.js` ও `resources/js/admin.js` entry**

দুইটি আলাদা entry — storefront ও admin আলাদা bundle পাবে।
দুইটিতেই `turbo-bootstrap.js` import করবে।
`vite.config.js`-এ এই entry যোগ করো।

**ধাপ ৪: শুধু storefront layout-এ যোগ করো**

`themes/stylique/views/front_end/layouts/app.blade.php` এর `<head>`-এ:

```blade
<script>window.__TURBO_DISABLED__ = {{ env('TURBO_ENABLED', true) ? 'false' : 'true' }};</script>
@vite(['resources/js/store.js'])
```

`.env.example`-এ `TURBO_ENABLED=true` যোগ করো।

**ধাপ ৫: Turbo-র জন্য layout প্রস্তুত করো**

storefront layout-এ:
- header ও footer-এ `data-turbo-permanent` **যোগ করবে না এখনই** — আগে দেখো
  Turbo এমনিতেই ঠিকভাবে কাজ করে কি না। permanent element জটিলতা বাড়ায়।
- যেসব link Turbo-র বাইরে রাখা দরকার সেগুলোতে `data-turbo="false"`:
  - payment gateway redirect link
  - file download link
  - external link
  - PDF/invoice link
  এগুলো খুঁজে বের করো এবং চিহ্নিত করো।

**ধাপ ৬: প্রাথমিক টেস্ট (BULK মডেলকে দেওয়ার আগে)**

Playwright দিয়ে storefront-এ ৫টি পেজে navigate করো এবং দেখো:
- পেজ পরিবর্তনে full reload হচ্ছে না (network-এ document request-এর ধরন দেখো)
- console-এ error নেই
- Swiper/slider দ্বিতীয় পেজে কাজ করছে কি না — **সম্ভবত ভাঙবে**, এটিই প্রমাণ
  করবে কেন BULK মডেলের script migration দরকার

`.ai/reports/turbo-initial-test.md`-এ লিখো কী কী ভেঙেছে। এই তালিকা BULK মডেলের
কাজ যাচাই করতে ব্যবহৃত হবে।

### সম্পন্ন করার পর

১. `.ai/PROGRESS.md`-এ CLAUDE-5 → ✅ DONE
২. commit:
git add -A
git commit -m "feat(turbo): install Turbo Drive with kill-switch and lifecycle helpers  [CLAUDE-5]"
৩. ব্যবহারকারীকে বাংলায় জানাও: Turbo বসেছে, কী কী ভেঙেছে (স্বাভাবিক),
   এবং এখন BULK মডেলকে প্রম্পট ২ দিতে হবে।
```

---

## প্রম্পট ৬ — DataTable, modal, plugin re-init (Day 2)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/script-inventory.md
4. .ai/reports/turbo-initial-test.md
5. .ai/reports/turbo-migration-batch1.md, batch2.md, batch3.md  ← BULK মডেলের কাজ

⚠️ যাচাই করো BULK-2, 3, 4 সব ✅ DONE কি না। না হলে থামো।

branch: git checkout day2/turbo-drive

### প্রেক্ষাপট — এটিই Day 2-এর আসল চ্যালেঞ্জ

BULK মডেল ব্যক্তিগত blade ফাইলের script migrate করেছে। কিন্তু কিছু জিনিস
কেন্দ্রীয়ভাবে ঠিক করতে হবে, কারণ সেগুলো shared component-এ আছে:

**ক. DataTable (৭০ পেজ)**
`resources/views/components/datatable.blade.php:21` এ `$(document).ready` আছে।
আরও গুরুত্বপূর্ণ: yajra datatables নিজে `$dataTable->scripts()` দিয়ে JS তৈরি করে,
যা `$(document).ready`-তে DataTable init করে। এটি vendor-generated, আমরা সরাসরি
বদলাতে পারি না।

সমস্যা: Turbo navigation-এ ফিরে এলে DataTable আবার init হবে →
"Cannot reinitialise DataTable" error।

সমাধানের পথ (তুমি সেরা বাছবে):
- `turbo:before-cache` এ `$.fn.dataTable.tables()` খুঁজে `.destroy()` করা
- অথবা DataTable ধারণকারী element-এ `data-turbo-cache="false"` দেওয়া
- অথবা init করার আগে `$.fn.dataTable.isDataTable()` চেক করা

⚠️ `datatable.blade.php` একটি shared component — এটি পরিবর্তন করা অনুমোদিত,
কিন্তু ন্যূনতম পরিবর্তন করবে।

**খ. Modal (১০১টি `data-ajax-popup`)**
`resources/views/front_end/jQueryRoute.blade.php:397` এবং
`resources/views/layouts/app.blade.php:244` (`#commonModal`)।

modal event delegation `$(document).on(...)` দিয়ে হয় — এটি ONCE-ONLY, তাই
Turbo-তে টিকে থাকবে। কিন্তু:
- Bootstrap modal backdrop DOM-এ থেকে যেতে পারে → Turbo navigate করলে
  ধূসর overlay আটকে থাকবে
- `turbo:before-cache` এ খোলা modal বন্ধ করতে হবে এবং backdrop সরাতে হবে

**গ. select2 (২৫ পেজ), summernote (১৯), flatpickr, dropzone, ApexCharts (২০)**
এগুলো BULK মডেল migrate করেছে, কিন্তু **destroy করা হয়নি**। Turbo cache-এ
পেজ সংরক্ষিত হলে DOM-এ পুরনো widget থেকে যাবে, ফিরে এলে duplicate হবে।

`turbo:before-cache` এ সব widget destroy করতে হবে।

### তোমার কাজ (CLAUDE-6)

`resources/js/turbo-cleanup.js` তৈরি করো যা `turbo:before-cache` এ:
1. সব DataTable destroy
2. সব খোলা modal বন্ধ + backdrop অপসারণ + `body.modal-open` class অপসারণ
3. select2 destroy
4. summernote destroy
5. flatpickr destroy
6. dropzone destroy
7. ApexCharts destroy
8. Swiper destroy
9. tooltip/popover অপসারণ

প্রতিটির জন্য **নিরাপদ চেক** — library আছে কি না দেখে তারপর চালাবে
(`if (window.jQuery && $.fn.select2) { ... }`)। কোনো library অনুপস্থিত থাকলে
error হবে না।

তারপর:
- `admin.js` ও `store.js` — দুইটিতেই `turbo-cleanup.js` import করো
- `resources/views/components/datatable.blade.php` এ ন্যূনতম সংশোধন
- admin layout-এ Turbo চালু করো (storefront-এর মতোই, kill-switch সহ):
  `resources/views/layouts/app.blade.php`

### 🔴 ভেরিফিকেশন — খুব যত্নে

Playwright দিয়ে **navigation চক্র** টেস্ট করো — শুধু পেজ খোলা নয়,
বারবার আসা-যাওয়া করতে হবে, কারণ Turbo cache-এর সমস্যা দ্বিতীয়বার ফিরে
এলে ধরা পড়ে:

Admin-এ:
1. Product list → Order list → **back** → Product list → DataTable কাজ করছে?
2. Product create → select2 খোলো → অন্য পেজ → back → select2 কাজ করছে?
3. summernote-এ লেখো → অন্য পেজ → back → editor একটাই আছে (duplicate নয়)?
4. modal খোলো → বন্ধ করো → navigate → backdrop আটকে নেই?
5. modal খোলা রেখেই navigate → পরের পেজে overlay নেই?
6. Report পেজ → chart দেখো → navigate → back → chart একটাই?
7. DataTable-এ search → পেজ ২ → navigate → back → অবস্থা কী?
8. ১০ বার এলোমেলো navigation → console-এ কোনো error জমছে কি?

Storefront-এ:
9. হোম → product → cart → back → back → slider কাজ করছে?
10. add to cart → cart badge আপডেট হচ্ছে?
11. search suggestion → navigate → back → আবার কাজ করছে?

মোবাইল viewport-এও একই টেস্ট।

স্ক্রিনশট: `.ai/screenshots/day2/`
console error লগ: `.ai/reports/turbo-console-errors.md`

⛔ কোনো error থাকলে merge করবে না। সমাধান করো বা Blockers-এ লিখো।

### সম্পন্ন করার পর

১. `.ai/PROGRESS.md`-এ CLAUDE-6 → ✅ DONE
২. commit:
git add -A
git commit -m "fix(turbo): destroy jQuery plugins and modals before Turbo cache  [CLAUDE-6]"
৩. বাংলায় রিপোর্ট: কী কী ভেঙেছিল, কী ঠিক করেছ, কী এখনো বাকি
```

---

## প্রম্পট ৭ — Form redirect ও validation (Turbo 303) (Day 2)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো: .ai/PROJECT_CONTEXT.md এবং .ai/PROGRESS.md

branch: git checkout day2/turbo-drive

### সমস্যা

Turbo ফর্ম সাবমিশন intercept করে। কিন্তু Turbo দাবি করে POST-এর পর redirect
হতে হবে **303 See Other** স্ট্যাটাসে। Laravel ডিফল্টে **302 Found** পাঠায়।

ফলে: ফর্ম সাবমিট করলে Turbo redirect অনুসরণ করবে কিন্তু আবার POST করার
চেষ্টা করতে পারে, অথবা পেজ আপডেট হবে না।

আরও একটি সমস্যা: validation error-এ Laravel `back()` করে 302 দিয়ে —
Turbo এটি সঠিকভাবে render করতে পারে না, error message দেখাবে না।

⛔ **কিন্তু আমরা ১৩৩টি controller পরিবর্তন করব না।** সেটি upstream update
নষ্ট করবে। সমাধান হতে হবে কেন্দ্রীয়, middleware-ভিত্তিক।

### তোমার কাজ (CLAUDE-7)

**ধাপ ১: Middleware তৈরি করো**

`app/Http/Middleware/TurboResponseMiddleware.php`

⚠️ এটি `app/` এ একটি নতুন ফাইল — নতুন ফাইল যোগ করা অনুমোদিত, বিদ্যমান
controller/model পরিবর্তন নয়।

যা করবে:
- request-এ Turbo header আছে কি চেক (`Accept: text/vnd.turbo-stream.html` বা
  `Turbo-Frame`, অথবা আমাদের নিজের যোগ করা header)
- response redirect (30x) এবং request method POST/PUT/PATCH/DELETE হলে
  → status 303-এ বদলাও
- GET redirect-এ হাত দেবে না (302 ঠিক আছে)

**ধাপ ২: নিবন্ধন**

Laravel 11-এ middleware `bootstrap/app.php` এ নিবন্ধিত হয়।
সেই ফাইলটি পড়ো এবং `web` group-এ যোগ করো।

⚠️ `bootstrap/app.php` পরিবর্তন করবে — এটি ছোট ফাইল, merge conflict সহজে
সমাধানযোগ্য। PROJECT_CONTEXT-এ এটি অনুমোদিত ব্যতিক্রম হিসেবে যোগ করো।

**ধাপ ৩: validation error handling**

Turbo-তে validation error দেখানোর দুইটি পথ:
(ক) 422 status পাঠানো — কিন্তু এতে controller বদলাতে হবে ❌
(খ) `turbo-bootstrap.js` এ `turbo:submit-end` ইভেন্ট ধরে, redirect হলে
    পরের পেজে flash message/error আছে কি দেখা ✅

(খ) পথে যাও। `turbo-bootstrap.js` এ যোগ করো:
- `turbo:submit-start` — submit বোতাম disable + loading অবস্থা
- `turbo:submit-end` — বোতাম আবার সক্রিয়
- ব্যর্থ হলে (network error) ব্যবহারকারীকে জানানো

প্রজেক্টে flash message দেখানোর যে system আছে (`show_toastr` function,
`resources/views/layouts/includes/alerts.blade.php`) সেটি Turbo navigation-এর
পরেও কাজ করছে কি যাচাই করো।

**ধাপ ৪: ফাইল upload ফর্ম**

Turbo `multipart/form-data` ফর্ম সমর্থন করে, কিন্তু progress দেখায় না।
প্রজেক্টে dropzone ও সাধারণ file input দুইটাই আছে।

যেসব ফর্মে ফাইল upload আছে সেগুলো খুঁজে বের করো। যদি সমস্যা হয়,
সেই ফর্মে `data-turbo="false"` দাও — traditional submit হবে, নিরাপদ।

### 🔴 ভেরিফিকেশন

Playwright দিয়ে **প্রকৃত ফর্ম সাবমিশন** টেস্ট করো:

1. Admin login ফর্ম — সঠিক credential
2. Admin login — ভুল credential → error message দেখাচ্ছে?
3. Product create — সব ঠিক → save → redirect + success message?
4. Product create — required field ফাঁকা → validation error দেখাচ্ছে?
5. Product edit → update → পরিবর্তন সংরক্ষিত?
6. Coupon create (modal থেকে) → save → list আপডেট?
7. Product create image সহ (file upload) → কাজ করছে?
8. Delete confirmation → item মুছেছে + list আপডেট?
9. Settings save → মান সংরক্ষিত?
10. Storefront: register ফর্ম → validation error → তারপর সফল
11. Storefront: add to cart → cart আপডেট
12. Storefront: checkout address ফর্ম

প্রতিটিতে দেখো: URL ঠিক বদলেছে? message দেখাচ্ছে? ডেটা সংরক্ষিত হয়েছে?
console error নেই?

⛔ ফর্ম ভাঙা মানে সম্পূর্ণ ব্লকার। ফর্ম কাজ না করলে প্রজেক্ট অচল।
সমাধান না হলে Turbo-কে শুধু GET navigation-এ সীমাবদ্ধ করার কথা ভাবো
(`turbo.session.drive` কনফিগার) — ব্যবহারকারীকে জানাও।

### সম্পন্ন করার পর

১. `.ai/PROGRESS.md`-এ CLAUDE-7 → ✅ DONE
২. PROJECT_CONTEXT.md-এর অনুমোদিত ফাইল তালিকায় `bootstrap/app.php` এবং
   `app/Http/Middleware/TurboResponseMiddleware.php` যোগ করো
৩. commit:
git add -A
git commit -m "fix(turbo): 303 redirect middleware and form submit lifecycle  [CLAUDE-7]"
৪. বাংলায় রিপোর্ট: ১২টি ফর্ম টেস্টের ফলাফল টেবিলে
```

---

## প্রম্পট ৮ — Day 2 চূড়ান্ত টেস্ট ও merge (Day 2)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/turbo-console-errors.md
4. .ai/reports/benchmark.md

branch: git checkout day2/turbo-drive

### তোমার কাজ (CLAUDE-8): Day 2 যাচাই ও merge

**ধাপ ১: সব টাস্ক ✅ কি যাচাই করো**
GEMINI-3, CLAUDE-5, BULK-2/3/4, CLAUDE-6, CLAUDE-7 — সব DONE?

**ধাপ ২: বৃহৎ regression — ২৫টি পেজ**

Turbo সবচেয়ে বেশি ঝুঁকিপূর্ণ, তাই এবার টেস্ট আরও ব্যাপক।
মোবাইল (412×915) ও ডেস্কটপ — দুইটিতেই।

Admin (login করে):
1. Dashboard — চার্ট, কার্ড, সংখ্যা
2. Product list — DataTable সব ফিচার
3. Product create — পূর্ণ ফর্ম
4. Product edit — বিদ্যমান ডেটা load
5. Product attribute/variant পেজ
6. Category list ও create
7. Order list → detail → status পরিবর্তন
8. Customer list → detail
9. Coupon list → create (modal)
10. Shipping/tax settings
11. Report পেজ (chart)
12. POS পেজ (যদি থাকে)
13. Store settings
14. Theme customize পেজ
15. Plan/subscription পেজ
16. User/role পেজ
17. Language/translation পেজ
18. Email template পেজ

Storefront:
19. হোমপেজ
20. category listing + filter
21. product detail + variant
22. cart
23. wishlist
24. checkout
25. account dashboard + order history

**প্রতিটি পেজে যাচাই করো:**
- ভিজ্যুয়াল ঠিক আছে (স্ক্রিনশট দেখে)
- console-এ কোনো error নেই
- সেই পেজের প্রধান interaction কাজ করে

**তারপর navigation stress test:**
- ২০টি এলোমেলো navigation → console error জমছে কি?
- ব্রাউজার back/forward ১০ বার → অবস্থা ঠিক?
- একটি পেজে ৫ বার ফিরে আসা → duplicate widget নেই?
- মোবাইলে sidebar খোলা রেখে navigate → sidebar অবস্থা ঠিক?

**ধাপ ৩: পারফরম্যান্স পরিমাপ**

এবার সবচেয়ে গুরুত্বপূর্ণ সংখ্যা — **navigation speed**:
- Turbo দিয়ে পেজ পরিবর্তনে কত ms লাগে (cached ও uncached)
- `TURBO_ENABLED=false` করে একই navigation-এ কত ms
- তুলনা `.ai/reports/benchmark.md`-এ

লক্ষ্য: cached navigation < 300ms

Lighthouse আবার নাও (storefront + admin, mobile)।

**ধাপ ৪: kill-switch যাচাই — এটি বাদ দিও না**

`.env`-এ `TURBO_ENABLED=false` করো → `php artisan config:clear` →
৫টি পেজ টেস্ট করো → সব আগের মতো কাজ করছে কি?

এটি প্রমাণ করে যে বিপদে ফেরার পথ আছে। তারপর আবার `true` করো।

**ধাপ ৫: সিদ্ধান্ত**

✅ শূন্য console error + সব ফিচার কাজ করছে + kill-switch কাজ করছে:
```
git checkout master
git merge day2/turbo-drive --no-ff -m "merge: Day 2 Turbo Drive SPA navigation"
git tag -a day2-complete -m "Day 2: Turbo Drive, script migration, plugin cleanup, form handling"
```

❌ নয়তো merge করবে না, Blockers-এ লিখো।

### রিপোর্ট

ব্যবহারকারীকে বাংলায়:
| মেট্রিক | Turbo ছাড়া | Turbo সহ |
| পেজ navigation সময় | | |
| প্রতি navigation-এ transferred KB | | |
| Lighthouse mobile (storefront) | | |
| Lighthouse mobile (admin) | | |

এবং: ২৫টি পেজের মধ্যে কতটি সম্পূর্ণ ঠিক, কোথায় সমস্যা আছে,
Day 3-এ যাওয়া নিরাপদ কি না।
```

---

## প্রম্পট ৯ — Redis + OPcache + backend tuning (Day 3)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md

⚠️ যাচাই করো: `git tag -l` এ `day2-complete` আছে কি? না থাকলে থামো।

branch:
cd C:\laragon\www\ecommercego
git checkout -b day3/pwa-workbox

### প্রেক্ষাপট

`.env`-এ বর্তমানে:
```
CACHE_DRIVER=file
CACHE_STORE=file
SESSION_DRIVER=file
REDIS_HOST=127.0.0.1
```

file-based cache মানে প্রতিটি cache read/write ডিস্কে যায়। multi-store SaaS-এ
প্রতি রিকোয়েস্টে store setting, theme setting, plan, currency — সব cache থেকে
আসে। file driver-এ এটি বড় বাধা।

প্রজেক্টে `genealabs/laravel-model-caching` আছে — অর্থাৎ model-level caching-এর
ভিত্তি তৈরি, কিন্তু file driver-এ তার সুবিধা কম।

### তোমার কাজ (CLAUDE-9)

**ধাপ ১: Redis আছে কি যাচাই করো**

Laragon-এ Redis থাকতে পারে বা নাও থাকতে পারে। যাচাই করো:
- Redis service চলছে কি (port 6379)
- PHP-তে `phpredis` extension বা `predis` আছে কি
  (`php -m` দেখো, এবং `composer show | grep predis`)

⚠️ Redis না থাকলে **install করার চেষ্টা করবে না** — সেটি ব্যবহারকারীর সিস্টেমে
বড় পরিবর্তন। পরিবর্তে:
- Blockers-এ লিখো Redis নেই
- বিকল্প হিসেবে `CACHE_STORE=database` ব্যবহার করো (file-এর চেয়ে ভালো,
  Redis-এর চেয়ে খারাপ) — কিন্তু আগে `cache` table আছে কি দেখো
- ব্যবহারকারীকে জানাও Redis install করলে আরও কত লাভ হবে

**ধাপ ২: before বেঞ্চমার্ক**

chrome-devtools MCP দিয়ে **server response time (TTFB)** মাপো:
- storefront হোমপেজ
- admin dashboard
- product list (DataTable ajax call)

`.ai/reports/benchmark.md`-এ লিখো।

এছাড়া query count জানতে চাইলে `barryvdh/laravel-debugbar` আছে —
`.env`-এ `DEBUGBAR_ENABLED=true` করে একটি পেজে query সংখ্যা দেখো, তারপর বন্ধ করো।

**ধাপ ৩: `.env` কনফিগার**

Redis থাকলে:
```
CACHE_DRIVER=redis
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_CLIENT=phpredis   (বা predis, যেটি আছে)
```

⚠️ `SESSION_DRIVER` বদলালে বর্তমান সব login session বাতিল হবে — এটি স্বাভাবিক,
ব্যবহারকারীকে জানাও যে আবার login করতে হবে।

`.env.example`-এও একই পরিবর্তন করো।

**ধাপ ৪: OPcache**

`php --ini` দিয়ে php.ini পাথ বের করো। OPcache সক্রিয় কি দেখো (`php -i | findstr opcache`)।

⚠️ php.ini হলো সিস্টেম ফাইল, প্রজেক্টের বাইরে। **নিজে থেকে পরিবর্তন করবে না।**
পরিবর্তে:
- বর্তমান অবস্থা রিপোর্ট করো
- প্রস্তাবিত সেটিং `.ai/reports/server-tuning.md`-এ লিখো
  (opcache.enable, memory_consumption, max_accelerated_files,
   validate_timestamps, jit)
- ব্যবহারকারীকে জিজ্ঞেস করো তিনি চান কি না আমি php.ini পরিবর্তন করি

**ধাপ ৫: Laravel optimize**

```
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

⚠️ সতর্কতা: `config:cache` চালু থাকলে `env()` function কাজ করা বন্ধ করে।
আমরা `env('TURBO_ENABLED')` ইত্যাদি blade-এ ব্যবহার করেছি — **এটি ভেঙে যাবে!**

তাই প্রথমে ঠিক করতে হবে: সব `env()` কে `config()` এ সরাতে হবে।
`config/app.php` এ একটি নতুন সেকশন যোগ করো:

```php
'spa' => [
    'turbo_enabled'       => env('TURBO_ENABLED', true),
    'legacy_tailwind_cdn' => env('LEGACY_TAILWIND_CDN', false),
    'legacy_admin_css'    => env('LEGACY_ADMIN_CSS', false),
    'pwa_enabled'         => env('PWA_ENABLED', true),
],
```

তারপর সব blade-এ `env('TURBO_ENABLED', true)` →
`config('app.spa.turbo_enabled')` এ বদলাও।

⚠️ এটি অত্যন্ত গুরুত্বপূর্ণ — না করলে production-এ `config:cache` করার সাথে
সাথে সব kill-switch অচল হয়ে যাবে এবং কেউ বুঝবে না কেন।

`.htaccess`-এ gzip/brotli সক্রিয় কি দেখো (`mod_deflate`)। না থাকলে যোগ করো।

**ধাপ ৬: view cache ও Turbo**

`view:cache` চালানোর পর যাচাই করো blade পরিবর্তন এখনো কাজ করছে কি।
development-এ `view:cache` বিরক্তিকর হতে পারে — `.ai/reports/server-tuning.md`-এ
লিখো development vs production-এ কী চালানো উচিত।

### 🔴 ভেরিফিকেশন

1. TTFB আবার মাপো — before/after তুলনা
2. login কাজ করছে? (session driver বদলেছে)
3. cart persist হচ্ছে? (session-নির্ভর)
4. সব kill-switch এখনো কাজ করছে? — `config('app.spa.turbo_enabled')` টেস্ট করো:
   `.env`-এ `TURBO_ENABLED=false` → `php artisan config:clear` → যাচাই
5. ১০টি পেজ ঘুরে দেখো কিছু ভেঙেছে কি
6. DataTable ajax কাজ করছে?
7. file upload কাজ করছে?

### সম্পন্ন করার পর

১. `.ai/reports/server-tuning.md` — বর্তমান অবস্থা, প্রস্তাব, before/after TTFB
২. `.ai/PROGRESS.md`-এ CLAUDE-9 → ✅ DONE
৩. commit:
git add -A
git commit -m "perf(backend): move kill-switches to config, enable cache drivers  [CLAUDE-9]"
৪. বাংলায় রিপোর্ট: TTFB কত থেকে কত, Redis পাওয়া গেছে কি,
   php.ini নিয়ে ব্যবহারকারীর সিদ্ধান্ত দরকার কি
```

---

## প্রম্পট ১০ — Workbox service worker (Day 3)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/pwa-ui.md   ← BULK মডেল তৈরি করেছে (BULK-5), থাকলে

branch: git checkout day3/pwa-workbox

### সমস্যা (P4) — বর্তমান PWA ক্ষতিকর

`serviceWorker.js` (২৬ লাইন) যা করে:
```js
const assets = [];                          // খালি precache list
caches.match(request).then(res => res || fetch(request))   // সব GET cache-first
```

এর মানে:
- **প্রতিটি HTML পেজ চিরকালের জন্য cache হয়ে যায়** — ব্যবহারকারী পুরনো
  product price, পুরনো stock দেখবে
- cache-এর কোনো version নেই, কোনো expiry নেই, কোনো cleanup নেই
- নতুন deploy করলেও ব্যবহারকারী পুরনো সাইট দেখতে থাকবে
- এটি performance বাড়ায় না, শুধু ভুল ডেটা দেখায়

**এটি একটি e-commerce সাইটে গুরুতর সমস্যা** — ভুল দাম দেখানো মানে ব্যবসায়িক ক্ষতি।

`resources/views/front_end/jQueryRoute.blade.php:186-195` এ এটি register হয়,
এবং `themes/*/views/front_end/layouts/app.blade.php:29-30` এ per-store
manifest link আছে।

### তোমার কাজ (CLAUDE-10)

**ধাপ ১: Workbox যোগ করো**

`vite-plugin-pwa` অথবা সরাসরি `workbox-build` — তুমি সিদ্ধান্ত নাও কোনটি
এই প্রজেক্টে ভালো খাটবে। বিবেচনা করো:
- এটি Laravel Blade, কোনো JS-framework SPA নয় — তাই `injectManifest`
  মোড সম্ভবত ভালো (আমরা নিজে SW লিখব, Workbox শুধু precache list দেবে)
- per-store manifest দরকার (৩+ store, প্রতিটির আলাদা নাম/icon)
- version pin করবে

**ধাপ ২: `resources/js/sw.js` লেখো — caching strategy**

| রিসোর্স | Strategy | কারণ |
|---|---|---|
| HTML (navigation) | **NetworkFirst**, timeout 3s, fallback offline page | দাম/stock সবসময় তাজা চাই |
| Vite build asset (hashed) | **CacheFirst**, ১ বছর | hash আছে, বদলালে নতুন URL |
| font | CacheFirst, ১ বছর | কখনো বদলায় না |
| image (product) | **StaleWhileRevalidate**, max ১০০টি, ৩০ দিন | দ্রুত দেখাবে, পটভূমিতে আপডেট |
| `/api/*` GET | **NetworkFirst**, timeout 5s | Vue island-এর ডেটা |
| `/api/*` POST/PUT | **NetworkOnly** | cart/order — কখনো cache নয় |
| admin পেজ | **NetworkOnly** | কখনো stale admin ডেটা নয় |
| CSRF/session-নির্ভর কিছু | NetworkOnly | নিরাপত্তা |

**🔴 কঠোর নিরাপত্তা নিয়ম — এগুলো ভাঙা যাবে না:**
- login/logout/register/password রুট → **কখনো cache নয়**
- checkout/payment রুট → **কখনো cache নয়**
- cart/order/account রুট → **কখনো cache নয়** (একজনের ডেটা অন্যজন দেখতে পারে)
- `Set-Cookie` header যুক্ত response → cache নয়
- 4xx/5xx response → cache নয়
- শুধু `same-origin` request cache হবে

**ধাপ ৩: version ও cleanup**
- `skipWaiting` ও `clientsClaim` — কিন্তু সতর্কতার সাথে (form সাবমিটের মধ্যে
  SW বদলালে সমস্যা হতে পারে; তুমি সিদ্ধান্ত নাও)
- পুরনো cache মুছে ফেলা (`cleanupOutdatedCaches`)
- **পুরনো `serviceWorker.js` unregister করার কোড** — কারণ ব্যবহারকারীদের
  ব্রাউজারে ইতিমধ্যে সেই ভাঙা SW ইনস্টল হয়ে থাকতে পারে। নতুন SW প্রথম
  চালু হলে সব পুরনো cache মুছবে।

**ধাপ ৪: kill-switch**

`config('app.spa.pwa_enabled')` false হলে:
- SW register হবে না
- এবং **ইতিমধ্যে register থাকা SW unregister হবে** — এটিই আসল kill-switch,
  নয়তো একবার SW বসে গেলে বন্ধ করা কঠিন

`resources/js/sw-register.js` এ এই লজিক লেখো।

**ধাপ ৫: পুরনো কোড প্রতিস্থাপন**

`resources/views/front_end/jQueryRoute.blade.php:186-195` এর পুরনো register
কোড সরাও, নতুন `@vite(['resources/js/sw-register.js'])` দাও।
পুরনো `serviceWorker.js` ফাইল **মুছবে না** (ইতিহাসের জন্য), কিন্তু আর ব্যবহার হবে না।

`store->enable_pwa_store == 'on'` শর্তটি বজায় রাখো — এটি per-store PWA
চালু/বন্ধ করার বিদ্যমান ফিচার।

**ধাপ ৬: offline page route**

BULK মডেল `resources/views/front_end/offline.blade.php` বানিয়েছে (BULK-5)।
এটির জন্য একটি route দরকার। কিন্তু `routes/web.php` নিষিদ্ধ...

সমাধান: SW-এর precache list-এ offline HTML-টি একটি static ফাইল হিসেবে রাখো।
build সময়ে blade-টি render করে `public/offline.html` এ লিখে দাও (একটি artisan
command বা vite plugin দিয়ে)। তাহলে route লাগবে না।

### 🔴 ভেরিফিকেশন — খুব যত্নে, নিরাপত্তা জড়িত

Playwright দিয়ে:
1. SW register হয়েছে কি (`navigator.serviceWorker.controller`)
2. DevTools Application → Cache Storage-এ কী কী cache হয়েছে দেখো
3. **কোনো login/checkout/cart/account URL cache-এ আছে কি? থাকলে গুরুতর বাগ**
4. product দাম বদলে দাও (admin থেকে) → storefront reload → নতুন দাম দেখায়?
   (NetworkFirst কাজ করছে প্রমাণ)
5. offline mode চালু করো → পেজ reload → offline page দেখায়?
6. offline-এ থাকা অবস্থায় আগে দেখা পেজে যাও → cached version দেখায়?
7. আবার online → নিজে থেকে reload হয়?
8. দুইজন আলাদা ব্যবহারকারী হিসেবে login করো → একজনের cart অন্যজন দেখছে না
   তা নিশ্চিত করো (**সবচেয়ে গুরুত্বপূর্ণ নিরাপত্তা টেস্ট**)
9. kill-switch: `PWA_ENABLED=false` → SW unregister হচ্ছে?
10. মোবাইল viewport-এ সব একই টেস্ট

⛔ ৩ ও ৮ নম্বরে সমস্যা পেলে **সাথে সাথে থামো** — এটি ডেটা leak, ব্যবসায়িক
বিপর্যয়। `PWA_ENABLED=false` করে Blockers-এ লিখো।

### সম্পন্ন করার পর

১. `.ai/reports/pwa-caching.md` — কোন রুট কোন strategy, কী cache হয় না, কেন
২. `.ai/PROGRESS.md`-এ CLAUDE-10 → ✅ DONE
৩. commit:
git add -A
git commit -m "feat(pwa): replace broken service worker with Workbox strategies  [CLAUDE-10]"
৪. বাংলায় রিপোর্ট: পুরনো SW কী ক্ষতি করত, এখন কী হয়, নিরাপত্তা টেস্ট পাস করেছে কি
```

---

## প্রম্পট ১১ — Per-store manifest generator (Day 3)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/pwa-caching.md

branch: git checkout day3/pwa-workbox

### প্রেক্ষাপট

এটি multi-store SaaS। প্রতিটি দোকানের আলাদা নাম, logo, রঙ। তাই যখন কোনো
ক্রেতা "Add to Home Screen" করবে, তার ফোনে **সেই দোকানের** নাম ও logo দেখাতে হবে
— আমাদের প্ল্যাটফর্মের নাম নয়। এটি বিক্রির একটি বড় যুক্তি।

বর্তমান কোড: `themes/*/views/front_end/layouts/app.blade.php:29-30`
```blade
<link rel="manifest" href="{{ asset('storage/uploads/customer_app/store_' . $store->id . '/manifest.json') }}" />
```

অর্থাৎ প্রতিটি store-এর জন্য একটি ফাইল প্রত্যাশিত। কিন্তু:
- এই ফাইল কে তৈরি করে? আছে কি? যাচাই করো
- না থাকলে 404 → manifest নেই → PWA installable নয়

### তোমার কাজ (CLAUDE-11)

**ধাপ ১: বর্তমান অবস্থা তদন্ত করো**

- `storage/app/public/uploads/customer_app/` বা `public/storage/uploads/customer_app/`
  ফোল্ডারে কোনো `store_*/manifest.json` আছে কি?
- কোনো controller বা command এটি তৈরি করে কি? খোঁজো:
  `manifest` শব্দ দিয়ে `app/` এবং `packages/` এ search করো
- `php artisan storage:link` করা আছে কি? (`public/storage` symlink)
- `Store` model-এ কী কী field আছে যা manifest-এ লাগবে:
  name, logo, favicon, theme color, slug

`.ai/reports/manifest-audit.md`-এ লিখো।

**ধাপ ২: সমাধানের পথ বাছো**

দুইটি পথ আছে, তুমি বাছবে:

**পথ ক — Static file generation (artisan command)**
`app/Console/Commands/GenerateStoreManifest.php` নতুন ফাইল।
প্রতিটি store-এর জন্য JSON লিখবে। store তৈরি/সম্পাদনার সময় চালাতে হবে।
সুবিধা: দ্রুত (static file)। অসুবিধা: store setting বদলালে পুরনো থেকে যায়।

**পথ খ — Dynamic route**
`/{slug}/manifest.json` route যা runtime-এ JSON তৈরি করে।
সুবিধা: সবসময় তাজা। অসুবিধা: `routes/web.php` পরিবর্তন লাগে ❌ (নিষিদ্ধ)।

⚠️ কিন্তু একটি তৃতীয় পথ আছে যা upstream-safe:
**পথ গ — নতুন module**
`packages/workdo/PwaManifest/` — একটি নতুন module যার নিজের route ফাইল থাকবে।
প্রজেক্টের module system ইতিমধ্যে কাজ করছে (`packages/workdo/LandingPage` উদাহরণ)।
এতে core-এর কোনো ফাইল ছোঁয়া লাগবে না, এবং WorkDo update-এ অক্ষত থাকবে।

**পথ গ বেছে নাও।** এটি একইসাথে ভবিষ্যতের ২০-২৫টি ফিচারের জন্য একটি টেমপ্লেট
তৈরি করবে — ব্যবহারকারী পরে এই প্যাটার্ন অনুসরণ করে ফিচার যোগ করবেন।

**ধাপ ৩: module তৈরি করো**

`packages/workdo/LandingPage/` এর গঠন হুবহু পড়ো এবং একই প্যাটার্ন অনুসরণ করো:
- `composer.json`
- `src/Providers/PwaManifestServiceProvider.php`
- `Routes/web.php`
- `src/Http/Controllers/ManifestController.php`

controller যা করবে: store slug নিয়ে, store খুঁজে, একটি JSON response দেবে।

**manifest-এ যা থাকবে:**
```json
{
  "name": "<store name>",
  "short_name": "<store name, ১২ অক্ষরে ছোট করা>",
  "start_url": "/<slug>?source=pwa",
  "scope": "/<slug>",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "<store setting থেকে বা #ffffff>",
  "theme_color": "<store setting থেকে>",
  "icons": [ 192x192, 512x512, maskable ],
  "categories": ["shopping"],
  "lang": "<store language>",
  "dir": "ltr বা rtl"
}
```

⚠️ **icon সমস্যা:** PWA-র জন্য ঠিক 192×192 ও 512×512 PNG দরকার। দোকানের logo
যেকোনো সাইজের হতে পারে। সমাধান:
- Intervention Image বা GD দিয়ে resize করো, অথবা
- logo না থাকলে/ভুল সাইজ হলে একটি ডিফল্ট icon দাও (কিন্তু নীরবে নয় —
  admin-কে জানানোর ব্যবস্থা রাখো)

তুমি যা সহজ ও নির্ভরযোগ্য মনে করো করো, কিন্তু **কখনো ভাঙা manifest দেবে না** —
ভাঙা manifest মানে "install" বোতাম আসবে না।

**ধাপ ৪: layout আপডেট**

`themes/*/views/front_end/layouts/app.blade.php` এ manifest link নতুন
route-এ পরিবর্তন করো। সাথে যোগ করো (যদি না থাকে):
```blade
<meta name="theme-color" content="...">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="...">
<link rel="apple-touch-icon" href="...">
```
iOS Safari manifest-এর icon ব্যবহার করে না, `apple-touch-icon` লাগে।

**ধাপ ৫: BULK মডেলের install prompt যোগ করো**

`resources/views/front_end/partison/pwa-install.blade.php` (BULK-5)
storefront layout-এ include করো। পুরনো install prompt কোড
(`jQueryRoute.blade.php:199-260`) সরাও।

### 🔴 ভেরিফিকেশন

Playwright/chrome-devtools দিয়ে:
1. `/{slug}/manifest.json` ব্রাউজারে খোলো → বৈধ JSON আসছে?
2. DevTools → Application → Manifest → কোনো error/warning আছে?
3. "Installability" সেকশনে কী বলছে? — installable হতে হবে
4. দুইটি আলাদা store-এ যাও → আলাদা নাম ও logo দেখাচ্ছে?
5. icon URL গুলো ২০০ দিচ্ছে? (404 নয়)
6. মোবাইল viewport-এ install banner দেখা যাচ্ছে?
7. banner-এ "পরে" চাপলে ৭ দিন আর আসছে না? (localStorage যাচাই)
8. `enable_pwa_store = 'off'` করা store-এ manifest link নেই?

স্ক্রিনশট: `.ai/screenshots/day3/`

### সম্পন্ন করার পর

১. `.ai/reports/manifest-audit.md` সম্পূর্ণ করো
২. **PROJECT_CONTEXT.md আপডেট করো** — নতুন module-এর প্যাটার্ন নথিভুক্ত করো,
   কারণ ব্যবহারকারী ভবিষ্যতে ২০-২৫টি ফিচার এভাবেই যোগ করবেন
৩. `.ai/PROGRESS.md`-এ CLAUDE-11 → ✅ DONE
৪. commit:
git add -A
git commit -m "feat(pwa): per-store manifest via new PwaManifest module  [CLAUDE-11]"
৫. বাংলায় রিপোর্ট: প্রতি দোকানের আলাদা app icon/নাম কাজ করছে কি,
   এবং ভবিষ্যতে নতুন ফিচার কীভাবে যোগ করতে হবে (module প্যাটার্ন)
```

---

## প্রম্পট ১২ — Day 3 চূড়ান্ত টেস্ট ও merge (Day 3)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/pwa-caching.md
4. .ai/reports/benchmark.md

branch: git checkout day3/pwa-workbox

### তোমার কাজ (CLAUDE-12): Day 3 যাচাই ও merge

**ধাপ ১:** CLAUDE-9, CLAUDE-10, CLAUDE-11, BULK-5 সব ✅ DONE কি যাচাই করো।

**ধাপ ২: PWA পূর্ণ টেস্ট**

মোবাইল viewport (412×915), Playwright + chrome-devtools দিয়ে:

**ইনস্টলযোগ্যতা**
1. manifest বৈধ, কোনো warning নেই
2. SW সক্রিয় ও নিয়ন্ত্রণে
3. Lighthouse PWA audit — সব পাস
4. install banner আসছে, কাজ করছে

**অফলাইন আচরণ**
5. অফলাইনে নতুন পেজ → offline page দেখায়
6. অফলাইনে আগে দেখা পেজ → cached দেখায়
7. অনলাইন হলে auto reload
8. অফলাইনে cart-এ যোগ করার চেষ্টা → স্পষ্ট বার্তা দেয় (নীরবে ব্যর্থ হয় না)

**তাজা ডেটা (সবচেয়ে গুরুত্বপূর্ণ)**
9. admin থেকে দাম বদলাও → storefront-এ নতুন দাম
10. admin থেকে stock ০ করো → storefront-এ out of stock
11. নতুন product যোগ করো → listing-এ দেখা যায়
12. banner বদলাও → হোমপেজে নতুন banner

**নিরাপত্তা (আবার — এটি বাদ দিও না)**
13. ব্যবহারকারী A হিসেবে login → cart-এ item → logout
14. ব্যবহারকারী B হিসেবে login → A-র cart দেখা যায় কি? → **অবশ্যই না**
15. Cache Storage-এ কোনো `/cart`, `/checkout`, `/account`, `/login` URL আছে কি?
    → **অবশ্যই না**
16. logout করার পর cached পেজে back → ব্যক্তিগত তথ্য দেখা যায় কি? → না

**Backend**
17. TTFB before/after তুলনা
18. সব kill-switch: `TURBO_ENABLED`, `PWA_ENABLED`, `LEGACY_TAILWIND_CDN`,
    `LEGACY_ADMIN_CSS` — চারটিই আলাদা আলাদা টেস্ট করো
19. `php artisan config:cache` চালানোর পরেও kill-switch কাজ করছে?
    (CLAUDE-9 এ যা ঠিক করেছি)

**Regression**
20. Day 1 ও Day 2-এর ২৫টি পেজ আবার দ্রুত ঘুরে দেখো — কিছু ভাঙেনি?

**ধাপ ৩: সিদ্ধান্ত**

✅ সব পাস (বিশেষ করে ১৩-১৬ নিরাপত্তা টেস্ট):
```
git checkout master
git merge day3/pwa-workbox --no-ff -m "merge: Day 3 PWA, Workbox, backend tuning"
git tag -a day3-complete -m "Day 3: Workbox PWA, per-store manifest, cache drivers"
```

❌ নিরাপত্তা টেস্ট ব্যর্থ হলে merge করবে না — `PWA_ENABLED=false` রেখে
Blockers-এ লিখো, ব্যবহারকারীকে স্পষ্ট ভাষায় জানাও এটি ডেটা leak।

### রিপোর্ট

বাংলায় একটি টেবিল:
| আইটেম | অবস্থা |
| PWA installable | |
| Offline page | |
| তাজা দাম/stock | |
| ব্যবহারকারী ডেটা আলাদা (নিরাপত্তা) | |
| TTFB উন্নতি | |
| Lighthouse PWA | |
| চারটি kill-switch | |

এবং: Day 4-এ যাওয়া নিরাপদ কি না।
```

---

## প্রম্পট ১৩ — Skeleton loader + instant navigation feel (Day 4)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/mobile-audit.md   ← Gemini (GEMINI-4), থাকলে

⚠️ যাচাই করো `git tag -l` এ `day3-complete` আছে কি।

branch:
cd C:\laragon\www\ecommercego
git checkout -b day4/mobile-polish

### প্রেক্ষাপট

Turbo বসানোর পর navigation দ্রুত, কিন্তু এখনো "app-এর মতো" লাগে না। কারণ:
- Turbo cache থাকলে instant, কিন্তু cache না থাকলে ৩০০-৮০০ms ফাঁকা অপেক্ষা
- সেই সময় ব্যবহারকারী কিছুই দেখে না → মনে হয় আটকে গেছে
- native app-এ এই সময় skeleton বা placeholder দেখায়

### তোমার কাজ (CLAUDE-13)

**ধাপ ১: Turbo progress bar কাস্টমাইজ**

Turbo-র ডিফল্ট progress bar ৫০০ms পরে দেখায়। মোবাইলে সেটি কমাও (~১৫০ms)
এবং স্টাইল করো — পাতলা, উপরে, ব্র্যান্ড রঙে। CSS: `.turbo-progress-bar`

**ধাপ ২: Skeleton overlay**

`resources/js/skeleton.js` + `resources/css/skeleton.css`

আচরণ:
- `turbo:visit` এ skeleton দেখাও, কিন্তু **সাথে সাথে নয়** — ১৫০ms পরে।
  কারণ navigation ১০০ms-এ শেষ হলে skeleton ঝলক দিলে বিরক্তিকর লাগে।
- `turbo:load` এ সরাও
- Turbo preview (cached) দেখানো হলে skeleton দেখাবে না
  (`document.documentElement.hasAttribute('data-turbo-preview')` চেক)
- pulse animation, কিন্তু `prefers-reduced-motion` সম্মান করবে

⚠️ skeleton overlay হবে, layout shift তৈরি করবে না (CLS বাড়ালে উল্টো ক্ষতি)।

**ধাপ ৩: Link tap-এ তাৎক্ষণিক প্রতিক্রিয়া**

tap করা link/button-এ সাথে সাথে `:active` স্টাইল (scale বা opacity)।
CSS-এ করবে, JS নয় — JS দিয়ে করলে দেরি হবে।

**ধাপ ৪: Turbo prefetch (সতর্কতার সাথে)**

Turbo 8-এ `data-turbo-prefetch` আছে, যা navigation প্রায় instant করে।

⚠️ ঝুঁকি: ৫০টি product link থাকা listing পেজে সব prefetch হলে server-এ চাপ।

তাই:
- শুধু: main nav, bottom nav, pagination
- product card-এ চালু করবে **না**
- POST/delete link-এ কখনো নয়
- সিদ্ধান্ত ও কারণ `.ai/reports/prefetch-policy.md`-এ লিখো

**ধাপ ৫: Scroll অবস্থা**

listing পেজে নিচে scroll → product-এ যাও → back → একই জায়গায় ফিরেছে কি
যাচাই করো। না হলে ঠিক করো।

### 🔴 ভেরিফিকেশন

Playwright দিয়ে মোবাইল viewport-এ:
1. cached navigation → skeleton দেখা যায় না (instant)
2. uncached navigation → skeleton দেখা যায়, তারপর content
3. খুব দ্রুত navigation-এ skeleton ঝলক দেয় না
4. CLS মাপো — skeleton যোগ করার পরেও ০.১-এর নিচে?
5. listing → detail → back → scroll অবস্থান ঠিক
6. prefetch যেখানে চাইছি সেখানেই হচ্ছে (network দেখে যাচাই)
7. tap করলে সাথে সাথে ভিজ্যুয়াল প্রতিক্রিয়া
8. Lighthouse — CLS ও TBT খারাপ হয়নি

স্ক্রিনশট: `.ai/screenshots/day4-skeleton/`

### সম্পন্ন করার পর

১. `.ai/reports/prefetch-policy.md`
২. `.ai/PROGRESS.md`-এ CLAUDE-13 → ✅ DONE
৩. commit:
git add -A
git commit -m "feat(ux): skeleton loader, progress bar, selective prefetch  [CLAUDE-13]"
৪. বাংলায় রিপোর্ট: navigation এখন কত ms, CLS বাড়েনি তো
```

---

## প্রম্পট ১৪ — মোবাইল টাচ ও ভিউপোর্ট পলিশ (Day 4)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/mobile-audit.md   ← Gemini-র তালিকা, এটিই কাজের ভিত্তি

branch: git checkout day4/mobile-polish

### প্রেক্ষাপট — প্রজেক্টের সর্বোচ্চ প্রাধান্য

ব্যবহারকারীর স্পষ্ট দাবি: মোবাইল ব্রাউজারে যেন **native app-এর মতো** লাগে।
কারণ (ক) দোকানদাররা মোবাইল থেকে admin চালাবেন, (খ) ক্রেতারা প্রায় সবাই মোবাইল।

এগুলো ছোট ছোট বিষয়, কিন্তু একসাথে "ওয়েবসাইট" আর "অ্যাপ"-এর অনুভূতিগত
পার্থক্য গড়ে দেয়।

### তোমার কাজ (CLAUDE-14)

`resources/css/mobile-app-feel.css` তৈরি করো (প্রয়োজনে ছোট JS)।

**১. Viewport ও zoom**

`resources/views/layouts/app.blade.php:57` এ বর্তমানে `user-scalable=0`।
এটি accessibility লঙ্ঘন এবং Lighthouse-এ পয়েন্ট কাটে।

সমাধান: `user-scalable=0` সরাও, কিন্তু iOS input auto-zoom সমস্যা অন্যভাবে
ঠিক করো — মোবাইলে সব input/select/textarea-এ `font-size: 16px`।

⚠️ শুধু `max-width: 767px`-এ প্রয়োগ করো এবং স্ক্রিনশটে যাচাই করো ফর্ম ঠিক দেখাচ্ছে।

**২. উচ্চতা (`100vh` সমস্যা)**

iOS Safari-তে `100vh` কাটা পড়ে। সব `100vh` → `100dvh` (fallback সহ):
```css
height: 100vh;   /* পুরনো ব্রাউজার */
height: 100dvh;  /* আধুনিক */
```

**৩. Safe area (iPhone notch ও home indicator)**
- fixed header → `padding-top: env(safe-area-inset-top)`
- fixed bottom nav → `padding-bottom: env(safe-area-inset-bottom)`
- viewport meta-তে `viewport-fit=cover` লাগবে

**৪. স্ক্রল আচরণ**
- `overscroll-behavior-y: contain` — rubber-band বন্ধ
- `-webkit-overflow-scrolling: touch`
- modal খোলা থাকলে body scroll lock — বিদ্যমান modal এটি করে কি যাচাই করো

**৫. টাচ প্রতিক্রিয়া**
- `-webkit-tap-highlight-color: transparent`, কিন্তু বিকল্প `:active` প্রতিক্রিয়া দাও
- `touch-action: manipulation` — ৩০০ms double-tap-zoom দেরি সরায়
- Gemini-র রিপোর্টে পাওয়া ৪৪×৪৪px-এর ছোট touch target বড় করো

**৬. টেক্সট নির্বাচন**
- button/nav-এ `user-select: none`
- কিন্তু content, price, product name-এ select চালু রাখো

**৭. ফর্ম keyboard**
- ফোন → `type="tel"` + `inputmode="numeric"`
- ইমেইল → `type="email"`
- সংখ্যা → `inputmode="decimal"`
- সার্চ → `type="search"` + `enterkeyhint="search"`

⚠️ শুধু **সবচেয়ে বেশি ব্যবহৃত ১০টি ফর্মে** করো — সব করতে গেলে সময় শেষ, লাভ কম।

**৮. Address bar রঙ**
`<meta name="theme-color">` — store-এর ব্র্যান্ড রঙে। dark mode-এ আলাদা
(`media` attribute সহ)।

**৯. স্থিতিশীল sidebar (admin)**
Turbo navigation-এর পর sidebar বন্ধ অবস্থায় ফিরবে, কিন্তু scroll অবস্থান
মনে রাখবে। যাচাই ও ঠিক করো।

### 🔴 ভেরিফিকেশন

Playwright দিয়ে **একাধিক ডিভাইস আকারে**:
- 360×640 (ছোট Android)
- 412×915 (সাধারণ Android)
- 390×844 (iPhone 14)
- 768×1024 (tablet)

প্রতিটিতে ১০টি পেজ (৫ storefront, ৫ admin):
1. কোনো horizontal scroll নেই
   (`document.documentElement.scrollWidth > window.innerWidth` যাচাই)
2. fixed element কনটেন্ট ঢাকছে না
3. সব বোতাম tap করার মতো বড়
4. ফর্মে সঠিক keyboard
5. modal পুরো স্ক্রিন ব্যবহার করে
6. কোনো টেক্সট কাটা পড়েনি
7. zoom করা যায় (accessibility)
8. input-এ tap করলে auto-zoom হয় না

Lighthouse accessibility ও best-practices স্কোরও দেখো।

স্ক্রিনশট: `.ai/screenshots/day4-devices/`

### সম্পন্ন করার পর

১. `.ai/PROGRESS.md`-এ CLAUDE-14 → ✅ DONE
২. commit:
git add -A
git commit -m "feat(mobile): app-like touch, viewport, safe-area polish  [CLAUDE-14]"
৩. বাংলায় রিপোর্ট: কোন ডিভাইসে কী ঠিক হয়েছে, accessibility স্কোর কত বেড়েছে
```

---

## প্রম্পট ১৫ — Vue 3 island: cart drawer + variant selector (Day 4)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. routes/api.php   ← ১৬১টি রেডি endpoint, এখান থেকে ডেটা নেবে

branch: git checkout day4/mobile-polish

### প্রেক্ষাপট

এখন পর্যন্ত সব কাজ Blade + Turbo দিয়ে হয়েছে। কিন্তু চারটি জায়গায় সত্যিকারের
reactive UI দরকার, যেখানে server round-trip ছাড়া তাৎক্ষণিক প্রতিক্রিয়া চাই:

1. **Cart drawer** — item যোগ/বাদ, quantity বদল → সাথে সাথে total আপডেট
2. **Variant selector** — size/color বাছলে দাম, ছবি, stock সাথে সাথে বদলাবে
3. **Search suggest** — টাইপ করতে করতে suggestion
4. **Quantity + price calc** — কোনো reload নয়

এগুলোতেই ব্যবহারকারী সবচেয়ে বেশি "app কি না" বিচার করে।

⚠️ এটি **island** — পুরো পেজ Vue নয়, শুধু এই ছোট অংশগুলো। বাকি সব Blade।

### তোমার কাজ (CLAUDE-15)

**ধাপ ১: API endpoint ম্যাপ করো**

`routes/api.php` পড়ে বের করো কোন endpoint কী দেয়:
- `{slug}/add-cart`, `{slug}/cart-list`, `{slug}/cart-qty`, `{slug}/cart-check`
- `{slug}/check-variant-stock`
- `{slug}/search`, `{slug}/search-guest`
- `{slug}/wishlist`

প্রতিটির request/response আকার `.ai/reports/api-contract.md`-এ নথিভুক্ত করো।
**অনুমান করবে না** — controller (`app/Http/Controllers/Api/ApiController.php`)
পড়ে আসল আকার দেখো।

⚠️ auth: এই endpoint গুলো `custom.auth` middleware ব্যবহার করে (Sanctum token)।
কিন্তু storefront-এ ব্যবহারকারী **session**-এ login করা। এই দুইটি কীভাবে
মেলাবে সেটিই মূল প্রশ্ন। বিকল্প:
- session থেকে একটি Sanctum token তৈরি করে Blade-এ inject করা
- অথবা web guard-এ কাজ করে এমন বিদ্যমান ajax endpoint খুঁজে বের করা
  (`routes/customer.php`-তে ৯৮টি route আছে, সেখানে দেখো)

**পরের পথটি সম্ভবত ভালো** — কারণ session-ভিত্তিক, নতুন auth লজিক লাগে না।
`routes/customer.php` এবং `routes/web.php`-এ storefront-এর বিদ্যমান ajax
route খুঁজে সেগুলোই ব্যবহার করো। সিদ্ধান্ত রিপোর্টে লিখো।

**ধাপ ২: Island registry**

`resources/js/island-registry.js`:
```js
// একটি ছোট registry যা:
// - data-island="cart-drawer" attribute দেখে component mount করে
// - turbo:load এ নতুন island খুঁজে mount করে
// - turbo:before-cache এ সব unmount করে (memory leak রোধ)
// - একই element-এ দুইবার mount করে না
// - component না থাকলে চুপচাপ ছেড়ে দেয় (blade fallback দেখাবে)
```

⚠️ Gemini সঠিকভাবে সতর্ক করেছে — mount/unmount lifecycle ছাড়া memory leak হবে।
এই registry-ই সেই সমস্যার কেন্দ্রীয় সমাধান, প্রতিটি island-এ হাতে লেখা নয়।

**ধাপ ৩: Component তৈরি করো**

`resources/js/islands/CartDrawer.vue`
`resources/js/islands/VariantSelector.vue`

শর্ত:
- **progressive enhancement**: Blade ইতিমধ্যে যা render করে সেটিই থাকবে;
  Vue শুধু তার উপরে বসবে। JS ব্যর্থ হলে পুরনো jQuery আচরণ কাজ করবে।
- ডিজাইন **হুবহু** বর্তমান মতো — নতুন কিছু নয়। বর্তমান cart drawer-এর
  HTML/CSS পড়ে সেটিই Vue template-এ আনো।
- optimistic UI: quantity বদলালে সাথে সাথে দেখাবে, তারপর server নিশ্চিত করবে;
  ব্যর্থ হলে আগের অবস্থায় ফিরবে + বার্তা
- loading ও error অবস্থা থাকবে
- CSRF token পাঠাবে (`meta[name="csrf-token"]`)

**ধাপ ৪: Blade-এ যোগ করো**

বর্তমান cart drawer-এর HTML-এ `data-island="cart-drawer"` যোগ করো।
পুরনো jQuery কোড **মুছবে না** — kill-switch হিসেবে রাখো:
```blade
@if (config('app.spa.vue_islands', true))
    <div data-island="cart-drawer" ...>
@endif
```

### 🔴 ভেরিফিকেশন

Playwright দিয়ে মোবাইল viewport-এ:
1. product → add to cart → drawer খোলে, item দেখায়
2. quantity + → total সাথে সাথে বদলায়, কোনো reload নেই
3. item remove → সাথে সাথে চলে যায়
4. variant বাছো → দাম, ছবি, stock বদলায়
5. out of stock variant → add to cart বন্ধ থাকে
6. cart badge সংখ্যা ঠিক
7. পেজ reload → cart অবস্থা টিকে আছে (server-এ সংরক্ষিত)
8. Turbo navigate → back → drawer একটাই (duplicate mount নেই)
9. ১০ বার navigate → memory বাড়ছে কি (heap snapshot দিয়ে যাচাই করো)
10. kill-switch `vue_islands=false` → পুরনো jQuery আচরণ কাজ করে
11. network বন্ধ করে quantity বদলাও → স্পষ্ট error, নীরব ব্যর্থতা নয়
12. checkout পর্যন্ত পুরো ক্রয় প্রবাহ কাজ করে

⛔ ৭ ও ১২ নম্বর সবচেয়ে গুরুত্বপূর্ণ — cart ভাঙা মানে বিক্রি বন্ধ।
সমস্যা হলে `vue_islands=false` করে Blockers-এ লিখো।

### সম্পন্ন করার পর

১. `.ai/reports/api-contract.md`
২. `.ai/PROGRESS.md`-এ CLAUDE-15 → ✅ DONE
৩. commit:
git add -A
git commit -m "feat(vue): cart drawer and variant selector as Vue islands  [CLAUDE-15]"
৪. বাংলায় রিপোর্ট: কোন endpoint ব্যবহার করেছ, memory leak নেই তো,
   ক্রয় প্রবাহ অক্ষত কি
```

---

## প্রম্পট ১৬ — চূড়ান্ত টেস্ট, merge, হস্তান্তর (Day 4)

```
তুমি `C:\laragon\www\ecommercego` প্রজেক্টে কাজ করছ।

প্রথমে পড়ো:
1. .ai/PROJECT_CONTEXT.md
2. .ai/PROGRESS.md
3. .ai/reports/benchmark.md
4. `.ai/reports/` ফোল্ডারের সব রিপোর্ট

branch: git checkout day4/mobile-polish

### তোমার কাজ (CLAUDE-16): সম্পূর্ণ প্রজেক্ট যাচাই ও হস্তান্তর

**ধাপ ১: সব টাস্ক ✅ কি যাচাই করো**

`.ai/PROGRESS.md`-এর সব ৩২টি টাস্ক দেখো। যেগুলো ⬜ বা ❌ সেগুলো তালিকা করো
এবং ব্যবহারকারীকে জানাও — merge করার আগে সিদ্ধান্ত দরকার।

**ধাপ ২: সম্পূর্ণ regression — পুরো অ্যাপ**

চারটি ডিভাইস আকারে (360×640, 412×915, 390×844, 1440×900):

**Storefront — সম্পূর্ণ ক্রয় প্রবাহ (৩ বার, ৩টি আলাদা store-এ)**
1. হোমপেজ → slider, banner, featured product
2. category browse → filter, sort, pagination
3. search → suggestion → ফলাফল
4. product detail → variant → gallery → review
5. add to cart → drawer → quantity বদল
6. wishlist যোগ/বাদ
7. register → email verify (যদি থাকে)
8. login → account dashboard
9. address যোগ
10. checkout → shipping → payment পদ্ধতি বাছাই (আসল payment নয়)
11. order history → order detail
12. coupon প্রয়োগ

**Admin — দোকানদারের দৈনন্দিন কাজ (মোবাইল থেকে, কারণ এটিই আসল ব্যবহার)**
13. login → dashboard
14. product যোগ (image, variant, price, stock সহ)
15. product সম্পাদনা
16. category ব্যবস্থাপনা
17. order দেখা → status বদল → invoice
18. customer তালিকা → detail
19. coupon তৈরি
20. shipping/tax setting
21. report ও chart
22. theme customize
23. store setting
24. POS (যদি থাকে)

**Superadmin**
25. plan ব্যবস্থাপনা
26. store তালিকা → impersonate
27. setting

প্রতিটিতে: console error শূন্য, ভিজ্যুয়াল ঠিক, কাজ সম্পন্ন হয়।

**ধাপ ৩: চারটি kill-switch পৃথকভাবে টেস্ট**

একটি একটি করে false করো, `php artisan config:clear`, ৫টি পেজ যাচাই, আবার true:
- `TURBO_ENABLED=false`
- `PWA_ENABLED=false`
- `LEGACY_TAILWIND_CDN=true`
- `LEGACY_ADMIN_CSS=true`
- `vue_islands=false`

এগুলো কাজ করা মানে ব্যবহারকারীর হাতে সবসময় ফেরার পথ আছে।

**ধাপ ৪: চূড়ান্ত পরিমাপ**

`.ai/reports/benchmark.md`-এ "Final" সেকশন — baseline-এর সাথে তুলনা:

| মেট্রিক | baseline | final | লক্ষ্য | পাস? |
| storefront Lighthouse mobile | | | ≥85 | |
| admin Lighthouse mobile | | | ≥75 | |
| storefront প্রথম লোড KB | | | <400 | |
| storefront JS KB | | | | |
| request সংখ্যা | | | | |
| LCP mobile | | | <2.5s | |
| CLS | | | <0.1 | |
| TBT | | | <300ms | |
| Turbo navigation (cached) | | | <300ms | |
| TTFB | | | | |
| PWA installable | | | ✅ | |

**ধাপ ৫: merge**

✅ সব পাস:
```
git checkout master
git merge day4/mobile-polish --no-ff -m "merge: Day 4 mobile app-feel and Vue islands"
git tag -a v1.0-spa-pwa -m "SPA-like performance + PWA complete"
```

**ধাপ ৬: হস্তান্তর নথি লেখো**

`.ai/HANDOVER.md` তৈরি করো — এটি ব্যবহারকারীর দীর্ঘমেয়াদি রেফারেন্স:

1. **কী করা হয়েছে** — সরল ভাষায়, ব্যবসায়িক দৃষ্টিতে
2. **আগে vs পরে** — সংখ্যা সহ টেবিল
3. **কীভাবে চালাবে**
   - development: `npm run dev`
   - production: `npm run build` + `php artisan optimize`
   - deploy checklist
4. **সমস্যা হলে কী করবে**
   - প্রতিটি kill-switch কী করে, কখন ব্যবহার করবে
   - সম্পূর্ণ ফেরত: `git reset --hard baseline-v0`
   - প্রতিটি দিনে ফেরা: `git reset --hard day1-complete` ইত্যাদি
5. **WorkDo আপডেট এলে কী করবে** — ধাপে ধাপে
   - কোন ~১৫টি ফাইল আমরা বদলেছি (তালিকা)
   - কীভাবে diff নিয়ে আবার প্রয়োগ করবে
6. **নতুন ফিচার যোগ করার পদ্ধতি** — `packages/workdo/` module প্যাটার্ন,
   `PwaManifest` module-কে উদাহরণ ধরে (ব্যবহারকারীর ২০-২৫টি ফিচারের জন্য)
7. **যা করা হয়নি / ভবিষ্যতের সুযোগ**
   - বাকি দুই theme (greentic, techzonix) — একই প্যাটার্ন প্রয়োগ করতে হবে
   - বাকি Vue island (search suggest, checkout step)
   - SSR/SEO যদি পরে দরকার হয়
   - Redis/OPcache যদি এখনো না বসে
8. **পরিচিত সীমাবদ্ধতা** — সৎভাবে

**ধাপ ৭: PROGRESS.md চূড়ান্ত করো**

"বর্তমান পর্যায়" → "সম্পন্ন — v1.0-spa-pwa"

### চূড়ান্ত রিপোর্ট

ব্যবহারকারীকে বাংলায় দাও:
1. উপরের পূর্ণ মেট্রিক টেবিল
2. ৯০-৯৫% SPA লক্ষ্য পূরণ হয়েছে কি — সৎ উত্তর, অতিরঞ্জন নয়
3. মোবাইলে app-এর মতো লাগছে কি — স্ক্রিনশট রেফারেন্স সহ
4. কী কী এখনো বাকি বা ঝুঁকিপূর্ণ
5. মার্কেটে ডেমো দেখানোর জন্য প্রস্তুত কি না

⛔ যদি লক্ষ্য পূরণ না হয়ে থাকে, স্পষ্টভাবে বলো কোনটা হয়নি এবং কেন।
মিথ্যা আশ্বাস দিলে ব্যবহারকারী মার্কেটে গিয়ে বিপদে পড়বেন।
```

---

## ⚠️ Claude-এর জন্য সাধারণ নিয়ম

1. **প্রতিটি টাস্কে ব্রাউজার টেস্ট বাধ্যতামূলক।** কোড লিখে "কাজ করবে" বলা যাবে না — Playwright দিয়ে প্রমাণ করতে হবে।
2. **প্রতিটি পরিবর্তনে kill-switch।** ফেরার পথ ছাড়া কিছু বসাবে না।
3. **মেট্রিক ছাড়া দাবি নয়।** "দ্রুত হয়েছে" নয় — "৮২০ KB থেকে ৩১০ KB" বলতে হবে।
4. **ডিজাইন ভাঙলে থামো।** স্ক্রিনশট দেখে যাচাই না করে এগোবে না।
5. **নিরাপত্তা টেস্ট বাদ দেওয়া যাবে না** — বিশেষ করে PWA caching-এ ব্যবহারকারীর ডেটা।
6. **আটকে গেলে ৩ বার চেষ্টা, তারপর kill-switch চালু করে Blockers-এ লিখো।** অসীম চেষ্টা করে সময় নষ্ট নয়।
7. **কাজ হারিয়ে গেলে** — `.ai/PROGRESS.md` পড়ো + `git log --oneline -20` চালাও।
