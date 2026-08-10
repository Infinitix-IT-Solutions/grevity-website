# Grevity — marketing site

Single-page, fully responsive landing page for Grevity (billing, inventory and
production software for manufacturers, traders and retailers in India).

Static HTML/CSS/JS. **No build step, no framework, no npm install.** Upload the
folder to any host (Vercel, Netlify, Hostinger, cPanel) and it works.

```
index.html            all sections (A–K)
assets/css/style.css  @font-face block, then design system: tokens, light/dark, layout, animation
assets/js/main.js     behaviour + CONFIG block (see below)
assets/js/i18n-gu.js  Gujarati copy deck
assets/img/           logo (light + dark SVG), app icon, OG image
assets/fonts/         self-hosted woff2 (see Fonts below)
sitemap.xml robots.txt site.webmanifest
```

## Run locally

```bash
python3 -m http.server 8080     # then open http://localhost:8080
```

Open with a server, not by double-clicking the file — assets use absolute paths (`/assets/...`).

Handy URLs while reviewing: `?lang=gu`, `?theme=dark`, or both.

---

## ⚠️ Before you go live — replace these placeholders

**1. Phone, WhatsApp and form endpoint** — top of `assets/js/main.js`:

```js
var CONFIG = {
  phone:        '+919426526594',   // tel: link
  phoneDisplay: '+91 94265 26594', // shown on screen
  whatsapp:     '919426526594',    // wa.me number, digits only
  waMessage:    'Hello Grevity! ...',
  formEndpoint: ''                 // Formspree URL / your webhook
};
```

**Getting demo enquiries by email** — the form posts to **Web3Forms**, which
needs no backend. Three steps:

1. Go to <https://web3forms.com>, enter the address you want enquiries sent to
   (e.g. `hello@grevity.app`) and they email you an **access key**.
2. Paste it into `formAccessKey` in the CONFIG block above.
3. Submit the form once yourself to confirm the mail arrives (check spam on the
   first one, then mark it "not spam").

Free tier is 250 submissions/month. The email arrives with the enquirer's name,
business, city, phone, business type, which language they read the site in, and
a timestamp.

**Until that key is filled in**, the form still works: it validates, then opens
WhatsApp with every field pre-filled so the enquiry reaches you anyway. The same
fallback fires if Web3Forms is ever down or rejects the key — a lead is never
silently lost.

**Spam protection** is two layers:

1. A **honeypot** field, invisible to people. If it comes back filled, the
   enquiry is dropped silently.
2. **hCaptcha** ("I am human" tick box), via Web3Forms' shared sitekey — no
   hCaptcha account needed. Loaded by `https://web3forms.com/client/script.js`,
   rendered by `<div class="h-captcha" data-captcha="true">` in the form. The
   token rides along as `h-captcha-response`, and the widget is reset after each
   submit because a solved token is single-use.

The widget follows the page theme (a one-line inline script sets `data-theme`
before it renders) and is scaled down under 620px so it fits the card on phones.

⚠️ **Check that captcha is enforced in your Web3Forms dashboard.** The tick box
stops bots driving the visible form, but a script can still POST straight to the
API. Only the server-side setting makes the token mandatory.

To use a different provider instead, point `formEndpoint` at your own webhook
and clear `formAccessKey`; the form POSTs the same JSON either way.

**2. Hero counters** — `index.html`, the `.stats` list. `500+ invoices` and
`₹2Cr+ transactions` are illustrative. Put your real, verifiable numbers there.

**3. Testimonials** — `index.html`, section `#voices`. All five quotes and names
are **fictional placeholders** so you can see the layout. Replace every one with
a real customer quote you have permission to publish, then delete the warning
comment above the section. Do not launch with these as-is.

**4. Price** — `index.html`, section `#pricing`. Grevity sells one thing: the
offline Pendrive Edition, listed at **₹8,999** and sold at **₹4,999 for the
first year, then ₹2,999 a year**. Each number lives in an attribute *and* in the
visible text beside it — change both:

- `data-mrp="8999"` on `.plan__mrp` (the struck-through list price)
- `data-price="4999"` on `.plan__amt`
- `data-renew="2999"` on the `.plan__renew strong`

The discount line (`pricing.off`) is hand-written — recalculate "Save ₹4,000 ·
44% off" yourself if you change the numbers. The figures also appear in the
section intro (`pricing.sub`) and FAQ answer 8, in English and Gujarati, and in
the two `Offer` entries in the JSON-LD.

**5. Address, email, legal links** — footer in `index.html`, plus the
`LocalBusiness` block in the JSON-LD in `<head>`. Privacy / Terms / Refund
links are `#` — point them at real pages.

