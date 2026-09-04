# Cache-buster map — CLAUDE-3 (P5 fix)

> `?v=time()` / `?timestamp=time()` → mtime-based versioning
> শাখা: `day1/asset-pipeline` · তারিখ: Day 1

---

## ১. সমস্যা কী ছিল

৭টি blade ফাইলে asset URL-এর শেষে `time()` বসানো ছিল:

```blade
<link rel="stylesheet" href="{{ asset('css/custom.css') }}{{ '?v=' . time() }}">
```

`time()` প্রতি সেকেন্ডে নতুন সংখ্যা দেয়। ফলে প্রতিটি পেজ লোডে URL বদলায়,
আর ব্রাউজারের কাছে সেটি সম্পূর্ণ **নতুন ফাইল**। তাই:

- প্রতিবার ৮৪ KB `custom.css` আবার ডাউনলোড হতো — cache কখনো ব্যবহার হতো না
- `Cache-Control` header বসিয়েও লাভ হতো না, কারণ URL-ই আলাদা
- Day 3-এ Workbox বসালে service worker ক্যাশে অসংখ্য duplicate entry জমতো
  (একই ফাইলের হাজারো সংস্করণ), precache manifest কাজ করত না

## ২. যা খুঁজে পাওয়া গেছে (ধাপ ১)

`resources/views/` + `themes/` স্ক্যান — `time()`, `rand()`, `uniqid()`,
`microtime()` দিয়ে তৈরি asset URL:

| ধরন | সংখ্যা | মন্তব্য |
|---|---|---|
| CSS/JS `?v=` বা `?` + `time()` | ২২ জায়গা / ১০ ফাইল | আসল সমস্যা |
| favicon / logo / meta-image `?timestamp=` + `time()` | ২০ জায়গা / ১১ ফাইল | একই সমস্যা, ভিন্ন ফরম্যাট |
| `themes/` ফোল্ডারে | **০** | ✅ কোনো theme blade-এ cache-buster নেই |
| `rand()` / `uniqid()` / `microtime()` asset URL-এ | **০** | ✅ কোথাও নেই |

**যেগুলো `time()` কিন্তু cache-buster নয় — হাত দেওয়া হয়নি (৭টি ফাইল):**

| ফাইল | লাইন | কেন বাদ |
|---|---|---|
| `payment/flutterwave.blade.php` | 13 | `$order_id = time()` — পেমেন্ট order ID, business logic |
| `payment/paystack.blade.php` | 18 | একই |
| `payment/razorpay.blade.php` | 27 | একই |
| `payment/telegram.blade.php` | 27 | একই |
| `payment/whatsapp.blade.php` | 23 | একই |
| `plans/stripe.blade.php` | 3216 | একই |
| `front_end/**` (৬টি) | — | JavaScript-এর `new Date().getTime()`, PHP নয় |

এগুলো বদলালে পেমেন্ট ভাঙবে। স্কোপের বাইরে।

## ৩. Vite bundle যাচাই (ধাপ ২)

প্রম্পটে বলা ছিল CLAUDE-1/CLAUDE-2-এ যেসব ফাইল Vite-এ গেছে তাদের `time()`
এমনিতেই চলে গেছে কি না দেখতে। **যাচাই করা হয়েছে — হ্যাঁ, গেছে:**

| ফাইল | অবস্থা | প্রমাণ |
|---|---|---|
| `css/custom.css`, `css/loader.css` | `admin-*-light/dark.css` bundle-এর ভেতরে `@import` হয়ে আছে | `resources/css/admin-ltr-light.css:22-23` |
| bundle output | Vite নিজেই hash দেয় | `admin-ltr-light-DG9GMzeI.css` |
| তবে... | **`<link>` ট্যাগগুলো এখনো আছে** | `LEGACY_ADMIN_CSS=true` kill-switch শাখায় (`app.blade.php:120-136`) |

