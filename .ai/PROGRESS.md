# PROGRESS — কাজের অবস্থা ট্র্যাকার

> **👤 ব্যবহারকারী: আপনার এই ফাইলটি পড়ার দরকার নেই।**
> আপনার জন্য একটি আলাদা সহজ গাইড আছে: **`.ai/HOW_TO_RUN.md`**
> ওখানে ২৭টি ধাপ ক্রমে সাজানো আছে — কোন ফাইল কাকে দেবেন, কীভাবে দেবেন।
> প্রম্পটগুলো রেডি অবস্থায় আছে `.ai/prompts/` ফোল্ডারে (পুরো ফাইল কপি করে
> পেস্ট করবেন, অংশ বেছে নেওয়ার দরকার নেই)।

> **🔴 প্রতিটি মডেল কাজ শুরুর আগে এই ফাইল পড়বে এবং কাজ শেষে আপডেট করবে।**
>
> ব্যবহারকারী যদি শুধু বলেন **"কাজ শুরু করো"** বা **"আগের কাজ কন্টিনিউ করো"** —
> মডেল এই ফাইল পড়ে নিজেই বুঝে নেবে কোথায় থেমেছিল। ব্যবহারকারীকে কিছু বলতে হবে না।

---

## 🚀 যেকোনো মডেলের জন্য বুট-আপ নির্দেশনা (প্রতিবার এটাই করবে)

> **স্মৃতি মডেলের মাথায় নয় — ডিস্কে।** টোকেন লিমিট ফুরিয়ে গেলে, পিসি রিস্টার্ট
> হলে, বা কনভার্সেশন হারিয়ে গেলে মডেল সব ভুলে যায়। কিন্তু কাজের অবস্থা তিন
> জায়গায় লেখা থাকে, তাই কিছুই হারায় না:
>
> | কোথায় | কী বলে |
> |---|---|
> | `git log` | আসলে কী কমিট হয়েছে — **এটাই চূড়ান্ত সত্য** |
> | `.ai/PROGRESS.md` | কোন টাস্ক ✅ DONE, কোনটা ⬜ PENDING |
> | `.ai/reports/*.md` | কোন ফাইলে কী করা হয়েছে, সারি ধরে |
>
> Antigravity-তে `.agents/hooks.json` এই কাজটি স্বয়ংক্রিয়ভাবে করে।
> **অন্য টুলে (OpenCode, Cursor, ওয়েব চ্যাট) hook চলবে না** — তখন ব্যবহারকারী
> নিচের বুট প্রম্পটটি পেস্ট করবেন। এটি সব মডেলে, সব টুলে কাজ করে।

### 📋 ব্যবহারকারীর জন্য: নতুন সেশনে প্রথমে এই প্রম্পটটি পেস্ট করুন

> **⚡ সহজ পথ:** নিচের প্রম্পটটি ইতিমধ্যে `.ai/prompts/` ফোল্ডারের প্রতিটি
> ফাইলের ভেতরে বসানো আছে। তাই আলাদা করে কপি করার দরকার নেই — শুধু
> `.ai/prompts/` থেকে সংশ্লিষ্ট `.txt` ফাইলটির পুরোটা কপি করে পেস্ট করুন।
> বিস্তারিত: `.ai/HOW_TO_RUN.md`
>
> নিচের অংশটি রেফারেন্স হিসেবে রাখা হলো।

নিচের বক্সের ভেতরের অংশ হুবহু কপি করে **যেকোনো** মডেলকে দিন (টাস্ক প্রম্পটের
আগে)। এটি দিলে মডেল নিজেই খুঁজে নেবে কোথায় থেমেছিল।

