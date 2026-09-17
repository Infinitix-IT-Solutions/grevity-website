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

**2. Stat counters — removed, deliberately.** A hero strip used to claim `500+
invoices generated` and `₹2Cr+ transactions tracked`. Those were placeholders,
and publishing usage figures before the first sale misleads buyers, so the strip
is gone. The animation engine in `main.js` is still there and still generic, so
bringing it back once you have real totals is markup-only — add a list inside the
`#hero` section:

```html
<div class="shell">
  <ul class="stats reveal">
    <li><span class="stat__num" data-count="500" data-suffix="+">0</span>
        <span class="stat__label">Invoices Generated</span></li>
  </ul>
</div>
```

`data-count` is the target number, with optional `data-prefix` (e.g. `₹`) and
`data-suffix` (`+`, `Cr+`, `%`). It counts up once, when scrolled into view, and
renders the final value immediately under `prefers-reduced-motion`. You will
also need to restore the `.stats` / `.stat__num` / `.stat__label` rules, which
were deleted from `style.css` along with the markup. **Only put back numbers you
can actually evidence.**

**3. Testimonials** — `index.html`, section `#voices`. All five quotes and names
are **fictional placeholders** so you can see the layout. Replace every one with
a real customer quote you have permission to publish, then delete the warning
comment above the section. Do not launch with these as-is.

**4. Price and the launch offer** — `index.html`, section `#pricing`. Grevity
sells one thing: the offline Pendrive Edition, listed at **₹8,999** and sold at
**₹3,999 for the first year as a launch offer, then ₹2,999 a year**. Each number
lives in an attribute *and* in the visible text beside it — change both:

- `data-mrp="8999"` on `.plan__mrp` (the struck-through list price)
- `data-price="3999"` on `.plan__amt`
- `data-renew="2999"` on the `.plan__renew strong`

The discount line (`pricing.off`) is hand-written — recalculate "Save ₹5,000 ·
56% off" yourself if you change the numbers. The figures also appear in the hero
badge (`hero.badge`), the section intro (`pricing.sub`), the urgency line
(`pricing.urgent`) and FAQ answer 8, in English and Gujarati, and in the two
`Offer` entries in the JSON-LD. **Nine places in total — grep for `3999` and
`3,999` after any change.**

*When the launch period ends*, the honest sequence is: set `data-price` and the
visible amount to the real price, drop `.plan__badge--offer` back to a plain
`.plan__badge`, delete the `.plan__urgent` line, and reword `hero.badge`,
`eyebrow.pricing`, `pricing.sub` and `faq.a8` so nothing still says "launch".
The copy currently promises the price returns to ₹8,999 — honour that, or don't
promise it.

**A deliberate omission: there is no countdown timer and no "only N left".**
Scarcity you do not actually enforce is a dark pattern, and under India's
Consumer Protection Act 2019 a false urgency claim is a misleading advertisement.
The copy says "while the launch offer lasts" precisely because that is true
without naming a deadline. If you set a real cut-off — a date, or the first N
customers — put it in `pricing.urgent` and then actually hold the line on it.

**5. Address, email, legal links** — footer in `index.html`, plus the
`Organization` block in the JSON-LD in `<head>`. Privacy / Terms / Refund
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

**The site is national, not city-specific.** It used to lead with Rajkot and a
Gujarat map; both are gone. Positioning is now *built in Gujarat, running across
India* — the `#reach` section carries the local credibility (Gujarati/Hindi/
English support, the trades we build for) without tying the product to one
city. If you add copy, keep it that way: no city in the `<h1>`, the meta
description, the pricing badge or the testimonials.

## The 3D layer

`assets/js/scene.js` builds the pendrive **procedurally in three.js** — no model
file, no textures, no HDR environment. The wordmark decal, the contact shadow
and the reflection environment are all drawn to `<canvas>` at runtime, so the
whole 3D layer costs exactly one dependency and nothing else.

three.js r160 is loaded as an ES module from cdnjs (`<link rel="preconnect">` in
`<head>` warms the connection). Modules defer by default, so it never delays
first paint.

