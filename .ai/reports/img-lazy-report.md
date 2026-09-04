# BULK-1 — Image lazy loading রিপোর্ট

**অবস্থা:** 🟨 IN PROGRESS
**সর্বশেষ commit:** `349d4bf` — `wip(images): pilot 2 files [BULK-1]`

> এই ফাইলটি BULK মডেল লেখার কথা ছিল কিন্তু লেখেনি। Claude পাইলট যাচাই করার
> সময় তৈরি করল, যাতে পরের সেশন সঠিক জায়গা থেকে শুরু করতে পারে।

---

## scope

```
themes/stylique/views/**/*.blade.php
resources/views/front_end/**/*.blade.php
```

| | সংখ্যা |
|---|---|
| scope-এ blade ফাইল | ১১৫ |
| `<img>` আছে যে ফাইলে | ২৬ |
| মোট `<img>` ট্যাগ | ৪৫ |
| `loading=` আছে এখন | ১১ |
| **বাকি** | **৩৪ (২৩টি ফাইলে)** |

⚠️ ১১টির মধ্যে **৮টি WorkDo-র মূল কোডে আগেই ছিল** — BULK মডেলের কাজ নয়।
BULK মডেল পাইলটে ৩টি যোগ করেছে।

---

## ✅ সম্পন্ন ফাইল — এগুলো আর খুলবে না

| ফাইল | img | কে করেছে |
|---|---|---|
| `themes/stylique/views/components/blog-card.blade.php` | 1/1 | BULK (পাইলট) |
| `themes/stylique/views/front_end/partison/footer.blade.php` | 3/3 | 1টি WorkDo + 2টি BULK (পাইলট) |
| `themes/stylique/views/components/product-card.blade.php` | 1/1 | WorkDo, আগেই ছিল |

⛔ **এই তিনটি ফাইলে আবার `loading=` যোগ করলে একই ট্যাগে দুইটি attribute হবে —
অবৈধ HTML।**

---

## 🟨 আংশিক — শুধু `loading=` নেই সেগুলো করতে হবে

| ফাইল | img | done | বাকি |
|---|---|---|---|
| `themes/stylique/views/main_file.blade.php` | 7 | 5 (WorkDo) | 2 |
| `themes/stylique/views/front_end/partison/header.blade.php` | 2 | 1 (WorkDo) | 1 |

---

## ⬜ বাকি ফাইল — ২১টি (৩১টি img)

| # | ফাইল | বাকি img |
|---|---|---|
| 1 | `resources/views/front_end/pages/product-detail.blade.php` | 4 |
| 2 | `resources/views/front_end/pages/article.blade.php` | 3 |
| 3 | `resources/views/front_end/jQueryRoute.blade.php` | 3 |
| 4 | `resources/views/front_end/pages/about.blade.php` | 3 |
| 5 | `resources/views/front_end/pages/collection-list.blade.php` | 2 |
| 6 | `resources/views/front_end/pages/order_list_filter.blade.php` | 1 |
| 7 | `resources/views/front_end/pages/order-status.blade.php` | 1 |
| 8 | `resources/views/front_end/sections/payment_list.blade.php` | 1 |
| 9 | `resources/views/front_end/sections/order_detail.blade.php` | 1 |
| 10 | `resources/views/front_end/pages/reply_support_ticket.blade.php` | 1 |
| 11 | `resources/views/front_end/pages/refund_order.blade.php` | 1 |
| 12 | `resources/views/front_end/pages/support_ticket_edit.blade.php` | 1 |
| 13 | `resources/views/front_end/pages/checkout.blade.php` | 1 |
| 14 | `resources/views/front_end/common/wish_list.blade.php` | 1 |
| 15 | `resources/views/front_end/common/checkout/checkout_form.blade.php` | 1 |
| 16 | `resources/views/front_end/common/offer.blade.php` | 1 |
| 17 | `resources/views/front_end/pages/add_tickets.blade.php` | 1 |
| 18 | `resources/views/front_end/pages/cart-list.blade.php` | 1 |
| 19 | `resources/views/front_end/pages/checkout-cart-list.blade.php` | 1 |
| 20 | `resources/views/front_end/pages/auction_order_detail.blade.php` | 1 |
| 21 | `resources/views/front_end/pages/cart-list-sidebar.blade.php` | 1 |

সাথে উপরের দুইটি আংশিক ফাইল = **২৩ ফাইল / ৩৪ img**।

---

## পাইলটে যা করা হয়েছে (commit `349d4bf`)

| ফাইল | কী যোগ হলো |
|---|---|
| `blog-card.blade.php` | `loading="lazy" decoding="async"` |
| `footer.blade.php` (Visa) | `loading="lazy" decoding="async"` |
| `footer.blade.php` (Mastercard) | `loading="lazy" decoding="async"` |

**Claude-এর যাচাই:** ✅ শুধু attribute যোগ, ভেতরের কোড/indentation/Blade
syntax অপরিবর্তিত। `blog-card` একটি Swiper slider-এর ভেতরে
(`main_file.blade.php:353`), কিন্তু সেকশনটি হোমপেজের অনেক নিচে — LCP element
নয়, তাই `lazy` সঠিক।

---

## ⚠️ যা এখনো বাকি রিপোর্টে

`.ai/reports/img-missing-dimensions.md` তৈরি হয়নি।

**৩৬টি `<img>` এ `width`/`height` attribute নেই** (মোট ৪৫-এর মধ্যে; মাত্র ৯টিতে
আছে)। BULK মডেল ভুলবশত "২টি" বলেছিল।

এই তালিকা CLS ঠিক করার জন্য দরকার — Claude পরে সিদ্ধান্ত নেবে কোন ছবিতে
কী dimension বসবে। **BULK মডেল নিজে কোনো dimension যোগ করবে না।**
