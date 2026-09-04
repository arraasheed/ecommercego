# CLAUDE-4 — Day 1 চূড়ান্ত regression টেস্ট ও merge

**তারিখ:** Day 1 শেষ · **branch:** `day1/asset-pipeline` → merged into `master`
**টুল:** Playwright MCP (Chromium) + chrome-devtools MCP
**Viewport:** mobile 412 × 915 (DPR 2, touch) এবং desktop 1440 × 900

---

## ধাপ ১ — Day 1-এর সব টাস্ক যাচাই

| টাস্ক | PROGRESS.md | git log-এ কমিট | মিলেছে? |
|---|---|---|---|
| GEMINI-1 asset inventory | ✅ DONE | রিপোর্ট-only (কোড পরিবর্তন নেই) | ✅ |
| GEMINI-2 tailwind class scan | ✅ DONE | `c945b79` | ✅ |
| CLAUDE-1 Vite + Tailwind build | ✅ DONE | `a69d27e` → `c69e14a` | ✅ |
| CLAUDE-2 admin ২৮ CSS → bundle | ✅ DONE | `9d4d831` | ✅ |
| CLAUDE-3 `?v=time()` → mtime | ✅ DONE | `78f421b` | ✅ |
| BULK-1 image lazy + dimensions | ✅ DONE | `f9e6f11` | ✅ |

ছয়টিই ✅ DONE এবং git-এ কমিট আছে। `git status --short` খালি ছিল।
**merge-এর পূর্বশর্ত পূরণ।**

---

## ⚠️ টেস্ট করতে গিয়ে যে বাধা এলো, এবং সমাধান

`products` ও `categories` টেবিল **খালি ছিল (0 row)** — CLAUDE-1/2/3 এই কারণেই
cart ও checkout যাচাই করতে পারেনি (benchmark.md-এর "সীমাবদ্ধতা" দেখুন)।
খালি DB-তে "কোনো ফিচার ভাঙেনি" বলার কোনো মানে নেই, কারণ product card,
gallery, variant, cart, checkout, order — কিছুই render-ই হয় না।

তাই টেস্টের জন্য ন্যূনতম ফিক্সচার তৈরি করা হলো (**শুধু DB, কোনো কোড নয়**):

| টেবিল | যোগ করা হলো |
|---|---|
| `categories` | 2 — `test-apparel`, `test-grocery` |
| `product_brands` | 1 — `test-brand` |
| `product_labels` | 1 — `test-new` |
| `products` | 3 — Test Cotton Shirt (999/1200), Test Organic Rice (750/800), Test Olive Oil (1500) |
| `product_images` | 3 (theme-এর বিদ্যমান PNG ব্যবহার করা হয়েছে, নতুন ফাইল আপলোড নয়) |
| `customers` | 1 — `buyer@example.com` / `1234` |
| `orders` | 1 — টেস্ট চলাকালে COD checkout দিয়ে তৈরি হয়েছে |

স্ক্রিপ্ট: `C:\Users\arraa\AppData\Local\Temp\opencode\seed-day1-test.sql`
(ফাইলের নিচে rollback SQL কমেন্ট আকারে আছে)।

**এই ডেটা রেখে দেওয়া হলো**, কারণ Day 2-এর ব্রাউজার টেস্ট (CLAUDE-8) ও
DataTable/modal re-init যাচাইয়ের জন্য এটি দরকার। মুছতে চাইলে rollback SQL।

---

## ধাপ ২ — Storefront regression (stylique)

দুই viewport-এ প্রতিটি ধাপে console error, pageerror, এবং 4xx/5xx response
রেকর্ড করা হয়েছে। নিচের প্রতিটি সারিতে **console error = 0**।