অর্থাৎ ডিফল্ট পথে (`LEGACY_ADMIN_CSS=false`) এই লাইনগুলো render হয় না,
কিন্তু kill-switch চালু করলে হয় — তখন আবার `time()` ফিরে আসত। তাই
kill-switch শাখাতেও ঠিক করা হয়েছে। **ব্রাউজারে যাচাই:**
`LEGACY_ADMIN_CSS=true` দিয়ে ২০টি stylesheet, সবগুলোর URL stable।

`loader.css` + `notifier.css` Vite-এর বাইরেই আছে (storefront
`jQueryRoute.blade.php`) — এগুলোর জন্যই helper সবচেয়ে দরকারি ছিল।

## ৪. Helper (ধাপ ৩)

`app/Helper/helper.php`-এ **৩টি নতুন function যোগ** করা হয়েছে (ফাইলের শেষে,
লাইন 2484-2621)। বিদ্যমান কোনো function ছোঁয়া হয়নি — শুধু append।

| function | কাজ | fallback |
|---|---|---|
| `asset_version($url)` | URL → ডিস্কে ফাইল খুঁজে `filemtime()` ফেরায় | `null` (ফাইল না পেলে) |
| `asset_v($path)` | CSS/JS/font-এর জন্য — `?v=<mtime>` | `?v=1` |
| `get_file_v($path)` | uploaded logo/favicon/meta-এর জন্য — `?timestamp=<mtime>` | `?timestamp=time()` |

### কেন দুইটি আলাদা function, একটি নয়

আলাদা fallback দরকার ছিল:

- **`asset_v` → `'1'`**: `css/custom.css` না থাকলে সেটি deploy ভুল। ওখানে
  `time()` ফেরালে ঠিক সেই সমস্যাই ফিরে আসত যেটা আমরা সরাচ্ছি।
- **`get_file_v` → `time()`**: uploaded logo S3/Wasabi-তে থাকতে পারে, তখন
  ডিস্কে খুঁজে পাওয়া যাবে না। ওখানে `'1'` ফেরালে অ্যাডমিন নতুন লোগো আপলোড
  করেও পুরোনোটাই দেখতেন — এটি functional regression। remote disk-এ তাই
  পুরোনো আচরণ রাখা হলো; local install (আমাদের ক্ষেত্রে) সবসময় resolve হয়,
  তাই আসল caching পাওয়া যায়।

### asset_version যেসব প্রান্তিক ক্ষেত্র সামলায়

| ক্ষেত্র | আচরণ |
|---|---|
| ভিন্ন host (CDN/S3) | `null` — remote ফাইল stat করা সম্ভব নয় |
| sub-directory install (`/shop/css/x.css`) | base path ছেঁটে resolve করে |
| `public/` prefix লেখা path (`public/js/html2pdf...`) | দুইভাবেই খোঁজে |
| একই ফাইল একাধিকবার | static memo — প্রতি request-এ একবারই `filemtime()` |
| যেকোনো exception | `try/catch` → `null`, পেজ ভাঙে না |

### Kill-switch

```env
LEGACY_ASSET_TIME_BUSTER=true
```

`.env`-এ এই একটি লাইন দিলে তিনটি function-ই আগের `time()` আচরণে ফিরে যায় —
কোনো blade ফাইল ছোঁয়া লাগে না। `.env.example`-এ ডকুমেন্ট করা আছে।
**ব্রাউজারে দুইদিকেই যাচাই করা হয়েছে** (নিচে §৭ দেখুন)।

## ৫. Blade প্রতিস্থাপন (ধাপ ৪) — ২১টি ফাইল, ৪২টি জায়গা

### CSS / JS → `asset_v()`

