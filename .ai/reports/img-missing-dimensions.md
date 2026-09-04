# Images Missing `width`/`height` Attributes — BULK-1

**Task:** BULK-1 · **Recipe Rule ৩:** if img has no `width` or `height` attribute → do NOT guess, list here; Claude will decide.
**Date:** 2026-09-04
**মোট:** ২৭টি img-এ `width`/`height` attribute নেই।

| ফাইল | লাইন | img src (সংক্ষেপে) |
|---|---|---|
| `themes/stylique/views/main_file.blade.php` | 315 | `get_file($review->avatar)` |
| `themes/stylique/views/front_end/partison/header.blade.php` | 11 | `get_file($themeSettings['header_logo'])` (header logo) |
| `resources/views/front_end/jQueryRoute.blade.php` | 22 | `get_file($themeSettings['header_logo'])` (mobile logo) |
| `resources/views/front_end/jQueryRoute.blade.php` | 73 | `$faviconUrl ?? get_file(header_favicon)` (PWA icon) |
| `resources/views/front_end/common/offer.blade.php` | 15 | `get_file($item->cover_image_path)` |
| `resources/views/front_end/common/wish_list.blade.php` | 19 | `get_file($wishlist->ProductData->cover_image_path)` |
| `resources/views/front_end/common/checkout/checkout_form.blade.php` | 650 | `src=""` (`payment_img_path`, JS-এ ভরা হয়) |
| `resources/views/front_end/pages/about.blade.php` | 35 | `get_file($themeSettings['abouts_us_full_image'])` |
| `resources/views/front_end/pages/about.blade.php` | 41 | `get_file($themeSettings['abouts_us_full_image_second'])` |
| `resources/views/front_end/pages/about.blade.php` | 95 | `asset($abouts_counter->image)` (team avatar) |
| `resources/views/front_end/pages/article.blade.php` | 32 | `asset('avatar.png')` (author avatar) |
| `resources/views/front_end/pages/article.blade.php` | 53 | `get_file($blog->cover_image_path)` (featured) |
| `resources/views/front_end/pages/article.blade.php` | 126 | `get_file($blog->cover_image_path)` (card) |
| `resources/views/front_end/pages/auction_order_detail.blade.php` | 288 | `asset(...social_icon...)` (social icon, 16px area) |
| `resources/views/front_end/pages/cart-list-sidebar.blade.php` | 18 | `get_file($product->image)` |
| `resources/views/front_end/pages/cart-list.blade.php` | 41 | `get_file($product->image)` |
| `resources/views/front_end/pages/checkout-cart-list.blade.php` | 13 | `get_file($product->image)` |
| `resources/views/front_end/pages/collection-list.blade.php` | 31 | `get_file($category->image_path)` |
| `resources/views/front_end/pages/collection-list.blade.php` | 62 | `get_file($category->image_path)` |
| `resources/views/front_end/pages/order-status.blade.php` | 26 | `get_file($customer->profile_image ...)` |
| `resources/views/front_end/pages/order_list_filter.blade.php` | 77 | `get_file($product['image'])` |
| `resources/views/front_end/pages/product-detail.blade.php` | 23 | `get_file($item->image_path)` (main gallery) |
| `resources/views/front_end/pages/product-detail.blade.php` | 31 | `get_file($product->cover_image_path)` (main gallery) |
| `resources/views/front_end/pages/product-detail.blade.php` | 53 | `get_file($item->image_path)` (thumbnail) |
| `resources/views/front_end/pages/product-detail.blade.php` | 61 | `get_file($product->cover_image_path)` (thumbnail) |
| `resources/views/front_end/sections/order_detail.blade.php` | 372 | `asset(...social_icon...)` (social icon) |
| `resources/views/front_end/sections/payment_list.blade.php` | 17 | `asset($payment_data->image)` (payment icon) |

> **নোট — CSS ক্লাসে বড়ো ধারনা আছে:** product/avatar/payment img-গুলো প্রায় সবই `h-X w-X` / `object-contain` ক্লাস ব্যবহার করে, তাই CLS ঝুঁকি কম। তবুও সঠিক dimension না জেনে যোগ না করাই নিরাপদ — Claude/CLAUDE-4 টেস্টে সিদ্ধান্ত নেবেন।
> `id="blah"` ওয়ালা আপলোড-প্রিভিউ img-গুলোতে `width="20%"` আছে (refund_order, reply_support_ticket, support_ticket_edit, add_tickets) → তালিকায় নেই।