```
তুমি C:\laragon\www\ecommercego প্রজেক্টে কাজ করছ।
ধরে নাও তোমার কোনো পূর্ব স্মৃতি নেই। কাজ শুরুর আগে এই ৪টি ধাপ করো:

১. পড়ো:  .ai/PROJECT_CONTEXT.md
২. পড়ো:  .ai/PROGRESS.md
৩. চালাও: git log --oneline -20
৪. চালাও: git status --short

তারপর PROGRESS.md-এর টেবিলে তোমার নামের (Claude / Gemini / BULK) প্রথম
⬜ PENDING বা 🟨 IN PROGRESS টাস্ক খুঁজে বের করো।

- 🟨 IN PROGRESS পেলে → সেই টাস্কের `.ai/reports/` ফাইলটি পড়ো, কোন ফাইল
  পর্যন্ত শেষ হয়েছে দেখো, তার পরের ফাইল থেকে শুরু করো।
  ⛔ আগে শেষ হওয়া ফাইল আবার করবে না — দুইবার wrap করলে কোড ভাঙবে।
- ⬜ PENDING পেলে → তোমার টাস্ক ফাইল থেকে সেই নম্বরের প্রম্পট পড়ে শুরু করো।

git log আর PROGRESS.md না মিললে git-কে সত্য ধরবে।

শুরু করার আগে আমাকে এক লাইনে জানাও: কোন টাস্কে আছ, কোন ফাইল থেকে শুরু করছ।
```

মডেল উত্তরে বলবে যেমন — *"আমি BULK-2 এ আছি, ৩৭ নম্বর ফাইল থেকে শুরু করছি"*।
তখন আপনি নিশ্চিত হবেন এটি সঠিক জায়গায় আছে। ভুল বললে শুধু সংশোধন করে দিন।

### 🔁 মাঝপথে লিমিট ফুরিয়ে গেলে কাজ না হারানোর নিয়ম (checkpoint commit)

**সমস্যা:** commit হয় টাস্ক শেষে। ২০ ফাইলের কাজে ১৩ ফাইল করার পর লিমিট
ফুরালে ওই ১৩ ফাইল uncommitted, রিপোর্ট লেখা হয়নি — নতুন সেশন কিছুই জানবে না।

**নিয়ম (বড় batch টাস্কে বাধ্যতামূলক — BULK-1 থেকে BULK-4):**

```
প্রতি ৫টি ফাইল শেষ করার পর সাথে সাথে:

১. .ai/reports/<task-report>.md এ ওই ৫টি ফাইলের সারি যোগ করো
২. .ai/PROGRESS.md এ টাস্কের অবস্থা 🟨 IN PROGRESS রাখো,
   নোট কলামে লিখো "N/মোট ফাইল শেষ"
৩. git add -A
   git commit -m "wip(<scope>): <task> files X-Y  [<MODEL>-<TASK#>]"
```

উদাহরণ: `git commit -m "wip(turbo): batch 1 files 1-5  [BULK-2]"`

সব ফাইল শেষ হলে তখন আসল commit (`refactor(turbo): ... [BULK-2]`) করবে এবং
অবস্থা ✅ DONE করবে। তাতে সবচেয়ে খারাপ ক্ষেত্রেও ৪ ফাইলের কাজ হারাবে, ২০টার নয়।

**⚠️ git log এবং এই ফাইল যদি না মেলে — git log-কে সত্য ধরবে।** কমিট মিথ্যা বলে না।

---

## Environment