| ফাইল | লাইন | কী ছিল |
|---|---|---|
| `layouts/app.blade.php` | 122,123,126,127,130,131,134,135 | `custom.css`, `loader.css`, `rtl-*` × ৪ variant |
| `layouts/guest.blade.php` | 157,160,163,166,173 | `loader.css`, `rtl-loader.css`, `custom.css` |
| `layouts/theme_layout.blade.php` | 104,107,110,113 | `loader.css`, `rtl-loader.css` |
| `front_end/jQueryRoute.blade.php` | 3,4 | `loader.css`, `notifier.css` — **storefront, সবচেয়ে গুরুত্বপূর্ণ** |
| `partision/footerlink.blade.php` | 40,44 | `choices.min.js` (173 KB), `custom.js` (16 KB) |
| `plans/Powertranz-planpayment.blade.php` | 7,10,13,16 | `custom.css`, `rtl-custom.css` |
| `order/view.blade.php` | 581 | `html2pdf.bundle.min.js` (**469 KB**) |
| `support/edit.blade.php` | 172 | একই ৪৬৯ KB ফাইল |
| `vendor/installer/layouts/master.blade.php` | 11 | `loader.css` |
| `vendor/installer/layouts/master-update.blade.php` | 12 | `loader.css` |

### favicon / logo / meta-image → `get_file_v()`

| ফাইল | লাইন | কী |
|---|---|---|
| `layouts/app.blade.php` | 88,95,103,150 | og:image, twitter:image, favicon × ২ শাখা |
| `layouts/guest.blade.php` | 126,136,143,280 | meta × ২, favicon, nav logo |
| `layouts/theme_layout.blade.php` | 79 | favicon |
| `partision/head.blade.php` | 18,25,37 | meta × ২, favicon |
| `partision/sidebar.blade.php` | 24 | sidebar logo |
| `setting/brand_setting.blade.php` | 18,52,86 | logo-dark, logo-light, favicon preview |
| `marketplace/marketplace.blade.php` | 19,26,34,63,119 | meta × ২, favicon, header + footer logo |
| `marketplace/pricing.blade.php` | 60 | favicon |
| `plans/create.blade.php` | 171 | module icon |
| `plans/edit.blade.php` | 167 | module icon |

`themes/` ফোল্ডারে কিছু বদলানো হয়নি — ওখানে cache-buster ছিলই না।

## ৬. `.htaccess` (ধাপ ৫)

রুট `.htaccess`-এ rewrite ব্লকের নিচে একটি নতুন সেকশন যোগ করা হয়েছে।
উপরে-নিচে `BEGIN` / `END` কমেন্ট আছে — পুরো ব্লক মুছে দিলেই আগের অবস্থা ফেরে।

| pattern | `Cache-Control` | কেন |
|---|---|---|
| `/build/` এর ভেতরের সব | `max-age=31536000, immutable` | Vite hash দেয় (`store-BfJ0BvUh.css`), URL বদলালেই নতুন ফাইল |
| `woff`, `woff2`, `ttf`, `eot` | `max-age=31536000, public` | ফন্ট কখনো বদলায় না |
| `png`, `jpg`, `svg`, `ico`, `webp`, `gif` | `max-age=2592000, public` | ৩০ দিন — uploaded logo বদলাতে পারে, `get_file_v()` তখন URL বদলাবে |
| `css`, `js` (build-এর বাইরে) | `max-age=604800, public` | ৭ দিন — সবগুলো এখনো `asset_v()` ব্যবহার করে না, তাই রক্ষণশীল |
| HTML | **নিয়ম দেওয়া হয়নি** | Laravel নিজেই `no-cache, private` পাঠায় — যাচাই করা |

দুইটি বাস্তবায়ন-নোট:

- `mod_expires` **Laragon-এ disabled** (`httpd.conf:115` কমেন্ট করা)। তাই
  `mod_headers` ব্যবহার করা হলো, যেটি enabled (`httpd.conf:120`)।
