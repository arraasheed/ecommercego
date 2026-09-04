# GEMINI-2 রিপোর্ট যাচাই (Claude)

**তারিখ:** Day 1
**যাচাই করা রিপোর্ট:** `.ai/reports/tailwind-classes.md`
**উদ্দেশ্য:** CLAUDE-1 এ Play CDN সরানোর আগে safelist সম্পূর্ণ কি না নিশ্চিত করা

---

## রায়: রিপোর্ট কাজে লাগবে, কিন্তু safelist অসম্পূর্ণ

Gemini-র দিকনির্দেশ সঠিক, কিন্তু কভারেজ প্রত্যাশার চেয়ে কম। CLAUDE-1 এ
তার safelist হুবহু ব্যবহার করলে মোবাইল filter panel ও product tab ভেঙে যাবে।

## ✅ যা সঠিক

| দাবি | যাচাই |
|---|---|
| `tailwind.config.js` theme ফোল্ডার cover করে না | ✅ সত্যি — শুধু `resources/views/**` আছে |
| প্রস্তাবিত content path | ✅ সঠিক, CLAUDE-1 এ ব্যবহারযোগ্য |
| dynamic class ternary-তে আছে | ✅ সত্যি |
| `col-(md|lg|xl|xxl)-[0-9]+` pattern safelist | ✅ ভালো ধরা — Bootstrap grid এখনো admin-এ ব্যবহৃত |
| forms plugin ব্যবহৃত | ✅ `tailwind.config.js`-এ ইতিমধ্যে যোগ করা আছে |

উদ্ধৃত ৫টি ফাইলের ৪টি বাস্তবে আছে।

## ❌ যা ভুল বা অনুপস্থিত

### ১. `public/assets/js/custom.js` — ফাইলটি নেই

রিপোর্টের ৩ নম্বর সেকশনে উদ্ধৃত। বাস্তবে ওই পাথে কিছু নেই। সম্ভবত
`public/js/custom.js` (16 KB) বোঝানো হয়েছে। যাচাই না করে উদ্ধৃত করা হয়েছে।

### ২. JS থেকে যোগ হওয়া Tailwind class — ৪টি বাদ পড়েছে

Gemini শুধু `active`, `show`, `hidden` লিখেছে। `themes/stylique/assets/js/custom.js`
এ ৩৭টি `classList` কল আছে। এর মধ্যে প্রকৃত Tailwind utility যেগুলো
safelist ছাড়া build-এ থাকবে না:

| class | কোথায় | না থাকলে কী ভাঙবে |
|---|---|---|
| `-translate-x-full` | line 620, 627 | 🔴 মোবাইল filter panel — খুলবে না বা আটকে থাকবে |
| `rotate-180` | line 160 | 🟠 dropdown তীর ঘুরবে না |
| `border-transparent` | line 175, 184 | 🟠 product tab-এর নিচের বর্ডার |
| `border-[[]var(--primary-color)[]]` | line 172, 183 | 🟠 সক্রিয় tab-এর হাইলাইট |

`active`, `show`, `open`, `no-scroll` — এগুলো Tailwind নয়, theme-এর নিজের CSS-এ
সংজ্ঞায়িত (`open` ৯ বার, `active` ১১ বার, `show` ৫ বার `themes/stylique/assets/css/`
এ পাওয়া গেছে)। এগুলো safelist-এ দেওয়ার দরকার নেই — Gemini অপ্রয়োজনীয়ভাবে
তালিকায় রেখেছে, তবে ক্ষতি নেই।

### ৩. বাকি দুই theme স্ক্যান করা হয়নি

প্রম্পটে তিনটি theme বলা ছিল। রিপোর্টে শুধু stylique।

```
greentic/assets/js/custom.js   → 51টি classList কল
techzonix/assets/js/custom.js  → 44টি classList কল
```

**তাৎক্ষণিক প্রভাব নেই** — CLAUDE-1 শুধু stylique-এ Play CDN সরাবে। কিন্তু
পরে বাকি দুই theme-এ যাওয়ার আগে এই স্ক্যান করতে হবে।

### ৪. সংখ্যা দুইটি বাড়িয়ে বলা

| Gemini | বাস্তব |
|---|---|
| "৪৫০+ unique class" | ২৮৪টি static class (stylique blade-এ) |
| "৩০+ dynamic class" | ১৬টি dynamic `class=` লাইন (তিন theme মিলে), stylique-এ ৪টি |
| রিপোর্টে unique class তালিকা | ৪৯টি (নিজেই "sample" লিখেছে) |

তালিকা অসম্পূর্ণ বলে স্বীকার করেছে — সেটা সৎ। কিন্তু "৪৫০+" দাবির পক্ষে
প্রমাণ নেই।

## CLAUDE-1 এ যা করতে হবে

**Gemini-র safelist হুবহু ব্যবহার করা যাবে না।** নিচের ৪টি যোগ করতে হবে:

```js
safelist: [
    // Gemini-র তালিকা (রাখা হলো)
    'relative', 'dropdown', 'has-item', 'pe-4', 'flex', 'items-center',
    'block', 'px-4', 'py-2', 'text-gray-700', 'hover:bg-gray-100',
    'hover:text-orange-500', 'bg-white', 'shadow-lg', 'rounded-md',
    'py-1', 'z-50', 'absolute', 'left-0', 'mt-2', 'w-40',

    // Claude যোগ করল — JS classList থেকে, না থাকলে ফিচার ভাঙবে
    '-translate-x-full',   // mobile filter panel (custom.js:620,627)
    'rotate-180',          // dropdown arrow (custom.js:160)
    'border-transparent',  // product tab (custom.js:175,184)
    'hidden',              // ১৩ জায়গায় toggle হয়

    { pattern: /col-(md|lg|xl|xxl)-[0-9]+/ },
],
```

`border-[var(--primary-color)]` arbitrary value — safelist-এ string হিসেবে
কাজ করবে না। CLAUDE-1 এ আলাদা কৌশল লাগবে (হয় theme CSS-এ সরানো, অথবা
blade-এ static class হিসেবে রাখা)।

**এছাড়া CLAUDE-1 এ আমি নিজে করব:**
- তিন theme-এর `custom.js` পূর্ণ স্ক্যান (Gemini শুধু একটি করেছে)
- build-এর পর প্রতিটি পেজের স্ক্রিনশট মিলিয়ে দেখা — safelist তত্ত্বে নয়,
  চোখে যাচাই

## সিদ্ধান্ত

**CLAUDE-1 এগোতে পারে।** রিপোর্টটি ভিত্তি হিসেবে যথেষ্ট, এবং যেখানে
অসম্পূর্ণ সেখানে আমার নিজের যাচাই আছে। Gemini-কে আবার চালানোর দরকার নেই —
সেটা সময়ের অপচয় হবে, কারণ ব্রাউজার টেস্টই আসল নিরাপত্তা জাল।