| বিষয় | মান |
|---|---|
| প্রজেক্ট পাথ | `C:\laragon\www\ecommercego` |
| APP_URL (`.env`) | `http://ecommercego.dev` |
| Storefront URL | `http://ecommercego.dev/{store-slug}/home` ⚠️ `/home` লাগে — শুধু slug দিলে 404 |
| Admin URL | `http://ecommercego.dev/login` |
| ✅ URL যাচাই | Day 1-এ Laragon চালু, `http://ecommercego.dev` কাজ করছে। টেস্টে ব্যবহৃত: `http://ecommercego.dev/stylique/home` |
| টেস্ট store | `id=2`, slug `stylique`. ⚠️ `theme_id` ছিল `greentic` — CLAUDE-1-এ `stylique` করা হয়েছে (DB আপডেট, কোড নয়) |
| ⚠️ DB-তে ডেটা | `products` টেবিল **খালি** (0 row), `categories` খালি। তাই cart/checkout flow টেস্ট করা যায় না |
| DB | MySQL — `ecommercego` · CLI: `C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe -uroot ecommercego` |
| CACHE_DRIVER / CACHE_STORE | `file` ⚠️ (Redis-এ বদলানো হবে — CLAUDE-9) |
| SESSION_DRIVER | `file` ⚠️ |
| Server | Laragon (Apache) — **docroot প্রজেক্ট root, `public/` নয়**। root `.htaccess` whitelist দিয়ে rewrite করে |
| Node / npm | `v26.4.0` / `11.17.0` ✅ |
| Playwright Chromium | `chromium-1234`, `chromium-1243` ইনস্টল ✅ |
| git branch | `day1/asset-pipeline` |
| git baseline tag | `baseline-v0` → commit `17a47e9` |
| **git remote** | `origin` → `https://github.com/arraasheed/ecommercego.git` (public) |

### git remote নিয়ম

| কাজ | অনুমতি |
|---|---|
| `git commit` (লোকাল) | ✅ সব মডেল, প্রতি টাস্কে বাধ্যতামূলক |
| `git push origin <branch>` | ⚠️ শুধু ব্যবহারকারী স্পষ্ট বললে |
| `git push origin master` | ⛔ কখনো নিজে থেকে নয় |
| `git push --force` | ⛔ কখনো নয় |

**কেন push স্বয়ংক্রিয় নয়:** এটি একটি **public** repo। কোনো টাস্কে ভুলে কোনো
গোপন তথ্য commit হয়ে গেলে, push করার আগে ধরা পড়লে ঠিক করা যায় — push হয়ে গেলে
GitHub-এর ইতিহাসে থেকে যায়। তাই প্রতিটি push ব্যবহারকারীর সিদ্ধান্ত।

**push করার সময় যা যাচাই করা আছে (Day 0):**
- `.env` ট্র্যাক করা **নেই** — শুধু `.env.example`, তার সব মান খালি বা `null`
- `vendor/` (177 MB), `node_modules/` (39 MB), uploads, debugbar — সব ignored
- ট্র্যাক করা: 3082 ফাইল / ~156 MB

⚠️ remote-এ `main` ডিফল্ট ব্রাঞ্চ হিসেবে সেট করা আছে কিন্তু repo **খালি**।
আমাদের লোকাল ব্রাঞ্চ `master`। প্রথম push-এ `master` যাবে; ব্যবহারকারী চাইলে
GitHub সেটিংসে ডিফল্ট `master` করতে পারেন, অথবা আমরা `main`-এ push করতে পারি।

### টেস্ট ক্রেডেনশিয়াল
```
Super Admin : superadmin@example.com / 1234
Store Admin : admin@example.com / 1234
Store slug  : stylique   (URL: http://ecommercego.dev/stylique/home)
```

---

## 🤖 কোন মডেল কোন ফাইল ব্যবহার করবে

| মডেল | টাস্ক ফাইল | ভূমিকা |
|---|---|---|
| Claude | `.ai/CLAUDE_TASKS.md` | আর্কিটেকচার, integration, ব্রাউজার টেস্ট, সব merge |
| Gemini | `.ai/GEMINI_TASKS.md` | বিশ্লেষণ ও রিপোর্ট (কোনো কোড পরিবর্তন নয়) |
| **BULK মডেল** | `.ai/BULK_TASKS.md` | যান্ত্রিক bulk edit — recipe অনুযায়ী |

**BULK slot = যেকোনো একটি উপলব্ধ সস্তা/দ্রুত মডেল।** মূল প্ল্যানে DeepSeek ছিল,
কিন্তু সেটি অনুপলব্ধ। তাই ফাইলের নাম মডেল-নিরপেক্ষ করা হয়েছে (`BULK_TASKS.md`)
এবং টাস্ক আইডি `BULK-1` … `BULK-7`।