Two stages, both marked up with `data-stage` on a `.stage` element:

| `data-stage` | Where | Behaviour |
|---|---|---|
| `hero` | hero right column | slow float, idle auto-spin, drag or arrow keys to turn |
| `anatomy` | `#drive` section | cap and connector separate as the section scrolls, with HTML hotspot pills projected onto the model each frame |

**It is progressive enhancement, and the fallback is not a blank box.** Every
stage contains a working CSS-3D pendrive (`.fallback3d`). `scene.js` bails out
entirely — leaving that drive visible — under `prefers-reduced-motion`, on
`navigator.connection.saveData`, with no WebGL, or if the CDN import fails. The
CSS drive only fades out once the first WebGL frame has actually rendered, which
is what adds `.is-live` to the stage.

Both stages pause when scrolled out of view (`IntersectionObserver`) and when the
tab is hidden. The theme toggle in `main.js` fires a `grevity:theme` event;
`scene.js` listens and rebuilds the environment map and shell colours, because
the scene is lit for one ground or the other.

Two gotchas if you move things around: the `.stage` element must have a real
height (the renderer sizes itself from `host.clientHeight`, and an auto-height
parent collapses the canvas to its 150px intrinsic default — that is why
`.drive__stage .stage { height: 100% }` exists), and the hotspot anchors in
`buildDrive()` deliberately sit *clear* of the model, since a pill laid over the
drive hides the thing it is labelling.

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
https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=account_balance_wallet,arrow_forward,backup,bolt,call,chat,check_circle,close,credit_card_off,dark_mode,description,dns,drag_pan,expand_more,history,inventory_2,key,light_mode,lock,manage_search,menu,payments,picture_as_pdf,precision_manufacturing,receipt_long,request_quote,savings,settings_suggest,shield_lock,stacked_bar_chart,storefront,table_view,translate,trending_up,usb,verified,wifi_off&display=block
```

(There is a JS guard that hides icon names rather than printing them if the font
fails to load, but fix the list. An icon that is *not* in the subset renders as
its literal ligature name — "wifi_off" — which is how you will notice.)

## What's in the page

Glass nav with scroll progress · hero with the 3D pendrive and rotating audience
text · offline-promise ticker · problem-vs-solution cards ·
**the pendrive section** with the exploding 3D drive and projected hotspots ·
19 features in a filterable bento grid · 4-step timeline · single one-time
price · languages/trades reach band · testimonial marquee · FAQ accordion ·
demo form · footer. Plus floating WhatsApp button, sticky mobile call/WhatsApp
bar, light/dark mode, English/Gujarati toggle.

The whole site positions Grevity as **offline-only software on a USB pendrive,
sold once**. There is no cloud edition and no subscription anywhere in the copy,
the FAQ, the pricing or the structured data — keep it that way when editing.

## Brand palette

Colours come from the Grevity product palette and live as CSS custom properties
at the top of `assets/css/style.css` — change them there, not in individual
rules.

- **Brand:** indigo ramp `--brand-50` … `--brand-900`, plus a three-stop
  signature gradient — `--g1` indigo `#6366f1`, `--g2` violet `#8b5cf6`, `--g3`
  cyan `#06b6d4`, composed as `--grad`. Every gradient on the page (primary
  buttons, the active filter chip, the pricing card's border, avatars, the
  scroll progress bar, `.grad` headline text) uses that one token, so the whole
  site reads as a single light source. Don't hand-roll new gradients.
- **Neutrals:** slate. Light `#ffffff` surfaces on `#f7f8fc` sections; dark
  `#111726` surfaces on `#070a14` — the dark ground is deliberately near-black
  so the 3D stages read as lit objects rather than flat art.
- **Glass:** `--glass` / `--glass-border` / `--glass-blur` are one set, shared by
  the nav, the hero float cards, the stat strip and the 3D hotspot pills. Change
  them once and every floating panel follows.
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
- Two third-party scripts: **Google Analytics 4** (`gtag.js`, property
  `G-G9C2ZVK8GZ`, at the top of `<head>`, `async` so it never blocks
  rendering) and **three.js**. three.js is loaded *after* first paint, only when
  the visitor can actually use it (WebGL, motion allowed, not on Save-Data).
  `main.js` never waits for it. Everything else — fonts, icons, artwork — is
  self-hosted or inline SVG, so it themes automatically and costs no image
  bytes.
