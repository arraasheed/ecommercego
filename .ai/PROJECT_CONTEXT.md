# PROJECT CONTEXT — eCommerce Go (WorkDo) SPA/PWA Optimization

> **প্রতিটি AI মডেল কাজ শুরুর আগে এই ফাইল পড়বে। এটি সবার জন্য একক সত্য (single source of truth)।**
> **Every AI model MUST read this file before starting any task.**

---

## 1. প্রজেক্ট পরিচয়

| বিষয় | তথ্য |
|---|---|
| প্রজেক্ট পাথ | `C:\laragon\www\ecommercego` |
| বেস স্ক্রিপ্ট | eCommerce Go / WorkDo — Multi-store SaaS eCommerce |
| ফ্রেমওয়ার্ক | Laravel 11.9 / PHP 8.2 |
| ব্যবসায়িক লক্ষ্য | বাংলাদেশে subscription-based multi-store SaaS |
| টেকনিক্যাল লক্ষ্য | SPA-এর মতো ৯০-৯৫% পারফরম্যান্স + প্রফেশনাল মোবাইল PWA |
| সময়সীমা | ৪ দিন core + ১ দিন buffer |
| ভাষা | ব্যবহারকারী বাংলায় কথা বলেন। রিপোর্ট বাংলায় দেওয়া যেতে পারে, কোড/কমেন্ট ইংরেজিতে। |

---

## 2. সবচেয়ে গুরুত্বপূর্ণ নিয়ম — এগুলো ভাঙা নিষিদ্ধ

### 🔴 নিয়ম ১: Business logic কখনো পরিবর্তন করবে না
নিচের ফোল্ডারগুলোতে **কোনো পরিবর্তন নয়** (যদি এই ফাইলে স্পষ্ট অনুমতি না থাকে):
```
app/Http/Controllers/     ❌ ছোঁবে না
app/Models/               ❌ ছোঁবে না
routes/web.php            ❌ ছোঁবে না
routes/api.php            ❌ ছোঁবে না
routes/customer.php       ❌ ছোঁবে না
database/                 ❌ ছোঁবে না
vendor/                   ❌ ছোঁবে না
packages/workdo/          ❌ ছোঁবে না (নতুন module ছাড়া)
```
**কারণ:** ভবিষ্যতে WorkDo আপডেট মার্জ করতে হবে। কোর ফাইল বদলালে সেই পথ বন্ধ হয়ে যাবে।

### 🔴 নিয়ম ২: প্রতিটি ফিচারে kill-switch থাকবে
যা যোগ করা হবে তা `.env` flag বা এক লাইন কমেন্ট দিয়ে বন্ধ করা যেতে হবে।

### 🔴 নিয়ম ৩: ডিজাইন অপরিবর্তিত থাকবে
CSS bundle হবে, কিন্তু কোনো পেজের চেহারা বদলাবে না। শুধু মোবাইল responsive উন্নতি হবে।

### 🔴 নিয়ম ৪: কাজ শেষে PROGRESS.md আপডেট করবে
`.ai/PROGRESS.md` — প্রতিটি টাস্ক শেষে সেখানে লিখতে হবে। এটি না করলে পরের সেশনে কাজ হারিয়ে যাবে।

### 🔴 নিয়ম ৫: git commit বাধ্যতামূলক
প্রতিটি টাস্ক শেষে commit করবে। কমিট মেসেজ ফরম্যাট নিচে দেওয়া আছে।

---

## 2.১ ক্র্যাশ-প্রুফ auto-resume ব্যবস্থা (Day 0-এ বসানো)

**সমস্যা:** Antigravity-তে কাজ করার সময় পিসি রিস্টার্ট বা বিদ্যুৎ চলে গেলে
conversation history ড্যাশবোর্ড থেকে হারিয়ে যায়। তখন মডেলকে বারবার বলতে হয়
"তুমি কী করছিলে খুঁজে বের করো"।

**সমাধান:** তিনটি স্তরে on-disk স্মৃতি বসানো হয়েছে। মডেল আর কিছু জিজ্ঞেস করবে না।

