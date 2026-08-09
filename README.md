# Grevity — marketing site

Single-page, fully responsive landing page for Grevity (billing, inventory and
production software for manufacturers, traders and retailers in India).

Static HTML/CSS/JS. **No build step, no framework, no npm install.** Upload the
folder to any host (Vercel, Netlify, Hostinger, cPanel) and it works.

```
index.html            all sections (A–K)
assets/css/style.css  design system: tokens, light/dark, layout, animation
assets/js/main.js     behaviour + CONFIG block (see below)
assets/js/i18n-gu.js  Gujarati copy deck
assets/img/           logo (light + dark SVG), app icon, OG image
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
offline Pendrive Edition at **₹7,000 for the first year, then ₹5,000 a year**.
Each number lives in an attribute *and* in the visible text beside it — change
both: `data-price="7000"` on `.plan__amt`, `data-renew="5000"` on the
`.plan__renew strong`. The same two figures are also written into the section
intro (`pricing.sub`) and FAQ answer 8, in English and Gujarati.

**5. Address, email, legal links** — footer in `index.html`, plus the
`LocalBusiness` block in the JSON-LD in `<head>`. Privacy / Terms / Refund
links are `#` — point them at real pages.

**6. Domain** — the site assumes `https://grevity.app`. If it differs, update
`canonical`, the `og:`/`twitter:` URLs and JSON-LD in `index.html`, plus
`sitemap.xml` and `robots.txt`.

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

**Icons** are Material Symbols Rounded, loaded as a subset in `<head>`. If you
add an icon, add its name to the `icon_names=` list **in alphabetical order** —
Google returns HTTP 400 for an out-of-order or misspelled name and then *no*
icons load. (There is a JS guard that hides icon names rather than printing them
if that happens, but fix the list.)

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

Meta description and keywords target *billing software Rajkot*, *inventory
management software Gujarat*, *tax billing software for manufacturers*. Includes
Open Graph + Twitter cards (`assets/img/og-image.png`, 1200×630), canonical URL,
`sitemap.xml`, `robots.txt`, and JSON-LD for `SoftwareApplication`,
`LocalBusiness` (Rajkot) and `FAQPage`.

To regenerate the OG PNG after editing `og-image.svg`:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --window-size=1200,630 \
  --screenshot=assets/img/og-image.png assets/img/og-image.svg
```
