# PROGRESS — কাজের অবস্থা ট্র্যাকার

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
| Storefront URL | `http://ecommercego.dev/{store-slug}` |
| Admin URL | `http://ecommercego.dev/login` |
| ⚠️ URL যাচাই | Day 0-এ `ecommercego.dev`, `ecommercego.test`, `localhost/ecommercego` — **তিনটিই unreachable**। Laragon বন্ধ ছিল। প্রথম ব্রাউজার টেস্টের আগে Laragon চালু করতে হবে এবং সঠিক URL এখানে লিখতে হবে। |
| DB | MySQL — `ecommercego` |
| CACHE_DRIVER / CACHE_STORE | `file` ⚠️ (Redis-এ বদলানো হবে — CLAUDE-9) |
| SESSION_DRIVER | `file` ⚠️ |
| Server | Laragon (Apache) |
| Node / npm | `v26.4.0` / `11.17.0` ✅ |
| Playwright Chromium | `chromium-1234`, `chromium-1243` ইনস্টল ✅ |
| git branch | `master` |
| git baseline tag | `baseline-v0` → commit `17a47e9` |

### টেস্ট ক্রেডেনশিয়াল
```
Admin  : (ব্যবহারকারী দেবেন — এখনো দেওয়া হয়নি)
Store  : (ব্যবহারকারী দেবেন)
Slug   : (ব্যবহারকারী দেবেন)
```
> Claude প্রথম ব্রাউজার টেস্টের আগে এগুলো চাইবে।

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

| প্রার্থী | context | মন্তব্য |
|---|---|---|
| Ling 3.0 Flash | ~128K | দ্রুত ও সস্তা — প্রথম পছন্দ |
| MiniMax 2.5 | ~200K | বড় context, ভালো বিকল্প |
| Nemotron 3.5 Light | ~131K | instruction-following ভালো |

⚠️ **BULK মডেল বদলালে কোনো সমস্যা নেই** — এমনকি মাঝপথে বদলালেও। টাস্কগুলো
self-contained, আর অবস্থা git + PROGRESS.md + reports-এ লেখা থাকে। নতুন মডেল
শুধু উপরের বুট প্রম্পট পেলেই কাজ ধরতে পারবে।

---

## 📊 সামগ্রিক অবস্থা

**বর্তমান পর্যায়:** Day 0 সম্পন্ন — Day 1 শুরুর জন্য প্রস্তুত
**সর্বশেষ আপডেট:** Day 0 (git + `.ai/` + `.agents/` বাস্তবে বসানো হলো)
**সর্বশেষ কমিট:** `17a47e9` — baseline snapshot, tag `baseline-v0`

**Day 1 শুরুর ক্রম:** GEMINI-1 → GEMINI-2 → *(এই দুইটি শেষ হলে)* → CLAUDE-1
BULK-1 স্বাধীন, যেকোনো সময় চালানো যায়।

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
| Day 0 | DeepSeek slot → মডেল-নিরপেক্ষ "BULK" slot | DeepSeek অনুপলব্ধ। ফাইল/টাস্ক আইডিতে মডেলের নাম থাকলে নতুন মডেল বিভ্রান্ত হয় ("এটা আমার ফাইল না")। এখন Ling / MiniMax / Nemotron — যেকোনোটি, এমনকি মাঝপথে বদলালেও চলবে |
| Day 0 | checkpoint commit (প্রতি ৫ ফাইল) যোগ করা হলো | সস্তা মডেলের টোকেন লিমিট মাঝপথে ফুরায়; টাস্ক-শেষে-commit নিয়মে ২০ ফাইলের কাজ হারানোর ঝুঁকি ছিল, এখন সর্বোচ্চ ৪ ফাইল |
| Day 0 | বুট প্রম্পট PROGRESS.md-এ লেখা হলো | `.agents/hooks.json` শুধু Antigravity-তে চলে। BULK মডেল অন্য টুলে চলবে — তাই টুল-নিরপেক্ষ, কপি-পেস্ট-যোগ্য একটি প্রম্পট দরকার ছিল |
| Day 0 | `screenshots/` ও `state/` git-ignored | বড় বাইনারি ও machine-local runtime state। ignored থাকায় `git clean -fd`-এ মুছবেও না |
