import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './themes/*/views/**/*.blade.php',
        './themes/*/assets/js/**/*.js',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
            },
            colors: {
                primary: 'var(--primary-color)',
                orange: {
                    500: 'var(--primary-color)',
                },
            },
        },
    },

    safelist: [
        'relative', 'dropdown', 'has-item', 'pe-4', 'flex', 'items-center',
        'block', 'px-4', 'py-2', 'text-gray-700', 'hover:bg-gray-100',
        'hover:text-orange-500', 'bg-white', 'shadow-lg', 'rounded-md',
        'py-1', 'z-50', 'absolute', 'left-0', 'mt-2', 'w-40',
        '-translate-x-full', 'rotate-180', 'border-transparent', 'hidden',
        { pattern: /col-(md|lg|xl|xxl)-[0-9]+/ },
    ],

    plugins: [forms],
};