**6. Domain** — the site assumes **`https://www.grevity.app`** (with `www`).
That is not a style choice: the host currently answers `https://grevity.app/`
with a `308` to the `www` host, so `www` is the real canonical. Every absolute
URL — `canonical`, `og:`/`twitter:`, the JSON-LD `@id`s and `url`s,
`sitemap.xml` and `robots.txt` — must name the host that serves a `200`, or you
are declaring a canonical that redirects.

If you would rather run on the bare apex, flip the primary domain in your host's
dashboard **first** (so `www` → apex instead), confirm the redirect direction
with `curl -I https://www.grevity.app/`, then rewrite the URLs to match. Change
one without the other and canonical, sitemap and server disagree.

---

## Editing content

**English** lives directly in `index.html`. **Gujarati** lives in
`assets/js/i18n-gu.js`, keyed by the `data-i18n` attribute on each element. Add
or edit English in the HTML, then add the matching key to the Gujarati file — a
missing key simply falls back to English, it never breaks the page.

**The Gujarat map** in the "Why Rajkot" section is a real state boundary, not a
drawing: Natural Earth 1:10m admin-1 data (**public domain**, free for
commercial use), simplified to 301 points and projected into the SVG viewBox.
City pins sit at their true coordinates. If you move or redraw the outline, the
stroke-draw animation adapts by itself — `main.js` measures the path with
`getTotalLength()` at runtime.

**Logo files** — `grevity-logo-compact.svg` (indigo, for light surfaces) and
`grevity-logo-compact-light.svg` (white, for dark) are both in the navbar and
footer; CSS shows the right one for the active theme. `grevity-icon-180.png` is
the favicon, Apple touch icon and PWA icon. The white logo is also inlined into
`og-image.svg` — re-run the OG command below after changing it.

## Fonts

Fonts are **self-hosted** in `assets/fonts/` — the page makes no request to
`fonts.googleapis.com`. That removes a third-party DNS + TLS handshake and the
CSS-then-font waterfall, both of which hurt LCP.

All three text families are **variable** woff2 (one file per unicode-range
instead of one per weight), and each `@font-face` at the top of `style.css`
carries its `unicode-range`. So the browser only downloads what it renders:

| Visitor | Downloads | Total |
|---|---|---|
| English | `inter-latin`, `jetbrains-mono-latin`, `material-symbols-rounded` | ~84 KB |
| Gujarati | the above + the three `noto-gujarati-*` faces | ~241 KB |

An English visitor never touches the 110 KB Gujarati face. Only `inter-latin`
and the icon font are `<link rel="preload">`ed in `<head>` — preloading the
rest would pull bytes most visitors never render.

**Weight ranges** are Inter `400–800`, JetBrains Mono `500–700`, Noto Sans
Gujarati `400–700`. Gujarati has no 800, so headings clamp to 700 in `gu` —
same as before, Google served the same range.

`₹` (U+20B9) exists **only** in the Noto Sans Gujarati `gujarati` subset, not in
Inter or JetBrains Mono. In English mode Noto is not in the font stack, so the
rupee sign renders from a system font. That has always been true; just don't be
surprised by it when comparing prices across the two languages.

**To re-download** (after changing weights, or to pick up an upstream release),
fetch each family's `css2` URL with a modern browser User-Agent — Google serves
woff2 only to UAs it recognises — then save each `unicode-range` block's woff2
under the matching name in `assets/fonts/` and update the `src`/`unicode-range`
in `style.css`. Families used:

```
Inter:wght@400..800
JetBrains+Mono:wght@500..700
Noto+Sans+Gujarati:wght@400..700
```

**Icons** are Material Symbols Rounded, subset to only the icons this page uses.
The subset woff2 (6 KB) is committed to `assets/fonts/`. To add an icon you must
re-fetch the subset from Google with the icon added to the `icon_names=` list
**in alphabetical order** — an out-of-order or misspelled name returns HTTP 400
and you get *no* font at all. The generating URL is:

```
https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=account_balance_wallet,arrow_forward,backup,call,chat,check_circle,close,dark_mode,description,expand_more,history,inventory_2,light_mode,lock,manage_search,menu,payments,picture_as_pdf,precision_manufacturing,receipt_long,request_quote,savings,settings_suggest,shield_lock,stacked_bar_chart,storefront,table_view,translate,trending_up,usb,verified,warning&display=block
```

(There is a JS guard that hides icon names rather than printing them if the font
fails to load, but fix the list.)

## What's in the page

Sticky nav with scroll progress · hero with animated dashboard, rotating
audience text and stat counters · problem-vs-solution cards · 19 feature cards
with category filter · Why Rajkot with animated map · 4-step timeline · single
one-time price · testimonial marquee · FAQ accordion · demo form · footer. Plus
floating WhatsApp button, sticky mobile call/WhatsApp bar, light/dark mode,
English/Gujarati toggle.

The whole site positions Grevity as **offline-only software on a USB pendrive,
sold once**. There is no cloud edition and no subscription anywhere in the copy,
the FAQ, the pricing or the structured data — keep it that way when editing.