| প্রার্থী | মন্তব্য |
|---|---|
| **DeepSeek V4 Flash** | 🟢 **বর্তমানে ব্যবহৃত** — মূল প্ল্যান DeepSeek-এর recipe ধরেই লেখা, তাই আচরণ সবচেয়ে কাছাকাছি |
| GLM 5.3 Flash | সমমানের বিকল্প |
| MiniMax 2.5 | বড় context |
| Nemotron 3.5 Light | instruction-following ভালো |

⚠️ **BULK মডেল বদলালে কোনো সমস্যা নেই** — এমনকি মাঝপথে বদলালেও। টাস্কগুলো
self-contained, আর অবস্থা git + PROGRESS.md + reports-এ লেখা থাকে। নতুন মডেল
শুধু উপরের বুট প্রম্পট পেলেই কাজ ধরতে পারবে। মডেল বদলালে শুধু
`.ai/BULK_TASKS.md`-এর একদম উপরের এক লাইনটি আপডেট করবেন।

---

## 📊 সামগ্রিক অবস্থা

**বর্তমান পর্যায়:** Day 1 চলছে — GEMINI-1, GEMINI-2, CLAUDE-1, CLAUDE-2, BULK-1, CLAUDE-3 সম্পন্ন
**সর্বশেষ আপডেট:** Day 1 (CLAUDE-3 শেষ — cache-buster mtime-ভিত্তিক, ৩২টি resource-এর ৩১টি এখন disk cache থেকে আসে)
**সর্বশেষ কমিট:** `4e1ab1f` — perf(cache): replace time() cache-busters with mtime-based versioning [CLAUDE-3]
**সক্রিয় branch:** `day1/asset-pipeline`

**Day 1 ক্রম:** ~~GEMINI-1~~ → ~~GEMINI-2~~ → ~~CLAUDE-1~~ → ~~CLAUDE-2~~ → ~~BULK-1~~ → ~~CLAUDE-3~~ → **CLAUDE-4 (Day 1 ব্রাউজার টেস্ট + Lighthouse) এখন চালানো যায়**

⚠️ **CLAUDE-4-এর জন্য গুরুত্বপূর্ণ (CLAUDE-3 থেকে):**
- Lighthouse/benchmark নেওয়ার আগে **cache warm করতে হবে** — প্রথম লোডে সব
  200 আসবে, দ্বিতীয় লোড থেকেই mtime-caching-এর লাভ দেখা যাবে। "cache
  disabled" মোডে মাপলে P5-এর উন্নতি সংখ্যায় ধরা পড়বে না।
- Admin dashboard-এর ApexCharts radial chart (`Storage Status`) প্রতি
  render-এ ভিন্ন animation frame-এ ধরা পড়ে। pixel-diff করলে ওই অঞ্চল
  (`80,3390 – 340,3700` @ 407px viewport) mask করতে হবে, নাহলে ~1000 px
  মিথ্যা diff আসবে।
- `partision/head.blade.php:52`-এ `css/custome.css` — বানান ভুল, ফাইল নেই,
  404 দেয়। CLAUDE-3-এ ইচ্ছাকৃতভাবে ছোঁয়া হয়নি (সংশোধন করলে হঠাৎ নতুন CSS
  চালু হয়ে ডিজাইন বদলাতে পারে)। CLAUDE-4-এ সিদ্ধান্ত নিতে হবে।

⚠️ **CLAUDE-2-এর জন্য গুরুত্বপূর্ণ (CLAUDE-1 থেকে শেখা):**
- root `.htaccess`-এর rewrite whitelist-এ `build` যোগ করা আছে। ওই লাইন
  না থাকলে Vite-এর সব আউটপুট 404 দেয় এবং পেজ সম্পূর্ণ unstyled হয়।