- The 3D stages stop rendering when off-screen or when the tab is hidden, and
  the device pixel ratio is capped at 2, so an idle tab is not burning a GPU.
- `<noscript>`-safe: reveal animations only apply when JS is present, so content
  is never hidden if scripts fail.

## Analytics

Google Analytics 4, property **`G-G9C2ZVK8GZ`**. The tag is at the top of
`<head>`; the custom events are sent by the `track()` helper near the top of
`main.js`, which does nothing if GA is blocked, so an ad blocker can never break
the form.

| Event | Fires when | Parameters |
|---|---|---|
| `generate_lead` | Demo form **successfully** delivered to Web3Forms | `method` (`demo_form`, or `whatsapp_handoff` if no form key is set), `business_type` (`manufacturer` / `trader` / `retailer` / `other`), `page_language` (`en` / `gu`) |
| `demo_form_error` | Web3Forms rejects or can't be reached, and the visitor is sent to WhatsApp instead | `error_reason` (first 100 chars), `fallback` |
| `whatsapp_click` | Any WhatsApp link is clicked | `link_location` |
| `phone_click` | Any `tel:` link is clicked | `link_location` |

`link_location` comes from a `data-track` attribute on the link:
`floating_button`, `mobile_bar`, `demo_section`, `footer`. The click listener is
delegated, so a new call or WhatsApp link is tracked automatically — give it a
`data-track` too, or it reports as `untagged`.

**No personal data is ever sent.** Name, business name, phone and city stay out
of every event. GA's terms forbid personal data and a breach can get the
property deleted. Keep it that way if you add parameters.