- `SetEnvIf` দিয়ে `/build/` চিহ্নিত করা হয়েছে, `^/build/` নয় — কারণ root
  `.htaccess`-এর RewriteRule আগে `/build/...` কে `/public/build/...` বানায়।
  আর `immutable` নিয়মটি সবার **নিচে** রাখা হয়েছে, কারণ `Header set` আগের
  মান মুছে দেয়; নির্দিষ্ট নিয়মকে সাধারণ নিয়মের পরে বসাতে হয়।

## ৭. ভেরিফিকেশন

সব পরীক্ষা `http://ecommercego.dev`-এ, Playwright (Chromium) দিয়ে।

### ৭.১ URL কি সত্যিই স্থির হলো

২ সেকেন্ড ব্যবধানে একই পেজ দুইবার fetch করে HTML-এর versioned URL তুলনা:

```
/login            → 6টি versioned URL, দুইবারেই হুবহু এক     ✅ STABLE
/stylique/home    → 2টি versioned URL, দুইবারেই হুবহু এক     ✅ STABLE
```

আগে এই সংখ্যাগুলো প্রতি সেকেন্ডে বদলাত। ব্রাউজারে পাওয়া মান:

```
/css/loader.css?v=1763094477      ← 14 Nov 2025, ফাইলের আসল mtime
/css/custom.css?v=1770805411      ← 11 Feb 2026
/js/custom.js?v=1763446969        ← 18 Nov 2025
/assets/js/plugins/choices.min.js?v=1729081698
/storage/uploads/logo/favicon.png?timestamp=1768901980
```

### ৭.২ দ্বিতীয় লোডে ক্যাশ কাজ করছে কি

storefront দুইবার লোড করে `performance.getEntriesByType('resource')`:

| মেট্রিক | ফলাফল |
|---|---|
| মোট static resource | ৩২ |
| `transferSize === 0` (disk cache থেকে) | **৩১** |
| নেটওয়ার্ক থেকে | ১ (`themes/stylique/assets/js/custom.js` — 300 bytes = **304 Not Modified**) |

অর্থাৎ ৩২টির মধ্যে ৩১টি নেটওয়ার্ক ছোঁয়নি, বাকি ১টি 304 পেয়েছে।
**আগে এই সংখ্যাটি ০ ছিল** — প্রতিটি `?v=time()` ফাইল ১০০% পুনরায় ডাউনলোড হতো।

আলাদাভাবে ETag দিয়ে 304 যাচাই:

```
GET /css/loader.css?v=1763094477                → 200, ETag "822-643866c01cd40"
GET একই URL + If-None-Match: "822-..."          → 304 Not Modified   ✅
```

### ৭.৩ Cache-Control header

```
/build/assets/store-BfJ0BvUh.css      → max-age=31536000, immutable  ✅
/build/assets/tabler-icons-*.woff2    → max-age=31536000, immutable  ✅
/css/loader.css?v=1763094477          → max-age=604800, public       ✅
/assets/fonts/tabler-icons.min.css    → max-age=604800, public       ✅
/themes/stylique/assets/css/all.min.css → max-age=604800, public     ✅
/storage/uploads/logo/favicon.png     → max-age=2592000, public      ✅
/login  (HTML)                        → no-cache, private            ✅
```

### ৭.৪ ফাইল বদলালে URL বদলায় কি (আসল উদ্দেশ্য)

`loader.css`-এর mtime বদলে আবার ফেরানো হলো:

```
mtime = 14 Nov 2025  → ?v=1763094477
mtime = এখন          → ?v=1788548899     ← URL বদলাল ✅
mtime ফেরত           → ?v=1763094477     ← আবার আগের মান ✅
```

ফাইল বদলালে ব্যবহারকারী নতুন CSS পাবেন; না বদলালে ক্যাশ থেকে পাবেন।

### ৭.৫ ডিজাইন অপরিবর্তিত (pixel-diff)

kill-switch দুই অবস্থায় একই ৪টি পেজের full-page স্ক্রিনশট নিয়ে
পিক্সেল-বাই-পিক্সেল তুলনা (Pillow, threshold 4/channel):