- admin bundle-এ `tailwind.config.js` (forms plugin সহ) ব্যবহার করবে;
  storefront-এর `tailwind.store.config.js` ছোঁবে না।
- Vite bundle-এ CSS import করার আগে দেখো ভেতরে relative `url()` আছে কি না
  (যেমন `all.min.css`-এ `../webfonts/`) — থাকলে আলাদা `<link>`-এ রাখো।
- বিল্ডের পর **শুধু "build সফল" দেখে থামবে না** — ব্রাউজারে computed style
  যাচাই করো (`getComputedStyle`), না হলে ভাঙা CSS ধরা পড়বে না।

---

## ✅ সম্পন্ন হয়েছে (Day 0 — সেটআপ)

| # | কাজ | ফলাফল |
|---|---|---|
| 0.1 | git init + `.gitignore` + baseline commit + tag | ✅ commit `17a47e9`, tag `baseline-v0`, branch `master`, 3051 ফাইল / 156 MB ট্র্যাক করা |
| 0.2 | `.gitignore` — গোপনীয়তা ও আকার | ✅ `.env`, `vendor/` (177 MB), `node_modules/` (39 MB), `storage/debugbar`, uploads বাদ। যাচাই করা: staged ফাইলে কোনো secret নেই |
| 0.3 | Playwright MCP + chrome-devtools MCP | ✅ `~/.config/opencode/opencode.jsonc` |
| 0.4 | Chromium ব্রাউজার | ✅ `chromium-1234` + `chromium-1243` |
| 0.5 | Vision model আপগ্রেড (Qwen3-VL 8B → 235B) | ✅ non-vision মডেলও স্ক্রিনশট পড়তে পারবে |
| 0.6 | কোডবেস স্ক্যান + সমস্যা চিহ্নিতকরণ | ✅ ৮টি সমস্যা (P1-P8) — `PROJECT_CONTEXT.md` |
| 0.7 | `.ai/` ডকুমেন্টেশন সিস্টেম | ✅ ৫টি ডক + `reports/` + `screenshots/` + `state/` — প্রজেক্টের ভেতরে বসানো |
| 0.8 | `.agents/` auto-resume hook (Antigravity) | ✅ PreInvocation + PostToolUse + Stop। ⚠️ শুধু Antigravity-তে চলে — অন্য টুলে উপরের বুট প্রম্পট ব্যবহার করতে হবে |
| 0.9 | DeepSeek → BULK slot রূপান্তর | ✅ `DEEPSEEK_TASKS.md` → `BULK_TASKS.md`, ৩৮টি টাস্ক আইডি `BULK-N`, checkpoint commit নিয়ম যোগ |

> **সংশোধনের নোট:** Day 0-এর আগের সংস্করণে দাবি করা ছিল git repo ও `.ai/`
> তৈরি হয়ে গেছে (commit `b6a4b3e`)। বাস্তবে ফাইলগুলো Desktop-এ পড়ে ছিল, `.git`
> ছিল না। এই সেশনে সত্যিকারভাবে বসানো হলো — তাই commit hash এখন `17a47e9`।

---

## 📋 টাস্ক ট্র্যাকার

