# BULK-1 Report — Image lazy loading + async decoding (Day 1)

**Task:** BULK-1 — storefront theme-এর সব `<img>`-এ lazy loading যোগ করা
**Scope:** `themes/stylique/views/**/*.blade.php` + `resources/views/front_end/**/*.blade.php`
**Date:** 2026-09-04
**Branch:** `day1/asset-pipeline`

## 1. সারসংক্ষেপ

| মাপ | সংখ্যা |
|---|---|
| মোট `<img>` পাওয়া গেছে | ৪৫ (২৬টি ফাইলে) |
| `loading="lazy"` + `decoding="async"` যোগ | ২৬ (পাইলট ৩ সহ) |
| `loading="eager"` + `fetchpriority="high"` + `decoding="async"` | ৯ (LCP উপাদান) |
| আগে থেকেই `loading="lazy"` ছিল → স্পর্শ করিনি | ৮ |
| স্পর্শ করিনি (ইচ্ছাকৃত, কারণ সহ) | ২ |
| width/height অনুপস্থিত (Claude-র জন্য তালিকাভুক্ত) | ২৭ → `.ai/reports/img-missing-dimensions.md` |

## 2. eager + fetchpriority="high" (LCP — header/logo/banner/slider/swiper শব্দ যুক্ত)

Recipe ১-এর ব্যতিক্রম: এই img-গুলো এমন element-এ আছে যাদের class-এ `header` / `logo` / `swiper` শব্দ আছে → `loading="eager"` + `fetchpriority="high"`।

| ফাইল | লাইন | কারণ |
|---|---|---|
| `themes/stylique/views/main_file.blade.php` | 79 | class `partner-logo` (logo) |
| `themes/stylique/views/front_end/partison/header.blade.php` | 11 | `<header>` + class `logo-col` (header/logo) |
| `resources/views/front_end/jQueryRoute.blade.php` | 22 | class `logo-img` (logo) |
| `resources/views/front_end/common/offer.blade.php` | 15 | `.offer-swiper` / `.swiper-slide` (swiper) |
| `resources/views/front_end/pages/about.blade.php` | 95 | `.team-swiper` / `.swiper-slide` (swiper) |
| `resources/views/front_end/pages/product-detail.blade.php` | 23, 31, 53, 61 | `.main-image-slider` / `.thumbnail-slider` / `.swiper-slide` (swiper) |

> ⚠️ **Claude-র জন্য নোট:** offer/team/product-gallery img-গুলো recipe অনুযায়ী literal ভাবে eager হয়েছে (recipe-তে swiper = LCP)। এগুলো below-the-fold থাকলে `lazy` করাই ভালো হতে পারে — Claude যাচাই করে বদলাতে পারবেন।

## 3. lazy + decoding="async" (সাধারণ img)

`main_file.blade.php` (315), `jQueryRoute.blade.php` (73), `common/wish_list.blade.php` (19), `common/checkout/checkout_form.blade.php` (650), `pages/about.blade.php` (35, 41), `pages/article.blade.php` (32, 53, 126), `pages/auction_order_detail.blade.php` (288), `pages/cart-list-sidebar.blade.php` (18), `pages/cart-list.blade.php` (41), `pages/checkout-cart-list.blade.php` (13), `pages/collection-list.blade.php` (31, 62), `pages/order-status.blade.php` (26), `pages/order_list_filter.blade.php` (77), `pages/add_tickets.blade.php` (22), `pages/refund_order.blade.php` (172), `pages/reply_support_ticket.blade.php` (94), `pages/support_ticket_edit.blade.php` (27), `sections/order_detail.blade.php` (372), `sections/payment_list.blade.php` (17)।

**পাইলট (৩ img / ২ ফাইল, commit `349d4bf`):** `components/blog-card.blade.php` (6), `front_end/partison/footer.blade.php` (72, 73)

## 4. আগে থেকেই `loading="lazy"` ছিল → স্পর্শ করিনি (Rule ৪)

`main_file.blade.php` L26 (hero slider), L56 (offer banner), L108, L178 (category), L378 (service) · `components/product-card.blade.php` L10 · `footer.blade.php` L10 (footer logo) · `header.blade.php` L152 (category icon)

## 5. স্পর্শ করিনি (ইচ্ছাকৃত) — Claude দেখবে

| ফাইল | লাইন | কারণ |
|---|---|---|
| `resources/views/front_end/jQueryRoute.blade.php` | 330 | Facebook Pixel noscript `1x1` tracking img (`style="display:none"`) — lazy দিলে analytics নষ্ট হতে পারে |
| `resources/views/front_end/pages/checkout.blade.php` | 185 | Blade comment-এর ভেতরে (`{{-- ... --}}`) — dead code |

## 6. যাচাই

- ∀ img-এ `loading=` বিদ্যমান (যেসব ফাইলে img আছে) — ২টি ইচ্ছাকৃত ব্যতিক্রম ছাড়া (ধাপ ৫)।
- কোনো ফাইলের indentation / variable / logic পরিবর্তন হয়নি — শুধু attribute যোগ।
- নিষিদ্ধ ফোল্ডার (`app/ routes/ database/ vendor/ packages/`) স্পর্শ করা হয়নি।

## 7. সততা হিসাব (Rule ৫)

- **পরিবর্তন করেছি:** ২৪টি ফাইল (২৬ img lazy + ৯ img eager)
- **স্পর্শ করিনি (কারণ সহ):** ১০টি img — ৮টি আগে থেকেই `loading` ছিল, ২টি ইচ্ছাকৃত
- **সন্দেহ — Claude দেখবে:** jQueryRoute pixel + checkout commented img (উপরের টেবিল)