| ফাইল | কাজ |
|---|---|
| `.agents/hooks.json` | Antigravity lifecycle hook নিবন্ধন |
| `.agents/scripts/resume-context.cjs` | **PreInvocation** — প্রতি সেশনের প্রথম model call-এর আগে `PROGRESS.md` + `git log` + journal পড়ে একটি resume brief inject করে |
| `.agents/scripts/checkpoint.cjs` | **PostToolUse + Stop** — প্রতিটি tool call-এর পর `.ai/state/journal.jsonl`-এ এক লাইন লেখে |
| `.agents/AGENTS.md` | workspace rule — সব মডেলের জন্য স্বয়ংক্রিয়ভাবে লোড হয় |
| `AGENTS.md` + `GEMINI.md` (root) | একই rule, root-level discovery-র জন্য |

**কেন JSONL (ডেটাবেস নয়):** append-only ফাইলে বিদ্যুৎ গেলে শুধু শেষ লাইনটি
ছিঁড়ে যায়, reader সেটি skip করে। আগের সব লাইন অক্ষত থাকে। ডেটাবেস হলে পুরো
ফাইল নষ্ট হওয়ার ঝুঁকি থাকত।

**নিরাপত্তা:** দুইটি hook script যেকোনো ব্যর্থতায় `{}` প্রিন্ট করে exit 0 করে —
তাই একটি ভাঙা resume brief কখনো কাজ থামাতে পারবে না। টেস্ট করা হয়েছে: খালি
stdin, garbage stdin, ছিঁড়ে যাওয়া journal, অনুপস্থিত ফাইল, ভিন্ন cwd — সব
ক্ষেত্রে valid JSON ও exit 0।

**গতি:** checkpoint ~60ms, resume ~230ms (একবারই চলে)।

**ব্যবহার:** ব্যবহারকারী শুধু বলবেন **"কাজ কন্টিনিউ করো"**। মডেল নিজেই জানবে
কোথায় থেমেছিল, কোন টাস্ক বাকি, git-এ কী আছে, কোনো blocker আছে কি না।

`.ai/state/` git-ignored — এটি machine-local runtime state।

---

## 3. কোডবেসের বাস্তব চিত্র (স্ক্যান করা, ২০২৬)

| আইটেম | সংখ্যা |
|---|---|
| Blade view (resources/views) | 508 |
| Blade view (প্রতি theme) | ~50 × 3 |
| Theme | `greentic`, `stylique`, `techzonix` |
| Controller | 133 |
| Model | 80 |
| Route: web / customer / api | 371 / 98 / 161 |
| Inline `<script>` থাকা blade | 170 |
| `$(document).ready` থাকা blade | 72 |
| `data-ajax-popup` modal | 101 |
| DataTable ব্যবহারকারী view | 70 |
| select2 view | 25 |
| summernote view | 19 |
| ApexCharts view | 20 |

### বর্তমান স্ট্যাক
- Alpine.js 3 + Tailwind 3 + Vite 5 + **jQuery 3.6**
- Theme engine: `qirolab/laravel-themer`
- Table: `yajra/laravel-datatables` (server-side)
- Auth: Sanctum (API) + session (web)
- Module system: `packages/workdo/*` (composer path repo + symlink) — **কাজ করছে**

### 🔥 চিহ্নিত সমস্যা (এগুলোই ঠিক করতে হবে)