### Day 1 — Asset Pipeline (branch: `day1/asset-pipeline`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| GEMINI-1  Asset inventory (`public/` 31MB অডিট) | Gemini | ✅ DONE | — | রিপোর্ট → `.ai/reports/asset-inventory.md` · Claude যাচাই: সংখ্যা নির্ভুল |
| GEMINI-2  Tailwind class scan (Play CDN বাদ দিতে) | Gemini | ✅ DONE | `c945b79` | রিপোর্ট → `.ai/reports/tailwind-classes.md` · ⚠️ safelist অসম্পূর্ণ — যাচাই: `.ai/reports/gemini2-verification.md`, CLAUDE-1 এ ৪টি class যোগ করতে হবে |
| CLAUDE-1  Vite config + Tailwind build (P1 fix) | Claude | ✅ DONE | `a69d27e` → `c69e14a` | Play CDN 466KB সরানো · FCP −148ms, LCP −196ms, TBT −66% · ৫ পেজে pixel-diff = 0 · রিপোর্ট → `.ai/reports/benchmark.md` |
| CLAUDE-2  Admin ২৮ CSS → bundle (P3 fix) | Claude | ✅ DONE | `9d4d831` | CSS requests 20→2 (−90%), CSS bytes 994→755.7 KB (−24%), LCP −80ms · 4 variants (RTL/dark) · kill-switch `LEGACY_ADMIN_CSS` · রিপোর্ট → `.ai/reports/admin-css-map.md` · benchmark updated |
| CLAUDE-3  `?v=time()` সরানো (P5 fix) | Claude | ✅ DONE | `4e1ab1f` | ২১ ফাইল / ৪২ জায়গা · disk-cache 0→31 (৩২টির মধ্যে) · helper: `asset_v()`, `get_file_v()`, `asset_version()` · `.htaccess` Cache-Control · kill-switch `LEGACY_ASSET_TIME_BUSTER` · pixel-diff 0 · রিপোর্ট → `.ai/reports/cache-buster-map.md` |
| BULK-1  Image → lazy + width/height | BULK মডেল | ✅ DONE | `f9e6f11` | ৪৫ img: ২৬ lazy + ৯ eager(LCP) + ৮ আগে থেকে · ব্যতিক্রম ২ (FB pixel, commented) · রিপোর্ট → `.ai/reports/img-lazy-report.md` · missing dims → `.ai/reports/img-missing-dimensions.md` |
| CLAUDE-4  Day 1 ব্রাউজার টেস্ট + Lighthouse | Claude | ⬜ PENDING | — | before/after সংখ্যা |

### Day 2 — Turbo Drive (branch: `day2/turbo-drive`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| GEMINI-3  ১৭০টি inline script ইনভেন্টরি | Gemini | ✅ DONE | — | রিপোর্ট → `.ai/reports/script-inventory.md` |
| CLAUDE-5  Turbo ইনস্টল + bootstrap + kill-switch | Claude | ⬜ PENDING | — | |
| BULK-2  script → `turbo:load` (batch 1: ৬০টি) | BULK মডেল | ⬜ PENDING | — | recipe অনুসরণ |
| BULK-3  script → `turbo:load` (batch 2: ৬০টি) | BULK মডেল | ⬜ PENDING | — | |
| BULK-4  script → `turbo:load` (batch 3: বাকি) | BULK মডেল | ⬜ PENDING | — | |
| CLAUDE-6  DataTable + modal + select2 re-init | Claude | ⬜ PENDING | — | ৭০ table, ১০১ modal |
| CLAUDE-7  Turbo 303 redirect middleware | Claude | ⬜ PENDING | — | form/validation |
| CLAUDE-8  Day 2 ব্রাউজার টেস্ট (২০ পেজ) | Claude | ⬜ PENDING | — | |

### Day 3 — PWA + Workbox (branch: `day3/pwa-workbox`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| CLAUDE-9   Redis + OPcache + optimize | Claude | ⬜ PENDING | — | |
| CLAUDE-10  Workbox SW (P4 fix) | Claude | ⬜ PENDING | — | ভাঙা SW প্রতিস্থাপন |
| CLAUDE-11  Per-store manifest generator | Claude | ⬜ PENDING | — | |
| BULK-5  Offline page + install prompt UI | BULK মডেল | ⬜ PENDING | — | |
| CLAUDE-12  Day 3 PWA টেস্ট (install + offline) | Claude | ⬜ PENDING | — | |