**One-time setup in GA4** (the code can't do this for you):

1. **Admin → Events → mark `generate_lead` as a key event.** That makes it a
   conversion. Mark `generate_lead`, **not** GA's automatic `form_submit`:
   enhanced measurement fires `form_submit` on every submit attempt, including
   ones that fail.
2. **Admin → Custom definitions → create event-scoped custom dimensions** for
   `link_location`, `business_type`, `method` and `error_reason`. Until you do,
   the events are counted but their parameters don't appear in reports. This
   isn't retroactive, so do it before launch.
3. **Test with `?ga_debug=1`** on the URL (e.g. `https://www.grevity.app/?ga_debug=1`).
   Events then show live in **Admin → DebugView**.

Watch `demo_form_error`. If it ever climbs, the Web3Forms key or hCaptcha has
broken and enquiries are going to WhatsApp instead of your inbox.

GA's enhanced measurement also sends its own `click` (outbound links),
`scroll` and `form_start` events. That's expected and doesn't conflict with the
custom events above; the custom ones add the button location, and also cover
phone links, which enhanced measurement ignores.

## SEO

**Keyword strategy — read this before rewriting any heading.** Dropping Rajkot
also dropped the easiest keywords this site had. "Billing software Rajkot" was
winnable on a new domain; "billing software India" is not — that SERP belongs to
Vyapar, TallyPrime, Marg and Busy, all with a decade of domain authority. So the
target is **not** the generic head term. It is the niche the product genuinely
owns and the incumbents cannot claim:

| Priority | Query family | Why it is winnable |
|---|---|---|
| 1 | offline GST billing software · GST billing software without internet | The head term "GST billing software" is brutal on its own; qualified with *offline* it is winnable |
| 2 | pendrive / USB GST billing software | Effectively uncontested |
| 3 | billing software no subscription / one yearly fee | Differentiator, and a real buying objection |
| 4 | BOM production costing software for manufacturers | Narrow, high-intent, few competitors |

**On the GST wording:** the site previously said "Tax Ready" everywhere and never
used the word GST, which made it invisible for the highest-volume query in this
market. That was changed deliberately, with the owner's sign-off, to full GST
language — including **"GST compliant"** in FAQ 3 and the matching `FAQPage`
schema. That is a claim about the product, not just a keyword: if the invoice
format, the CGST/SGST/IGST breakup or the HSN handling ever stops meeting the
current GST rules, this copy has to change with it. Keep the claim and the
software in sync.

Those phrases are placed in the `<title>`, the `<h1>`, three `<h2>`s and the
body copy — not stuffed, but present, because they were entirely absent before.
Re-run the audit in "Checking the SEO" below after editing copy; if a phrase
drops to zero occurrences, the page has stopped targeting it.

Meta description targets *offline billing software*, *billing software without
internet*, *inventory software*, *USB pendrive*. Includes Open Graph + Twitter cards
(`assets/img/og-image.jpg`, 1200×630), canonical URL, `sitemap.xml`,
`robots.txt`, and a JSON-LD `@graph` with `WebSite`, `SoftwareApplication`,
`Organization` and `FAQPage`.

`LocalBusiness` was **dropped** along with the Rajkot positioning: the type
carries an obligation to name a real serving locality, and this is now a
national, courier-delivered product. `Organization` keeps `addressRegion:
Gujarat` (true, and where the company is) with `areaServed: India`. `WebSite`
and `SoftwareApplication` both point at `@id: #organization` as their publisher,
so there is one entity rather than two competing ones at the same URL.

`meta keywords` is still in `<head>`; Google has ignored it since 2009. Adding a
phrase there does **nothing** for ranking — if you want to rank for a term it has
to appear in the title, a heading or the body copy. Harmless, not worth
maintaining.

### Checking the SEO

There is no build step, so the check is a script. This prints the rendered title
and description lengths (Google truncates at roughly 60 and 155), the heading
outline, and how often each target phrase appears in visible copy:

```bash
python3 - <<'PY'
import re, html as H
src = open('index.html', encoding='utf-8').read()
t = H.unescape(re.search(r'<title>(.*?)</title>', src, re.S).group(1))
d = H.unescape(re.search(r'<meta name="description" content="(.*?)">', src, re.S).group(1))
print(f'TITLE {len(t)}: {t}\nDESC  {len(d)}: {d}\n')
for lvl, txt in re.findall(r'<(h[12])[^>]*>(.*?)</\1>', src, re.S):
    print(' ', lvl, re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', txt)).strip()[:80])
body = re.sub(r'<script.*?</script>|<!--.*?-->', ' ', src.split('<body>')[1], flags=re.S)
low = ' '.join(re.findall(r"[A-Za-z][A-Za-z'-]+", re.sub(r'<[^>]+>', ' ', body))).lower()
for p in ['offline billing software','billing software','without internet',
          'inventory management','stock management','invoicing software',
          'pendrive','no subscription','bill of materials']:
    print(f'  {low.count(p):3d}  {p}')
PY
```

Validate the structured data at <https://validator.schema.org/> after touching
the JSON-LD — the `FAQPage` block must stay in sync with the visible accordion
(all 11 questions are mirrored today).

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
  form data *and* run Google Analytics (which sets cookies), so you need at
  minimum a privacy policy that names Google Analytics — Google's own terms
  require that disclosure.
- **`grevity.in` is a different company.** Despite the rename in this repo's git
  history, that domain is live and serves an unrelated circular-economy business
  ("Building Circular Value From the Ground Up"). So there is nothing to redirect
  and no Change of Address to file — but there *is* a brand collision: searches
  for "Grevity" alone will surface both. Rank for **"Grevity billing software"**
  and **"Grevity pendrive billing"** rather than the bare brand name, and get the
  Google Business Profile up so the local pack disambiguates you.
- **The 3D layer needs a CDN.** three.js is the one third-party runtime
  dependency. If cdnjs is blocked (some corporate networks) the page is fully
  intact — the CSS pendrive stays — but nobody on that network sees the WebGL
  version. If that matters, vendor `three.module.min.js` into `assets/js/` and
  point the import in `scene.js` at the local copy.

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
