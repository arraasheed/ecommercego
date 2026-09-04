#!/usr/bin/env node
/**
 * scan-inline-scripts.cjs — CLAUDE-4 helper
 *
 * Rebuilds .ai/reports/script-inventory.md by actually parsing every blade file
 * for inline <script> blocks and classifying them by what Turbo Drive will break.
 *
 * Classification (Day 2 migration recipe):
 *   A REINIT-NEEDED  — initialises a widget bound to DOM that Turbo will replace
 *                      (DataTable, select2, summernote, flatpickr, Swiper, ApexCharts,
 *                       dropzone, .modal, document.ready with DOM queries)
 *   B ONCE-ONLY      — global/document-level setup that must NOT run twice
 *                      (ajaxSetup, $(document).on(...) delegation, window.X = ...,
 *                       addEventListener on window/document)
 *   C INLINE-DATA    — only assigns server-rendered values to variables
 *   D THIRD-PARTY    — external service snippet (GTM, FB pixel, tawk, recaptcha…)
 *   E UNCLEAR        — did not match any rule confidently
 *
 * Usage:  node .agents/scripts/scan-inline-scripts.cjs
 * Output: .ai/reports/script-inventory.md   (+ machine-readable .json next to it)
 *
 * Read-only on blade files. Safe to re-run.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCAN_DIRS = ['resources/views', 'themes', 'packages/workdo'];
const OUT_MD = path.join(ROOT, '.ai/reports/script-inventory.md');
const OUT_JSON = path.join(ROOT, '.ai/reports/script-inventory.json');

function walk(dir, acc = []) {
    if (!fs.existsSync(dir)) return acc;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'vendor') continue;
            walk(full, acc);
        } else if (entry.name.endsWith('.blade.php')) {
            acc.push(full);
        }
    }
    return acc;
}

// Extract inline <script> blocks (skip ones with a src= attribute — those are file includes)
function extractScripts(source) {
    const blocks = [];
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = re.exec(source)) !== null) {
        const attrs = m[1] || '';
        if (/\bsrc\s*=/i.test(attrs)) continue; // external file, not inline
        const body = m[2] || '';
        if (body.trim() === '') continue;
        const line = source.slice(0, m.index).split('\n').length;
        blocks.push({ line, attrs: attrs.trim(), body, raw: m[0] });
    }
    return blocks;
}

const WIDGETS = [
    ['DataTable', /\.DataTable\s*\(|\bdataTable\s*\(|dataTables/],
    ['select2', /\.select2\s*\(/],
    ['summernote', /\.summernote\s*\(/],
    ['flatpickr', /flatpickr\s*\(|\.flatpickr\b/],
    ['Swiper', /new\s+Swiper\s*\(/],
    ['ApexCharts', /new\s+ApexCharts\s*\(/],
    ['Dropzone', /new\s+Dropzone\s*\(|Dropzone\s*\.\s*autoDiscover|\.dropzone\s*\(/],
    ['Chart.js', /new\s+Chart\s*\(/],
    ['bootstrap modal', /\.modal\s*\(|new\s+bootstrap\.Modal/],
    ['tooltip/popover', /\.tooltip\s*\(|\.popover\s*\(/],
    ['switchButton', /switchButton\s*\(/],
    ['choices.js', /new\s+Choices\s*\(/],
    ['emojionearea', /\.emojioneArea\s*\(/],
    ['jquery.steps', /\.steps\s*\(\s*\{/],
    ['jquery.validate', /\.validate\s*\(\s*\{/],
    ['flipdown', /new\s+FlipDown\s*\(/],
    ['leaflet map', /L\.map\s*\(/],
    ['floating-wpp', /\.floatingWhatsApp\s*\(/],
    ['sortable', /new\s+Sortable\s*\(|\.sortable\s*\(/],
];

const THIRD_PARTY = [
    ['Google Tag Manager / gtag', /googletagmanager|gtag\s*\(|dataLayer\s*\.\s*push/i],
    ['Facebook Pixel', /fbq\s*\(|connect\.facebook\.net/i],
    ['Tawk.to', /Tawk_API|tawk\.to/i],
    ['reCAPTCHA', /grecaptcha|recaptcha/i],
    ['Google Analytics (legacy)', /google-analytics\.com|_gaq/i],
    ['Pusher', /new\s+Pusher\s*\(/],
    ['Stripe.js', /Stripe\s*\(\s*['"]pk_/],
    ['PayPal SDK', /paypal\.Buttons\s*\(/],
    ['Razorpay', /new\s+Razorpay\s*\(/],
];

function classify(body) {
    const reasons = [];
    const widgets = [];

    for (const [name, re] of THIRD_PARTY) {
        if (re.test(body)) return { cls: 'D', widgets: [name], reasons: ['third-party snippet'] };
    }

    for (const [name, re] of WIDGETS) {
        if (re.test(body)) widgets.push(name);
    }

    const hasReady = /\$\s*\(\s*document\s*\)\s*\.\s*ready|\$\s*\(\s*function\s*\(|DOMContentLoaded|\$\s*\(\s*\)\s*\.\s*ready/.test(body);
    const hasDelegation = /\$\s*\(\s*document\s*\)\s*\.\s*on\s*\(|\$\s*\(\s*(?:'|")body(?:'|")\s*\)\s*\.\s*on\s*\(/.test(body);
    const hasAjaxSetup = /ajaxSetup\s*\(/.test(body);
    const hasWindowAssign = /window\.[A-Za-z_$][\w$]*\s*=/.test(body);
    const hasGlobalListener = /(?:window|document)\s*\.\s*addEventListener\s*\(/.test(body);
    const hasFnDecl = /^\s*function\s+[A-Za-z_$]/m.test(body);
    const hasDomQuery = /\$\s*\(\s*['"][.#]|document\.querySelector|getElementById|getElementsBy/.test(body);
    const hasAjaxCall = /\$\s*\.\s*ajax\s*\(|\$\s*\.\s*(?:get|post)\s*\(|fetch\s*\(/.test(body);

    // strip comments then look at what is left
    const code = body
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1')
        .trim();
    const onlyAssignments =
        code.length > 0 &&
        /^(?:(?:var|let|const)\s+[\w$]+\s*=|window\.[\w$]+\s*=|[\w$]+\s*=)/.test(code) &&
        !hasReady && !hasDelegation && widgets.length === 0 && !hasAjaxCall &&
        code.split('\n').filter(l => l.trim()).length <= 12;

    if (widgets.length) reasons.push('initialises ' + widgets.join(', '));
    if (hasReady) reasons.push('document.ready wrapper');
    if (hasDelegation) reasons.push('delegated $(document).on()');
    if (hasAjaxSetup) reasons.push('$.ajaxSetup()');
    if (hasWindowAssign) reasons.push('assigns window.*');
    if (hasGlobalListener) reasons.push('window/document addEventListener');
    if (hasFnDecl) reasons.push('declares global function');

    // A wins over B when a widget is bound: after Turbo swap the widget is gone
    if (widgets.length > 0) {
        const mixed = hasDelegation || hasAjaxSetup || hasGlobalListener;
        return { cls: 'A', widgets, reasons, mixed };
    }
    if (hasReady && hasDomQuery) {
        return { cls: 'A', widgets: ['(DOM-bound ready block)'], reasons, mixed: hasDelegation };
    }
    if (hasDelegation || hasAjaxSetup || hasGlobalListener || (hasWindowAssign && hasFnDecl)) {
        return { cls: 'B', widgets, reasons };
    }
    if (onlyAssignments) {
        return { cls: 'C', widgets, reasons: reasons.length ? reasons : ['only variable assignment'] };
    }
    if (hasFnDecl && !hasReady) {
        return { cls: 'B', widgets, reasons: reasons.concat('function declarations only') };
    }
    return { cls: 'E', widgets, reasons: reasons.length ? reasons : ['no rule matched'] };
}

const files = SCAN_DIRS.flatMap(d => walk(path.join(ROOT, d)));
const rows = [];

for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    let src;
    try { src = fs.readFileSync(abs, 'utf8'); } catch { continue; }
    if (!/<script/i.test(src)) continue;
    for (const b of extractScripts(src)) {
        const c = classify(b.body);
        rows.push({
            file: rel,
            line: b.line,
            lines: b.body.split('\n').length,
            cls: c.cls,
            widgets: c.widgets,
            reasons: c.reasons,
            mixed: !!c.mixed,
            stackPush: /@push\s*\(\s*['"]script/.test(src.slice(Math.max(0, src.indexOf(b.raw) - 400), src.indexOf(b.raw))),
        });
    }
}

rows.sort((a, b) => (a.cls + a.file).localeCompare(b.cls + b.file) || a.line - b.line);

const byCls = cls => rows.filter(r => r.cls === cls);
const filesOf = cls => new Set(byCls(cls).map(r => r.file)).size;
const CLS_NAME = {
    A: 'REINIT-NEEDED',
    B: 'ONCE-ONLY',
    C: 'INLINE-DATA',
    D: 'THIRD-PARTY',
    E: 'UNCLEAR',
};

const esc = s => String(s).replace(/\|/g, '\\|');
let md = '';
md += '# Inline Script Inventory (rebuilt by CLAUDE-4)\n\n';
md += '> Generated by `node .agents/scripts/scan-inline-scripts.cjs`. **Do not hand-edit** — re-run instead.\n';
md += '> Replaces the GEMINI-3 report, which listed only 2-3 sample rows per class and had 9 of 10\n';
md += '> line references wrong (see `.ai/reports/gemini3-verification.md`).\n\n';
md += '`<script src="...">` tags are excluded: only inline blocks are listed, because those are the\n';
md += 'ones Turbo Drive stops re-executing after a page swap.\n\n';
md += '---\n\n## 1. Summary\n\n';
md += '| Class | Meaning | Files | Script blocks |\n|---|---|---|---|\n';
for (const cls of ['A', 'B', 'C', 'D', 'E']) {
    md += `| ${cls} ${CLS_NAME[cls]} | ${
        { A: 'must re-init on `turbo:load`', B: 'must run once only', C: 'server data → JS variable', D: 'external service', E: 'needs a human decision' }[cls]
    } | ${filesOf(cls)} | ${byCls(cls).length} |\n`;
}
md += `| **total** | | **${new Set(rows.map(r => r.file)).size}** | **${rows.length}** |\n\n`;

const widgetCount = {};
for (const r of rows) for (const w of r.widgets) widgetCount[w] = (widgetCount[w] || 0) + 1;
md += '### Widgets found (drives the Day 2 re-init list)\n\n| Widget | Blocks |\n|---|---|\n';
Object.entries(widgetCount).sort((a, b) => b[1] - a[1]).forEach(([w, n]) => { md += `| ${esc(w)} | ${n} |\n`; });
md += '\n---\n\n';

const mixed = rows.filter(r => r.mixed);
md += `## 2. Highest risk first — mixed A + B (${mixed.length} blocks)\n\n`;
md += 'These blocks initialise a widget **and** register a global/delegated handler in the same\n';
md += '`<script>`. Wrapping the whole thing in `turbo:load` duplicates the handler; leaving it alone\n';
md += 'loses the widget. They must be split.\n\n';
md += '| File | Line | Widget(s) | Also does |\n|---|---|---|---|\n';
for (const r of mixed) {
    md += `| \`${r.file}\` | ${r.line} | ${esc(r.widgets.join(', '))} | ${esc(r.reasons.filter(x => !x.startsWith('initialises')).join('; '))} |\n`;
}
md += '\n---\n\n';

for (const cls of ['A', 'B', 'C', 'D', 'E']) {
    const list = byCls(cls);
    md += `## ${{ A: 3, B: 4, C: 5, D: 6, E: 7 }[cls]}. ${cls} — ${CLS_NAME[cls]} (${list.length} blocks, ${filesOf(cls)} files)\n\n`;
    if (cls === 'A') md += 'Recipe: wrap body in `document.addEventListener("turbo:load", function(){ ... })` and destroy the widget on `turbo:before-cache`.\n\n';
    if (cls === 'B') md += 'Recipe: **leave as-is** or move to `resources/js/turbo-bootstrap.js`. Wrapping these in `turbo:load` duplicates handlers on every navigation.\n\n';
    if (cls === 'C') md += 'Recipe: no change needed. Inline data is re-parsed with the new document body.\n\n';
    if (cls === 'D') md += 'Recipe: leave as-is; most SDKs guard against double-init. Page-view events may need a manual `turbo:load` ping.\n\n';
    if (cls === 'E') md += 'Recipe: read by hand before touching.\n\n';
    md += '| File | Line | Block lines | What it does |\n|---|---|---|---|\n';
    for (const r of list) {
        md += `| \`${r.file}\` | ${r.line} | ${r.lines} | ${esc(r.reasons.join('; '))} |\n`;
    }
    md += '\n';
}

md += '---\n\n## 8. How the classification works\n\n';
md += 'Regex rules in `.agents/scripts/scan-inline-scripts.cjs`. Precedence, top wins:\n\n';
md += '1. **D** — a third-party signature (gtag, fbq, Tawk_API, grecaptcha, Pusher, Stripe, PayPal, Razorpay)\n';
md += '2. **A** — a widget constructor (`new Swiper`, `.DataTable(`, `.select2(`, `.summernote(`,\n';
md += '   `flatpickr(`, `new ApexCharts`, `new Dropzone`, `.modal(`, `switchButton(`, `.steps(`, …)\n';
md += '3. **A** — a `document.ready` / `DOMContentLoaded` wrapper that also queries the DOM by class or id\n';
md += '4. **B** — `$.ajaxSetup(`, `$(document).on(`, `window`/`document` `addEventListener`, or\n';
md += '   `window.X = ` together with a function declaration\n';
md += '5. **C** — only variable assignments, ≤12 lines, no DOM work and no AJAX\n';
md += '6. **B** — function declarations with no ready wrapper (hoisted helpers)\n';
md += '7. **E** — anything left\n\n';
md += '`mixed` is set when an A block also contains delegation, `ajaxSetup`, or a global listener.\n';

fs.writeFileSync(OUT_MD, md, 'utf8');
fs.writeFileSync(OUT_JSON, JSON.stringify({ generated: new Date().toISOString(), total: rows.length, rows }, null, 1), 'utf8');

console.log('blocks:', rows.length, '| files:', new Set(rows.map(r => r.file)).size);
for (const cls of ['A', 'B', 'C', 'D', 'E']) console.log(' ', cls, CLS_NAME[cls], '->', byCls(cls).length, 'blocks /', filesOf(cls), 'files');
console.log('mixed A+B:', mixed.length);
console.log('written:', path.relative(ROOT, OUT_MD), '+', path.relative(ROOT, OUT_JSON));