| পেজ | আকার | diff পিক্সেল |
|---|---|---|
| Admin dashboard | 407 × 4253 | **0** |
| Admin settings | 407 × 2204 | 1 (0.0001%) |
| Storefront home | 406 × 2952 | 1 (0.0001%) |
| Login | 407 × 4253 | **0** |

১-পিক্সেল পার্থক্যগুলো anti-aliasing noise — একই কমিটে পরপর দুইবার তোলা
স্ক্রিনশটেও ঠিক সেই ১ পিক্সেল আলাদা আসে (baseline noise পরিমাপ করা হয়েছে)।

**ApexCharts-এর অ্যানিমেশন** নিয়ে একটি নোট: dashboard-এর "Storage Status"
radial chart প্রতি render-এ ভিন্ন ফ্রেমে ধরা পড়ে, তাই ওই অঞ্চল
(`80,3390 – 340,3700`) mask করা হয়েছে। ওই অঞ্চল বাদে diff **হুবহু ০**।
এটি আমাদের পরিবর্তনের ফল নয় — chart animation।

### ৭.৬ Kill-switch দুইদিকে কাজ করে

```
LEGACY_ASSET_TIME_BUSTER=true   → /css/loader.css?v=1788548784   (time(), প্রতিবার নতুন)
মুছে দেওয়ার পর                  → /css/loader.css?v=1763094477   (mtime, স্থির)
LEGACY_ADMIN_CSS=true সহ        → ২০টি stylesheet, সব URL স্থির   ✅
```

### ৭.৭ অন্যান্য

- `php artisan view:cache` → **INFO Blade templates cached successfully** —
  ৫০৮টি blade কম্পাইল হয়, কোনো syntax error নেই
- `php -l app/Helper/helper.php` → No syntax errors
- Brand Settings পেজে তিনটি লোগো preview `naturalWidth > 0` — ছবি সত্যিই লোড হয়
- console-এ নতুন কোনো error নেই

## ৮. প্রভাব

| | আগে | পরে |
|---|---|---|
| দ্বিতীয় লোডে cache hit | ০ / ৩২ | **৩১ / ৩২** |
| `custom.css` (84 KB) | প্রতি লোডে re-download | একবার, তারপর disk cache |
| `html2pdf.bundle.min.js` (469 KB) | order/support পেজে প্রতিবার | একবার |
| `choices.min.js` (173 KB) | প্রতি admin পেজে | একবার |
| Workbox precache (Day 3) | অসম্ভব — URL অস্থির | ✅ সম্ভব |

## ৯. Day 3-এর জন্য নোট

Workbox `generateSW` বসানোর সময়:

- `/build/**` → `CacheFirst`, নিরাপদে (hash + immutable)
- `?v=<mtime>` URL → `StaleWhileRevalidate` ঠিক আছে; URL এখন স্থির, তাই
  precache manifest ফুলে যাবে না
- `get_file_v()` যদি remote disk-এ `time()` fallback দেয়, ওই URL গুলো
  service worker-এ **precache করা যাবে না** — runtime caching-এ রাখতে হবে

## ১০. যা এই টাস্কে করা হয়নি (স্কোপের বাইরে)

- `partision/head.blade.php:52`-এ `css/custome.css` — **নামের ভুল বানান**,
  ফাইলটি নেই, 404 দেয়। সংশোধন করলে হঠাৎ নতুন CSS চালু হয়ে ডিজাইন বদলাতে
  পারে। CLAUDE-4-এ রিপোর্ট করা হলো।
- `layouts/app.blade.php:118` ও footerlink-এ `asset('public/...')` — দ্বিগুণ
  prefix, কাজ করছে কারণ `.htaccess` দুইভাবেই resolve করে। স্পর্শ করা হয়নি।
- `unpkg.com`, `cdnjs.cloudflare.com`, `fonts.googleapis.com` থেকে আসা
  external asset — এগুলোর caching আমাদের হাতে নেই।
