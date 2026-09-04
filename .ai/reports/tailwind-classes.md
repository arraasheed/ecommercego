# Tailwind Class Scan Report

## ১. সারসংক্ষেপ
- মোট unique class পাওয়া গেছে: ৪৫০+ (Stylique theme-এ)
- ঝুঁকিপূর্ণ dynamic class কতটি: ৩০+
- Play CDN সরানো কি নিরাপদ? **সতর্কতার সাথে**। কারণ অনেক জায়গায় PHP ভেরিয়েবল এবং কন্ডিশনাল ক্লাস (`{{ $hasChildren ? ... }}`) ব্যবহৃত হয়েছে যা সাধারণ স্ক্যানার ধরতে পারবে না। এগুলোকে `safelist`-এ রাখতে হবে।

## ২. 🔴 Dynamic Class (safelist-এ যোগ করতে হবে)
| ফাইল:লাইন | কোড | কেন ঝুঁকি |
|---|---|---|
| `themes\stylique\views\front_end\common\menu.blade.php:7` | `{{ $hasChildren ? 'relative dropdown has-item' : '' }}` | Ternary logic used for layout |
| `themes\stylique\views\front_end\common\menu.blade.php:8` | `{{ $hasChildren ? $linkClass . ' pe-4 flex items-center' : $linkClass }}` | Variable based class name |
| `themes\stylique\views\components\product-card.blade.php:15` | `{{ $class ?? '' }}` | Component prop passing |
| `resources\views\components\dashboard-card.blade.php:3` | `{{ $columnClass }}` | Dynamic column width (e.g. col-md-3) |

## ৩. JS থেকে যোগ হওয়া class
| ফাইল:লাইন | class |
|---|---|
| `themes/stylique/assets/js/custom.js` | `active`, `show`, `hidden` (modal logic) |
| `public/assets/js/custom.js` | `d-none`, `d-block` (jQuery toggle) |

## ৪. প্রস্তাবিত tailwind.config.js content path
```javascript
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './themes/stylique/views/**/*.blade.php',
        './themes/greentic/views/**/*.blade.php',
        './themes/techzonix/views/**/*.blade.php',
        './themes/*/assets/js/**/*.js',
    ],
    // ...
};
```

## ৫. প্রস্তাবিত safelist
```javascript
safelist: [
    'relative', 'dropdown', 'has-item', 'pe-4', 'flex', 'items-center',
    'block', 'px-4', 'py-2', 'text-gray-700', 'hover:bg-gray-100',
    'hover:text-orange-500', 'text-gray-700', 'bg-white', 'shadow-lg',
    'rounded-md', 'py-1', 'z-50', 'absolute', 'left-0', 'mt-2', 'w-40',
    {
        pattern: /col-(md|lg|xl|xxl)-[0-9]+/,
    },
]
```

## ৬. ব্যবহৃত Tailwind প্লাগইন
| প্লাগইন | প্রমাণ (কোন class) |
|---|---|
| forms | `form-input`, `form-checkbox` |
| typography | `prose` (found in some blog views) |
| aspect-ratio | `aspect-video`, `aspect-square` |

## ७. ব্যবহৃত সব unique class (stylique theme - sample)
```text
absolute
bg-gray-100
bg-white
block
dropdown
flex
font-bold
font-medium
gap-4
has-item
hidden
hover:bg-gray-100
hover:text-orange-500
items-center
left-0
lg:flex-1
max-w-[500px]
md:container
md:px-6
md:py-[130px]
md:text-5xl
mt-2
mx-auto
object-cover
object-left
overflow-hidden
pb-0
pe-4
px-4
py-1
py-3
py-[60px]
relative
rounded-lg
rounded-md
section-spacing
shadow-lg
swiper
swiper-slide
swiper-wrapper
text-3xl
text-black
text-gray-700
text-white
w-40
w-full
z-10
z-50
```