| # | flow | মোবাইল | ডেস্কটপ | প্রমাণ |
|---|---|---|---|---|
| 1 | হোমপেজ + slider | ✅ | ✅ | ৬টি `.swiper` সবই `swiper-initialized`; `slideNext()` → activeIndex 0→1 |
| 2 | category listing — filter + sort | ✅ | ✅ | `#filter_product` = price-descending/ascending → `GET /product-filter` 200, URL param বদলায়, কার্ডের ক্রম বদলায় (Rice 750 প্রথমে) |
| 3 | product detail — gallery, variant, qty | ✅ | ✅ | ৩টি swiper init, ৭টি slide, ২টি thumb, qty input, `In Stock`, `$999,0`/`$1,200,0` |
| 4 | add to cart → drawer → cart page | ✅ | ✅ | `POST /product_cart` 200 → notifier "Test Cotton Shirt added successfully" → `#cart-panel.open` (x: 406→28) → `/cart`-এ ১ সারি, subtotal $999 |
| 4b | cart qty increment | ✅ | ✅ | `POST /change-cart` 200 → qty 1→2, subtotal $999→$1,998 |
| 5 | wishlist যোগ ও অপসারণ | ✅ | ✅ | `POST /product-wishlist` 200 → "added successfully to your wishlist" → wishlist পেজে সারি → `GET /delete-wishlist?id=1` 200 → "No records found" |
| 6 | search | ✅ | ✅ | `#search-toggle` → popup `hidden`→`flex`; datalist-এ ৩টি product option; submit → সঠিক product পেজে |
| 7 | login → account dashboard | ✅ | ✅ | `POST /login` 302 → `/home`; `/my-account` 200, ট্যাব: Orders/Addresses/Wishlist/Support Ticket |
| 8 | checkout (payment ধাপ পর্যন্ত) | ✅ | ✅ | ৫টি সেকশন render; country→state cascade: `POST /states-list` + `get-shipping-data` + `get-tax-data` + `shipping-method` সব 200, Bangladesh → ৭০টি state; COD ও bank_transfer radio; **Place Order → `POST /process-order` 302 → order-complete, order #120260905014419** |

অতিরিক্ত ১০টি পেজ status + CSS যাচাই (দুই viewport): product-list, collections,
cart, wishlist, login, checkout, blog, about, track-order, faq — সব 200,
`.flex` = flex, `bg-primary` = `rgb(248,121,108)`, broken image 0,
horizontal overflow নেই (`scrollWidth - innerWidth` ≤ 0)।

### search সম্পর্কে একটি সৎ নোট

Search **কাজ করে** কিন্তু live AJAX suggestion dropdown এই theme-এ **নেই** —
এটি HTML5 `<datalist>` ব্যবহার করে, যা server-side render হয় (`$search_products`)।
`GET /search-product?product=…` endpoint আছে এবং 200 দেয়, কিন্তু stylique-এর
header তাকে ডাকে না। **এটি Day 1-এর কোনো পরিবর্তনের ফল নয়** — master-এও একই।
পণ্য না মিললে controller `/{slug}/error` (404 পেজ) দেয়, যা কাজ করছে।

---

## ধাপ ২খ — Admin regression

| # | flow | মোবাইল | ডেস্কটপ | প্রমাণ |
|---|---|---|---|---|
| 9 | login | ✅ | ✅ | `admin@example.com` → `/dashboard`; login পেজ guest layout (bundle ছাড়া) — ইচ্ছাকৃত, `layouts/guest.blade.php` ছোঁয়া হয়নি |
| 10 | dashboard — chart | ✅ | ✅ | `.apexcharts-canvas` = 1, `.apexcharts-series` = 1, স্ট্যাট কার্ডে $1,998 ইত্যাদি |
| 11 | product list — DataTable | ✅ | ✅ | `isDataTable()` = true, server-side `?draw=1..3` 200, search → `draw=2`, sort → `draw=3` + `sorting_asc`, pagination উপস্থিত |
| 12 | product create — summernote/select2/upload | ✅ | ✅ | ৩টি `.note-editor` (toolbar 555 বাটন), select2 open → dropdown 308px সাদা, dropzone `border: 2px dashed`, `#choice_form` ৫৩টি ফিল্ড |
| 13 | order list → order detail | ✅ | ✅ | DataTable "Showing 1 to 1 of 1", সারিতে #120260905014419 · order-view 200, "Test Cotton Shirt" উপস্থিত |
| 14 | modal (`data-ajax-popup`) | ✅ | ✅ | `#commanModel.modal.fade.show`, title "Add Category", ৯টি ফিল্ড, backdrop 1, `border-radius: 15px`, input height 41.4px |
| 15 | settings পেজ | ✅ | ✅ | `/setting` 200, ১৪টি ট্যাব (Email/Brand/System/Payment/…), switch ৬টি |
| 16 | dark mode | ✅ | ✅ | DB `cust_darklayout=on` → bundle `admin-ltr-dark-kB6-cbr2.css` (8460 rule), body bg `rgb(34,36,44)` · live preview toggle: `#main-style-link` → `style-dark.css`, card bg `rgb(41,42,51)` |
| 17 | RTL toggle | ✅ | ✅ | DB `SITE_RTL=on` → bundle `admin-rtl-light-cgJmq4UU.css` (8450 rule), `<html dir="rtl">`, `direction: rtl`, DataTable অক্ষত, overflow 0 · **তারপর LTR-এ ফেরানো হয়েছে ও যাচাই করা হয়েছে** (bundle আবার `admin-ltr-light`, dir খালি) |

