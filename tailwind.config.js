import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/**
 * Root config - drives resources/css/app.css (admin / Breeze scaffolding).
 *
 * The storefront bundle deliberately uses a separate config:
 * tailwind.store.config.js, referenced from resources/css/store.css via @config.
 * Reason: the storefront must NOT load the `forms` plugin, because the Tailwind
 * Play CDN it replaces never did. Keeping the configs separate means an admin
 * change here cannot alter storefront rendering.
 */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
        },
    },

    plugins: [forms],
};