| # | সমস্যা | ফাইল | প্রভাব |
|---|---|---|---|
| P1 | **Tailwind Play CDN ব্রাউজারে চলছে** — 466 KB, runtime CSS generation | `themes/*/assets/js/tailwind.js` | 🔴 সবচেয়ে বড় killer |
| P2 | `all.min.js` = **1.5 MB** একক ফাইল | `themes/stylique/assets/js/` | 🔴 বিশাল |
| P3 | Admin layout-এ **২৮টি আলাদা CSS link**, কোনো bundle নেই | `resources/views/layouts/app.blade.php:83-128` | 🔴 28 HTTP request |
| P4 | **Service Worker ভাঙা** — সব GET cache-first, `assets = []` খালি, versioning নেই | `serviceWorker.js` | 🔴 stale data দেয় |
| P5 | `?v=time()` cache-buster — প্রতি রিকোয়েস্টে নতুন URL | ৭টি ফাইল | 🟠 ক্যাশ ভাঙে |
| P6 | `public/assets` = 31 MB, `public/js` = 4.4 MB | `public/` | 🟠 অনেক unused |
| P7 | Vite ব্যবহারই হচ্ছে না — `app.css` = 59 bytes, `app.js` = 96 bytes | `vite.config.js` | 🟠 সম্পূর্ণ অব্যবহৃত |
| P8 | jQuery + Alpine + Swiper সবই আলাদা, tree-shake নেই | সব layout | 🟠 |

### 💎 সম্পদ (যা আমাদের পক্ষে)
- `routes/api.php`-তে **১৬১টি রেডি JSON endpoint** — Vue island-এর জন্য নতুন API লাগবে না
- `packages/workdo/` module system কাজ করছে — নতুন ২০-২৫টি ফিচার এখানে যাবে, core ছোঁয়া লাগবে না
- Theme system আলাদা — একটি theme-এ কাজ করে বাকিতে copy করা যাবে

---

## 4. আর্কিটেকচার সিদ্ধান্ত (চূড়ান্ত)

```
Laravel 11 Blade (অপরিবর্তিত)
  │
  ├─ @hotwired/turbo ........... SPA navigation (no page reload)
  ├─ Vue 3 (island only) ....... cart drawer, variant selector, search, checkout
  │    └─ consumes routes/api.php (১৬১টি রেডি endpoint)
  ├─ Vite 5 .................... bundling, code-split, Tailwind JIT build
  ├─ Workbox ................... PWA, service worker, offline
  └─ Redis + OPcache ........... backend speed
```

**Vue 3 দিয়ে full rewrite করা হবে না।** কারণ: 508 blade + 133 controller rewrite = ৩-৬ মাস, এবং upstream update path নষ্ট।

### কেন এটা ৯০-৯৫% SPA
| SPA যা দেয় | এই আর্কিটেকচারে |
|---|---|
| No page reload | ✅ Turbo Drive |
| Persistent layout | ✅ `data-turbo-permanent` |
| Instant navigation | ✅ Turbo cache + preview |
| Reactive UI | ✅ Vue island |
| Installable app | ✅ Workbox + manifest |
| Client-side router | ❌ (দরকার নেই — server HTML দেয়) |

---

## 5. যে ফাইলগুলো ছোঁয়া হবে (মোট ~১৫টি — WorkDo update merge সহজ রাখতে)

```
✏️  vite.config.js                                      (rewrite)
✏️  package.json                                        (dependency যোগ)
✏️  tailwind.config.js                                   (content path)
✏️  postcss.config.js                                    (যদি লাগে)
✏️  resources/views/layouts/app.blade.php                (head/foot ২-৪ লাইন)
✏️  themes/stylique/views/front_end/layouts/app.blade.php
✏️  themes/greentic/views/front_end/layouts/app.blade.php
✏️  themes/techzonix/views/front_end/layouts/app.blade.php
✏️  resources/views/front_end/jQueryRoute.blade.php      (SW registration)
🆕  resources/js/turbo-bootstrap.js
🆕  resources/js/island-registry.js
🆕  resources/js/islands/*.vue
🆕  resources/js/sw-register.js
🆕  resources/css/admin.css   (২৮ CSS import করবে)
🆕  resources/css/store.css
🆕  public/sw.js              (Workbox generated — build output)
🆕  app/Http/Middleware/TurboRedirect.php  (303 handling)
```

**Blade view-এর inline script wrap করা** — এটি ব্যতিক্রম, ১৭০টি ফাইল ছোঁয়া হবে, কিন্তু পরিবর্তন হবে **শুধু wrapper**, ভেতরের কোড অপরিবর্তিত। ফলে merge conflict সহজে সমাধানযোগ্য।