অতিরিক্ত পেজ: category, customer, coupon — সব 200, DataTable init, tabler-icons
ফন্ট লোড, `.btn-primary` = `rgb(16,183,127)`, broken image 0, overflow 0।

---

## নতুন console error: শূন্য

**২৩টি পেজ × ২ viewport** ঘোরার পর যা পাওয়া গেছে:

| বার্তা | কোথায় | Day 1-এর কারণে? |
|---|---|---|
| `[Meta Pixel] Invalid PixelID: null` (warning) | storefront সব পেজ | ❌ না — DB-তে pixel id সেট করা নেই |
| `net::ERR_ADDRESS_INVALID` | admin, login-এর পর | ❌ না — `https://unpkg.com/nprogress` blocked context; master-এও একই |
| `Failed to load resource 404` | `/store-setting` (ভুল URL, আমার) | ❌ না — এই route নেই; আসল route `/setting` |

**Day 1-এর পরিবর্তনের কারণে সৃষ্ট নতুন error: ০টি।**

### একটি "broken image" যা আসলে বাগ নয়

`/product/create`-এ একটি broken image ধরা পড়ে: `<img id="upcoverImg">`, যার
`src` খালি এবং `display: none`. এটি cover-image আপলোডের **preview placeholder** —
ফাইল বাছার পর JS তাতে src বসায়। `git diff master..day1` দেখায় এই ফাইলে
Day 1-এ কোনো পরিবর্তন হয়নি।

---

## ধাপ ৩ — পরিমাপ

সব সংখ্যা → `.ai/reports/benchmark.md`-এর **"Day 1 Final"** সেকশন।
সংক্ষেপে (mobile, cold, median of 3):

| | BEFORE (৩ kill-switch ON) | AFTER | পরিবর্তন |
|---|---|---|---|
| storefront JS | 1049.8 KB | 583.4 KB | −466.4 KB (−44%) |
| storefront TBT | 175 ms | 35 ms | −80% |
| storefront LCP | 1568 ms | 1296 ms | −272 ms |
| admin request | 64 | 46 | −18 |
| admin CSS request | 20 | 2 | −90% |
| admin CSS bytes | 994.0 KB | 755.7 KB | −238.3 KB |

chrome-devtools trace: storefront LCP **950 ms** · admin LCP **1323 ms** · CLS **0.00** দুইটিতেই।

**যা পরিমাপে বেরিয়ে এলো এবং Day 3-এ ঠিক করতে হবে:** কোনো response-এ
`Content-Encoding` নেই (gzip/brotli বন্ধ)। DevTools বলছে এতে storefront-এ
66 KB, admin-এ 72.5 KB সঞ্চয় হতো এবং FCP/LCP ~640 ms কমত। এটি Apache
কনফিগ, Day 1-এর স্কোপে নয় — CLAUDE-9-এর সাথে করা উচিত।

---

## kill-switch যাচাই (তিনটিই দুই দিকে)

| ফ্ল্যাগ | ON করলে | যাচাই |
|---|---|---|
| `LEGACY_TAILWIND_CDN=true` | Play CDN ফিরে আসে | ✅ `tailwind.js` উপস্থিত, `/build/` CSS অনুপস্থিত, পেজ কাজ করে, error 0 |
| `LEGACY_ADMIN_CSS=true` | ২০টি আলাদা link | ✅ bundle 0, tabler ফন্ট ঠিক, chart render, error 0 |
| `LEGACY_ASSET_TIME_BUSTER=true` | `?v=<timestamp>` | ✅ ৪টি URL-এ time() buster, 404 নেই |

`.env` পুনরুদ্ধার করা হয়েছে (তিনটিই `false`); `.env` git-ignored, তাই কমিটে যায়নি।

---

## ⬜ যা এখনো বাকি (Day 1-এর স্কোপের বাইরে, ব্লকার নয়)

1. **`greentic` ও `techzonix` থিম এখনো Play CDN-এ।** শুধু `stylique` রূপান্তরিত।
   ওদের primary color আলাদা (greentic `#4caf50`), তাই প্রতিটির জন্য আলাদা
   Tailwind config লাগবে। Day 4-এ, অথবা ব্যবহারকারী ওই থিম ব্যবহার করলে তখন।
2. **`partision/head.blade.php:52` → `css/custome.css` (বানান ভুল, 404)।**
   CLAUDE-3-এ ইচ্ছাকৃতভাবে ছোঁয়া হয়নি; CLAUDE-4-এর সিদ্ধান্ত: **ছোঁয়া হবে না।**
   কারণ — (ক) `custome.css` ফাইলটি অস্তিত্বেই নেই, (খ) master-এও একই 404,
   (গ) `custom.css`-এ বদলালে ৬০১টি নতুন CSS rule হঠাৎ চালু হয়ে ডিজাইন বদলাতে
   পারে, (ঘ) এই layout (`layouts.main`) শুধু LandingPage module-এর ৯টি পেজে
   ব্যবহৃত। উপকার নেই, ঝুঁকি আছে।
