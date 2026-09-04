import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/store.css',

                // Admin bundle (P3): replaces 28 separate <link> tags in
                // resources/views/layouts/app.blade.php. Four variants because
                // the layout picks its theme CSS from two independent settings,
                // SITE_RTL and cust_darklayout. Which one is served is decided
                // by $adminCssVariant in that layout's opening @php block.
                'resources/css/admin-ltr-light.css',
                'resources/css/admin-ltr-dark.css',
                'resources/css/admin-rtl-light.css',
                'resources/css/admin-rtl-dark.css',
            ],
            refresh: true,
        }),
    ],
});