## Brand palette

Colours come from the Grevity product palette and live as CSS custom properties
at the top of `assets/css/style.css` — change them there, not in individual
rules.

- **Brand:** indigo ramp `--brand-50` … `--brand-900`. Primary CTAs are
  `#4f46e5` with `#4338ca` on hover, everywhere: hero, mid-page, footer and the
  sticky mobile bar.
- **Neutrals:** slate. Light `#ffffff` surfaces on `#f8fafc` sections; dark
  `#131a2d` surfaces on `#0b1020`.
- **Accents** (`--teal`, `--sky`, `--violet`, `--warn`, `--ok`, `--danger`) are
  for icons, tags and status only — never a primary button. Feature cards are
  colour-coded by category the way the app tints its modules: Billing & Money
  indigo, Inventory/Production teal, Reports sky, Platform/Security violet.
- **One deliberate exception:** the WhatsApp buttons keep WhatsApp's own green
  (`--wa: #25D366`). Recognition matters more there than palette purity.

Dark mode is toggled by adding `dark` to `<html>` (same convention as the app),
persisted in `localStorage`, with `?theme=dark` for linking straight to it.

**Type:** Inter for headings and body, JetBrains Mono for figures — stat
counters, prices and the invoice/amount details. Gujarati swaps in Noto Sans
Gujarati automatically.

## Accessibility & performance notes

- All animation is `transform`/`opacity` only, and fully disabled under
  `prefers-reduced-motion`.
- Skip link, visible focus rings, labelled form fields with inline errors,
  keyboard-operable nav, filters and accordion.
- No JS libraries. Three network requests beyond the page itself (two font
  stylesheets and their fonts). Mockups are inline SVG, so they theme
  automatically and cost no image bytes.
- `<noscript>`-safe: reveal animations only apply when JS is present, so content
  is never hidden if scripts fail.

## SEO

Meta description targets *billing software Rajkot*, *inventory management
software Gujarat*, *tax billing software for manufacturers*. Includes Open Graph
+ Twitter cards (`assets/img/og-image.jpg`, 1200×630), canonical URL,
`sitemap.xml`, `robots.txt`, and a JSON-LD `@graph` with `WebSite`,
`SoftwareApplication`, a combined `Organization`+`LocalBusiness` node (Rajkot)
and `FAQPage`.

The `Organization` and `LocalBusiness` types share **one** node under
`@id: #organization` rather than sitting in two — two nodes both named "Grevity"
at the same URL reads as two competing entities. `WebSite` and
`SoftwareApplication` both point at that `@id` as their publisher.

`meta keywords` is still in `<head>`; Google has ignored it since 2009. Harmless,
not worth maintaining.

`FAQPage` is kept for machine-readability, but note that since August 2023 Google
only renders FAQ **rich results** for government and health sites — don't expect
the accordions to show in the SERP.

### Known gaps

- **Gujarati is invisible to search.** The language switch is a JS toggle on the
  same URL, so crawlers only ever see the English DOM. `sitemap.xml` used to
  declare `en-IN`/`gu-IN`/`x-default` all pointing at `/`, which is invalid, so
  Google discarded the whole annotation — it has been removed. To actually rank
  in Gujarati, serve it from `/gu/` as real HTML and add `hreflang` pairs to the
  `<head>` of both pages *and* the sitemap.
- **One page, nine target keywords.** `#features` and `#pricing` are anchors, not
  URLs; Google ranks pages. Splitting into per-keyword landing pages is what
  raises the ceiling here.
- **Testimonials in `#voices` are fictional.** Do **not** add `Review` or
  `AggregateRating` schema until they are real — fake review markup earns a
  manual penalty.
- **Privacy / Terms / Refund are `href="#"`.** Trust signals, and you collect
  form data, so you need at minimum a privacy policy.
- **`grevity.in` is a different company.** Despite the rename in this repo's git
  history, that domain is live and serves an unrelated circular-economy business
  ("Building Circular Value From the Ground Up"). So there is nothing to redirect
  and no Change of Address to file — but there *is* a brand collision: searches
  for "Grevity" alone will surface both. Rank for **"Grevity billing software"**
  and **"Grevity Rajkot"** rather than the bare brand name, and get the Google
  Business Profile up so the local pack disambiguates you.

To regenerate the OG image after editing `og-image.svg` — render to PNG, then
compress to JPEG (the PNG is ~370 KB, the JPEG ~92 KB with no visible artifacts;
JPEG is chosen over WebP because LinkedIn and some WhatsApp clients still won't
render WebP link previews):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --window-size=1200,630 \
  --screenshot=/tmp/og.png assets/img/og-image.svg
sips -s format jpeg -s formatOptions 82 /tmp/og.png --out assets/img/og-image.jpg
```