3. **`all.min.js` = 1.5 MB** এখনো একক ফাইল (P2)। Day 2-এর কাজ।
4. **gzip/brotli বন্ধ** — উপরে ব্যাখ্যা করা। CLAUDE-9।
5. **Lighthouse স্কোর নেওয়া হয়নি** — `APP_DEBUG=true` + file cache-এ TTFB ≈765 ms
   একা Performance স্কোর টেনে নামায়, তাই সংখ্যা বিভ্রান্তিকর হতো। Core Web
   Vitals সরাসরি মাপা হয়েছে; CLAUDE-9-এর পর Lighthouse অর্থবহ হবে।

---

## ➕ অতিরিক্ত কাজ: `script-inventory.md` পুনর্নির্মাণ

GEMINI-3-এর রিপোর্ট বাতিল হয়েছিল (২-৩টি নমুনা সারি, ১০টি লাইন রেফারেন্সের
৯টি ভুল)। হাতে না লিখে একটি স্ক্যানার লেখা হলো:

`.agents/scripts/scan-inline-scripts.cjs` — প্রতিটি blade-এর inline `<script>`
ব্লক পার্স করে, regex দিয়ে ৫টি শ্রেণিতে ভাগ করে, এবং **প্রতিটি ব্লকের
সঠিক লাইন নম্বর** সহ টেবিল লেখে। পুনরায় চালানো নিরাপদ (read-only)।

```
node .agents/scripts/scan-inline-scripts.cjs
```

ফলাফল — **199টি ফাইলে 300টি inline script block**:

| শ্রেণি | মানে | ফাইল | ব্লক |
|---|---|---|---|
| A REINIT-NEEDED | `turbo:load`-এ আবার চালাতে হবে | 99 | 129 |
| B ONCE-ONLY | একবারই চলবে (wrap করলে হ্যান্ডলার দুইবার) | 76 | 91 |
| C INLINE-DATA | শুধু server ডেটা → JS variable | 14 | 19 |
| D THIRD-PARTY | বাইরের সেবা | 11 | 12 |
| E UNCLEAR | মানুষ দেখবে | 44 | 49 |

**সবচেয়ে গুরুত্বপূর্ণ সংখ্যা: 50টি ব্লক "mixed A+B"** — একই `<script>`-এ
widget init *এবং* `$(document).on()` delegation। পুরোটা `turbo:load`-এ
wrap করলে প্রতি navigation-এ হ্যান্ডলার ডুপ্লিকেট হবে (double add-to-cart!),
না করলে widget হারাবে। **এগুলো ভাগ করতে হবে** — BULK-2/3/4-এর recipe-এ
এই তালিকা স্পষ্টভাবে দিতে হবে।

Widget গণনা (Day 2-এর re-init তালিকা): DataTable, select2, summernote,
flatpickr, Swiper, ApexCharts, Dropzone, modal, switchButton, jquery.steps,
jquery.validate, choices.js, emojionearea, flipdown, leaflet, sortable।

মেশিন-পাঠযোগ্য সংস্করণ: `.ai/reports/script-inventory.json` (BULK মডেল সরাসরি
পড়তে পারবে)।

---

## ধাপ ৪ — সিদ্ধান্ত: ✅ MERGE

সব ধাপ পাস, নতুন console error ০, তিনটি kill-switch দুই দিকে কাজ করে,
সংখ্যা সব দিকে উন্নত। তাই:

```
git checkout master
git merge day1/asset-pipeline --no-ff -m "merge: Day 1 asset pipeline optimization"
git tag -a day1-complete -m "Day 1: Vite pipeline, Tailwind build, CSS bundling, cache fix"
```

`git push` করা হয়নি — নিয়ম অনুযায়ী সেটি ব্যবহারকারীর সিদ্ধান্ত।

---

## স্ক্রিনশট

`.ai/screenshots/day1-final/` — ৪৭টি ফাইল
(`m-*` / `mNN-*` = mobile 412×915, `d-*` = desktop 1440×900,
`*-killswitch-*` = legacy মোড, `m-admin-dark` / `m-admin-rtl` = ধাপ ১৬-১৭)

স্ক্রিনশট git-ignored (`.gitignore`), তাই কমিটে যায় না — লোকাল প্রমাণ হিসেবে থাকে।