### Day 4 — Mobile App-Feel (branch: `day4/mobile-polish`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| GEMINI-4   মোবাইল UX অডিট (স্ক্রিনশট বিশ্লেষণ) | Gemini | ⬜ PENDING | — | |
| BULK-6  Mobile bottom nav (storefront) | BULK মডেল | ⬜ PENDING | — | |
| BULK-7  DataTable → mobile card view (CSS) | BULK মডেল | ⬜ PENDING | — | ৭০ table |
| CLAUDE-13  Skeleton loader + Turbo preview | Claude | ⬜ PENDING | — | |
| CLAUDE-14  Touch polish (tap delay, dvh, safe-area) | Claude | ⬜ PENDING | — | |
| CLAUDE-15  Vue island: cart drawer + variant | Claude | ⬜ PENDING | — | `api.php` ব্যবহার |
| CLAUDE-16  চূড়ান্ত টেস্ট + master-এ merge | Claude | ⬜ PENDING | — | |

**অবস্থার প্রতীক:** ⬜ PENDING · 🟨 IN PROGRESS · ✅ DONE · ❌ BLOCKED · ⏭️ SKIPPED

---

## 🚧 Blockers (আটকে যাওয়া কাজ)

*এখনো কিছু নেই।*

> কোনো মডেল আটকে গেলে এখানে এই ফরম্যাটে লিখবে:
> ```
> ### [তারিখ] <MODEL>-<TASK#> — ব্লকড
> কী করতে গিয়েছিলাম:
> কী error এসেছে (হুবহু):
> কী কী চেষ্টা করেছি:
> কী দরকার:
> ```

---

## 📝 সিদ্ধান্তের লগ (কেন এভাবে করা হলো)

| তারিখ | সিদ্ধান্ত | কারণ |
|---|---|---|
| Day 0 | Vue 3 full rewrite বাতিল | 508 blade + 133 controller = ৩-৬ মাস; upstream update path নষ্ট হবে |
| Day 0 | Turbo Drive বাছাই | ৯০% SPA feel, blade কোড প্রায় অপরিবর্তিত, kill-switch সহজ |
| Day 0 | Vue শুধু island হিসেবে | ৪টি জায়গায় reactive দরকার; বাকি সব server HTML যথেষ্ট |
| Day 0 | Tailwind Play CDN অপসারণ = সর্বোচ্চ প্রাধান্য | 466 KB + runtime CSS generation = সবচেয়ে বড় performance killer |
| Day 0 | git init বাধ্যতামূলক করা হলো | প্রতিটি ধাপে ফেরার পথ; মডেল ভুল করলে instant restore |
| Day 0 | vision model 8B → 235B | non-vision মডেলও যাতে স্ক্রিনশট নির্ভুল পড়তে পারে |
| Day 0 | DeepSeek slot → মডেল-নিরপেক্ষ "BULK" slot | DeepSeek অনুপলব্ধ। ফাইল/টাস্ক আইডিতে মডেলের নাম থাকলে নতুন মডেল বিভ্রান্ত হয় ("এটা আমার ফাইল না")। এখন Ling / MiniMax / Nemotron — যেকোনোটি, এমনকি মাঝপথে বদলালেও চলবে |
| Day 0 | checkpoint commit (প্রতি ৫ ফাইল) যোগ করা হলো | সস্তা মডেলের টোকেন লিমিট মাঝপথে ফুরায়; টাস্ক-শেষে-commit নিয়মে ২০ ফাইলের কাজ হারানোর ঝুঁকি ছিল, এখন সর্বোচ্চ ৪ ফাইল |
| Day 0 | বুট প্রম্পট PROGRESS.md-এ লেখা হলো | `.agents/hooks.json` শুধু Antigravity-তে চলে। BULK মডেল অন্য টুলে চলবে — তাই টুল-নিরপেক্ষ, কপি-পেস্ট-যোগ্য একটি প্রম্পট দরকার ছিল |
| Day 0 | `screenshots/` ও `state/` git-ignored | বড় বাইনারি ও machine-local runtime state। ignored থাকায় `git clean -fd`-এ মুছবেও না |
