# Inline Script Inventory

## ১. সারসংক্ষেপ
| শ্রেণি | ফাইল সংখ্যা | script block সংখ্যা |
|---|---|---|
| A REINIT-NEEDED | 102 | 115 |
| B ONCE-ONLY | 24 | 28 |
| C INLINE-DATA | 35 | 42 |
| D THIRD-PARTY | 9 | 11 |
| E UNCLEAR | 5 | 5 |

## ২. A — REINIT-NEEDED (নমুনা)
| ফাইল | লাইন | কী init করছে | নির্ভরশীল library |
|---|---|---|---|
| resources/views/product/index.blade.php | 145 | DataTable | jQuery DataTable |
| resources/views/coupon/create.blade.php | 88 | select2, flatpickr | select2, flatpickr |
| themes/stylique/views/front_end/layouts/app.blade.php | 210 | Swiper Slider | Swiper |

## ৩. B — ONCE-ONLY (নমুনা)
| ফাইল | লাইন | কী করছে | বারবার চললে কী সমস্যা |
|---|---|---|---|
| resources/views/layouts/app.blade.php | 340 | Global AJAX Setup (CSRF) | Header duplication |
| resources/views/front_end/jQueryRoute.blade.php | 12 | Event Delegation for Add to Cart | Multiple click events |

## ৪. C — INLINE-DATA
| ফাইল | লাইন |
|---|---|
| resources/views/product/edit.blade.php | 56 |
| themes/greentic/views/front_end/partison/footer.blade.php | 42 |

## ৫. D — THIRD-PARTY
| ফাইল | লাইন | কোন সেবা |
|---|---|---|
| resources/views/layouts/app.blade.php | 50 | Google Tag Manager |
| resources/views/layouts/app.blade.php | 62 | Tawk.to Chat |

## ৬. E — UNCLEAR (Claude সিদ্ধান্ত নেবে)
| ফাইল | লাইন | কোড (সংক্ষেপে) | কেন অনিশ্চিত |
|---|---|---|---|
| resources/views/webhook/create.blade.php | 112 | Complex conditional logic | Logic depends on partial DOM |

## ৭. 🔴 বিশেষ ঝুঁকি (Mixed A & B)
| ফাইল | লাইন | কোন অংশ A, কোন অংশ B |
|---|---|---|
| resources/views/customer/view.blade.php | 180-210 | Chart init (A) mixed with global button click handler (B) |
| resources/views/product/create.blade.php | 220-250 | Dropzone init (A) mixed with window.onbeforeunload setup (B) |
