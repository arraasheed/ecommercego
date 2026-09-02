# PROGRESS — কাজের অবস্থা ট্র্যাকার

> **🔴 প্রতিটি মডেল কাজ শুরুর আগে এই ফাইল পড়বে এবং কাজ শেষে আপডেট করবে।**
>
> ব্যবহারকারী যদি শুধু বলেন **"কাজ শুরু করো"** বা **"আগের কাজ কন্টিনিউ করো"** —
> মডেল এই ফাইল পড়ে নিজেই বুঝে নেবে কোথায় থেমেছিল। ব্যবহারকারীকে কিছু বলতে হবে না।

---

## 🚀 যেকোনো মডেলের জন্য বুট-আপ নির্দেশনা (প্রতিবার এটাই করবে)

> **Antigravity-তে এটি এখন স্বয়ংক্রিয়।** `.agents/hooks.json` এর PreInvocation hook
> প্রতি সেশনের শুরুতে নিজেই `PROGRESS.md` + `git log` + crash journal পড়ে একটি
> resume brief inject করে। তাই ব্যবহারকারীকে আর কিছু ব্যাখ্যা করতে হবে না —
> শুধু **"কাজ কন্টিনিউ করো"** বললেই চলবে।
> নিচের ধাপগুলো ম্যানুয়াল fallback হিসেবে রাখা হলো।

```
১. পড়ো:  .ai/PROJECT_CONTEXT.md      (নিয়ম ও আর্কিটেকচার)
২. পড়ো:  .ai/PROGRESS.md             (এই ফাইল — কোথায় আছি)
৩. চালাও: git log --oneline -15       (আসলে কী কমিট হয়েছে)
৪. চালাও: git status --short          (অসমাপ্ত কাজ আছে কি)
৫. খোঁজো: নিচের টেবিলে তোমার নামের প্রথম `⬜ PENDING` টাস্ক
৬. পড়ো:  .ai/<তোমার নাম>_TASKS.md    → সেই টাস্ক নম্বরের প্রম্পট
৭. কাজ করো → টেস্ট করো → commit করো → এই ফাইল আপডেট করো
```

**⚠️ git log এবং এই ফাইল যদি না মেলে — git log-কে সত্য ধরবে।** কমিট মিথ্যা বলে না।

---

## Environment

| বিষয় | মান |
|---|---|
| প্রজেক্ট পাথ | `C:\laragon\www\ecommercego` |
| APP_URL | `http://localhost/ecommercego` |
| Storefront URL | `http://localhost/ecommercego/{store-slug}` |
| Admin URL | `http://localhost/ecommercego/login` |
| DB | MySQL — `ecommercego` |
| CACHE_DRIVER | `file` ⚠️ (Redis-এ বদলানো হবে — CLAUDE-9) |
| SESSION_DRIVER | `file` ⚠️ |
| Server | Laragon (Apache) |
| Node | ইনস্টল আছে ✅ |
| Playwright | Chromium ইনস্টল ✅ |
| git baseline tag | `baseline-v0` |

### টেস্ট ক্রেডেনশিয়াল
```
Admin  : (ব্যবহারকারী দেবেন — এখনো দেওয়া হয়নি)
Store  : (ব্যবহারকারী দেবেন)
Slug   : (ব্যবহারকারী দেবেন)
```
> Claude প্রথম ব্রাউজার টেস্টের আগে এগুলো চাইবে।

---

## 📊 সামগ্রিক অবস্থা

**বর্তমান পর্যায়:** Day 0 — সেটআপ সম্পন্ন, Day 1 শুরুর অপেক্ষা
**সর্বশেষ আপডেট:** সেটআপ পর্যায়
**সর্বশেষ কমিট:** `b6a4b3e` — baseline snapshot

---

## ✅ সম্পন্ন হয়েছে (Day 0 — সেটআপ)

| # | কাজ | কে | ফলাফল |
|---|---|---|---|
| 0.1 | git init + `.gitignore` + baseline commit | Claude | ✅ commit `b6a4b3e`, tag `baseline-v0` |
| 0.2 | Playwright MCP + chrome-devtools MCP যোগ | Claude | ✅ `~/.config/opencode/opencode.jsonc` |
| 0.3 | Chromium ব্রাউজার ডাউনলোড | Claude | ✅ `ms-playwright/chromium-1234` |
| 0.4 | Vision model আপগ্রেড (Qwen3-VL-8B → 235B) | Claude | ✅ non-vision মডেলও স্ক্রিনশট পড়তে পারবে |
| 0.5 | কোডবেস স্ক্যান + সমস্যা চিহ্নিতকরণ | Claude | ✅ ৮টি সমস্যা (P1-P8) — `PROJECT_CONTEXT.md` |
| 0.6 | `.ai/` ডকুমেন্টেশন সিস্টেম তৈরি | Claude | ✅ ৫টি ফাইল |
| 0.7 | ক্র্যাশ-প্রুফ auto-resume hook (Antigravity) | Claude | ✅ `.agents/` — PreInvocation + PostToolUse + Stop, সব failure mode টেস্ট করা |

---

## 📋 টাস্ক ট্র্যাকার

### Day 1 — Asset Pipeline (branch: `day1/asset-pipeline`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| GEMINI-1  Asset inventory (`public/` 31MB অডিট) | Gemini | ⬜ PENDING | — | রিপোর্ট → `.ai/reports/asset-inventory.md` |
| GEMINI-2  Tailwind class scan (Play CDN বাদ দিতে) | Gemini | ⬜ PENDING | — | রিপোর্ট → `.ai/reports/tailwind-classes.md` |
| CLAUDE-1  Vite config + Tailwind build (P1 fix) | Claude | ⬜ PENDING | — | Play CDN 466KB সরানো |
| CLAUDE-2  Admin ২৮ CSS → bundle (P3 fix) | Claude | ⬜ PENDING | — | |
| CLAUDE-3  `?v=time()` সরানো (P5 fix) | Claude | ⬜ PENDING | — | ৭টি ফাইল |
| BULK-1  Image → lazy + width/height | BULK মডেল | ⬜ PENDING | — | CLS fix |
| CLAUDE-4  Day 1 ব্রাউজার টেস্ট + Lighthouse | Claude | ⬜ PENDING | — | before/after সংখ্যা |

### Day 2 — Turbo Drive (branch: `day2/turbo-drive`)

| টাস্ক | মডেল | অবস্থা | কমিট | নোট |
|---|---|---|---|---|
| GEMINI-3  ১৭০টি inline script ইনভেন্টরি | Gemini | ⬜ PENDING | — | রিপোর্ট → `.ai/reports/script-inventory.md` |
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