---

## 6. git কর্মপ্রণালী

```
master               ← স্থিতিশীল, শুধু টেস্ট পাস করা কাজ merge হবে
  └─ tag: baseline-v0    ← WorkDo-র একদম অস্পৃশ্য অবস্থা
day1/asset-pipeline
day2/turbo-drive
day3/pwa-workbox
day4/mobile-polish
```

### সব ফেরত নেওয়ার কমান্ড (emergency)
```powershell
cd C:\laragon\www\ecommercego
git reset --hard baseline-v0
git clean -fd
```

### প্রতিটি টাস্ক শেষে
```powershell
cd C:\laragon\www\ecommercego
git add -A
git commit -m "<type>(<scope>): <what>  [<MODEL>-<TASK#>]"
```
উদাহরণ: `git commit -m "perf(vite): bundle 28 admin css into single file  [CLAUDE-2]"`

`<type>` = `perf` | `feat` | `fix` | `refactor` | `chore` | `docs`

---

## 7. ভেরিফিকেশন (কাজ ঠিক হয়েছে কীভাবে বুঝব)

Claude-এর হাতে Playwright MCP + chrome-devtools MCP আছে। সে ব্রাউজারে সত্যিকারভাবে টেস্ট করবে।
অন্য মডেলের ব্রাউজার না থাকলে তারা **কোড লিখবে, Claude টেস্ট করবে**।

লোকাল URL: `http://ecommercego.test` অথবা `http://localhost/ecommercego/public`
(সঠিক URL `.ai/PROGRESS.md`-এর `## Environment` সেকশনে লেখা থাকবে)

### গ্রহণযোগ্যতার মাপকাঠি
| মেট্রিক | লক্ষ্য |
|---|---|
| Storefront Lighthouse mobile | ≥ 85 |
| Admin Lighthouse mobile | ≥ 75 |
| Navigation (Turbo, cached) | < 300ms |
| প্রথম লোড JS (storefront) | < 400 KB |
| PWA installable | ✅ |
| কোনো ফিচার ভেঙেছে? | ❌ শূন্য সহনশীলতা |

---

## 8. মডেলদের দায়িত্ব বিভাজন

| মডেল | ফাইল | দায়িত্ব | ঝুঁকি স্তর |
|---|---|---|---|
| **Claude** | `.ai/CLAUDE_TASKS.md` | আর্কিটেকচার, Vite/Turbo/Workbox integration, ব্রাউজার টেস্ট, সব merge ও review | উচ্চ |
| **Gemini** | `.ai/GEMINI_TASKS.md` | বড় context বিশ্লেষণ — asset audit, inventory তৈরি, class scan, রিপোর্ট | নিম্ন (শুধু পড়া + রিপোর্ট) |
| **BULK মডেল** | `.ai/BULK_TASKS.md` | যান্ত্রিক bulk edit — নির্দিষ্ট recipe অনুযায়ী ১৭০টি script wrap, component generate | মধ্যম |

**BULK মডেল না থাকলে** তার ফাইলের টাস্ক যেকোনো মডেল (বা Claude) করতে পারবে — টাস্কগুলো self-contained।

---

## 9. যোগাযোগ প্রোটোকল

- ব্যবহারকারী প্রম্পট copy-paste করেন। তিনি টেকনিক্যাল এক্সপার্ট নন — **তাঁকে কোনো কাজ দেওয়া যাবে না**।
- কোনো মডেল আটকে গেলে: `.ai/PROGRESS.md`-এর `## Blockers` সেকশনে লিখবে, কাজ থামাবে, ব্যবহারকারীকে জানাবে।
- ব্যবহারকারী সেই বার্তা Claude-কে দেখাবেন, Claude সমাধান দেবে।
- **কোনো মডেল নিজের টাস্ক নম্বরের বাইরে কাজ করবে না।** স্কোপ ক্রিপ = ঝুঁকি।
