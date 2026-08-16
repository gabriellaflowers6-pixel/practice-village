# Practice Village design system — spec for Moxie Studios

Written 2026-08-15 by JoYi's bot, for Gabby's side.

Moxie Studios is canonical in `gabriellaflowers6-pixel/moxie-studios`, so nothing
here was edited from our side. This is the spec, and the reasoning, so Moxie can
join the system on your schedule.

Everything below is measured off the live pages, not designed from scratch.

---

## Why this exists

The Village now shares one geometry across every room. Rooms differ in
**temperature**, never in structure — same bar, same brand, same type scale,
same radii, same elevation. That is what makes them read as one building.

Moxie is the only surface still outside it, and the gap is small enough that it
currently reads as a mistake rather than a choice. Four values are near-misses.

## The four near-misses

| | Moxie today | The Village | Note |
|---|---|---|---|
| Sans | **`Karla`** | **`Hanken Grotesk`** | the visible one |
| Cream | `#F6EEDF` | `#FBF3E8` | 5 steps apart |
| Gold | `#C9A45C` | `#C79A52` | 2 steps apart |
| Ink | `#23150E` | `#2B2013` | 8 steps apart |

Serif already matches: **Cormorant Garamond**, both sides.

Near-miss is worse than deliberate difference. Either match exactly, or diverge
on purpose — Moxie is allowed to be the warmest, darkest room in the Village, it
just should not be four values away by accident.

---

## Type

```
Display / headings   Cormorant Garamond, weight 600
Body / UI            Hanken Grotesk, 400 / 600 / 700 / 800
```

Google Fonts, one request:

```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

### Scale

| Role | Size | Font | Weight |
|---|---|---|---|
| Page h1 | **54px** (`clamp(2.3rem,4.6vw,3.375rem)`) | Cormorant | 600 |
| Section h2 | **28px** (`clamp(1.5rem,2.4vw,1.75rem)`) | Cormorant | 600 |
| Card h2 | **22px** | Cormorant | 600 |
| Body | 16px | Hanken | 400 |
| Nav links | **13.76px** | Hanken | 600 |
| Eyebrow / label | **.72rem**, `letter-spacing:.15em`, uppercase | Hanken | 800 |

**One thing that will bite you:** Cormorant has deep descenders. At
`line-height:1.03` the `g` and `y` clip. Use:

```css
h1,h2,h3{ line-height:1.12; overflow:visible; padding-bottom:.04em; }
```

We shipped that fix after the `g` in "Intelligence" was cut by 4.9px.

---

## Colour

```css
--paper:      #FBF3E8;   /* the ground */
--paper-2:    #F5E8D4;
--ink:        #2B2013;   /* body + headings   14.47:1 on paper  AAA */
--ink-soft:   #5D4F3E;   /* secondary          7.19:1           AAA */
--ink-muted:  #6E5F4A;   /* muted              5.62:1           AA  */
--clay:       #A84214;   /* primary action     5.53:1           AA  */
--clay-deep:  #7E300C;   /* AAA action         8.24:1           AAA */
--gold:       #C79A52;   /* DECORATION ONLY - see below */
--navy:       #1A1A4E;   /* wordmark only */
--line:       rgba(58,40,16,.18);
```

### Gold is decoration only

`#C79A52` measures **2.34:1 on cream** — it fails every contrast bar including
the 3:1 for UI components. It is fine as text **only on the ink ground**, where
it reads 6.20:1 (that is how the footer and the accent card use it).

Rule: gold for botanical tint, hairlines, glow, dividers. Never for status,
never for text on cream.

### Room accents

Rooms carry one accent each. Everything else is shared.

| Room | Accent | Ground |
|---|---|---|
| Landing, lobby, Record | clay `#A84214` | cream `#FBF3E8` |
| Safety Hall | navy `#1F2E5C`, exit crimson `#8E1B2E` | bone `#F4F3F1` |
| The Kitchen | sage `#4A5A37`, action `#3F5233` | cream `#FBF3E8` |
| **Moxie** | **yours to choose** | your call — warmest/darkest is fine |

Scope with a body attribute so nothing leaks:

```html
<body data-room="moxie">
```

---

## The bar

Identical on every surface. This is the single strongest cohesion signal.

```css
.nav{
  position:sticky; top:0; z-index:100;
  height:71px;
  padding:14.4px 64px;
  display:flex; align-items:center; gap:32px;
  background:rgba(251,243,232,.84);
  backdrop-filter:blur(9px);
  border-bottom:1.5px solid transparent;   /* transparent at rest */
  transition:border-color .3s ease;
}
.nav.is-stuck{ border-bottom-color:rgba(58,40,16,.18); }
```

The hairline appears **only once you have left the top** — add `is-stuck` on
scroll past 8px. The page sliding under frosted cream is the effect JoYi
singled out as the thing she likes most.

### Brand

Mark **34px**, gap **8.8px**, then the wordmark in **Cormorant 21.6px / 600 /
`#1A1A4E`**. Six navy dots around a clay centre:

```html
<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
  <circle cx="20"   cy="8"  r="2.8" fill="#1A1A4E"/>
  <circle cx="30.4" cy="14" r="2.8" fill="#1A1A4E"/>
  <circle cx="30.4" cy="26" r="2.8" fill="#1A1A4E"/>
  <circle cx="20"   cy="32" r="2.8" fill="#1A1A4E"/>
  <circle cx="9.6"  cy="26" r="2.8" fill="#1A1A4E"/>
  <circle cx="9.6"  cy="14" r="2.8" fill="#1A1A4E"/>
  <circle cx="20"   cy="20" r="5.5" fill="#A84214"/>
</svg>
```

That clay centre dot is the only orange in the bar, and it is what carries the
brand into rooms that are otherwise cool.

### Nav links

Hanken **13.76px / 600 / `#5D4F3E`**, **no underline**, gap 12.8px.
CTA is a clay pill: `#A84214` background, `#FBF3E8` text, Hanken 13.76/700.

---

## Surfaces

```css
/* cards */
border-radius: 18px;
border: 1px solid rgba(58,40,16,.18);
background: #FFFFFF;                    /* white, not cream */
box-shadow: 0 16px 36px -18px rgba(43,32,19,.30);

/* raised */
box-shadow: 0 22px 50px -24px rgba(43,32,19,.34);

buttons  border-radius: 999px
inputs   border-radius: 12px
```

**Cards must be white, not cream.** `#FFFDF8` on a cream ground is not a
surface — it dissolves. This was the single biggest "why does this look soft"
problem in the member area, and white fixed it.

### Glass, three depths only

```css
--glass-nav:   blur(9px);
--glass-card:  blur(14px) saturate(1.08);
--glass-panel: blur(22px) saturate(1.15);
```

We found seven hand-mixed blur values across four files (3, 8, 9, 10, 14, 22px).
Moxie is currently `blur(8px)` — that is one of them. Three tokens, no more.

### Ground

```css
background:
  radial-gradient(120% 80% at 12% -5%,  rgba(199,154,82,.13), transparent 55%),
  radial-gradient(120% 80% at 100% 8%,  rgba(168,66,20,.07),  transparent 50%),
  #FBF3E8;
```

Gold from the top-left, **clay from the right**. The clay wash is where the
warmth in the paper comes from — a single gold circle (which is what the member
rooms had) reads as an odd flat beige.

---

## The five things we removed

Measured and deleted across the whole Village. If any exist in Moxie, they are
the same job:

1. **Irregular per-corner radii** — `14px 10px 16px 9px`, `22px 14px 25px 16px`.
   21 on the landing, 34 in Safety Hall. Now 18px / 999px.
2. **Hard offset shadows** — `8px 9px 0`, `12px 14px 0`. A sticker look.
   Now one soft diffuse shadow.
3. **Deliberate tilt** — `rotate(1deg)`, `rotate(-1.5deg)`. Nothing sits crooked.
4. **Handwriting as UI** — Caveat labelling section kickers, room tags, ribbons.
   Kickers are now uppercase letterspaced Hanken. Caveat is retired as structure.
5. **Filled status pills** — `border-radius:999px` with a fill. Status is label
   text: uppercase, letterspaced, coloured, no background.

Botanicals stay. They read as editorial illustration, not decoration.

---

## Accessibility floor

- **AA everywhere**, **AAA in Safety Hall** (that room is used under stress).
- Interactive targets **≥44×44**. Our header controls were 38px; all three are
  44 now.
- Anything that is a genuine escape control is `position:fixed`, never `static`.
- Respect `prefers-reduced-motion`.

Contrast to check against the ground the token actually sits on, not the one you
assume. We got this wrong once: gold measured 2.34:1 against cream, but it lives
on the ink ground where it is 6.20:1 and fine.

---

## What is live now

`thepracticevillage.org`, deployed 2026-08-15.

```
styles.css               v103
assets/member.css        v31    (7 pages)
safety-hall.css          v26
safety-hall.js           v20
member-auth.bundle.js    v23    (7 pages)
```

Audited across nine surfaces — landing, Safety Hall, login, lobby, Record,
account, Kitchen, HUSH, welcome:

```
wobbly boxes      0
sticker shadows   0
tilted elements   0
clipped headings  0
handwriting as UI 0
sticky glass bar  9 of 9
```

---

## Two notes for your side specifically

**The Safety Hall door.** In the member lobby, the Safety Hall card carries a
navy left rule and a navy Open tag, because the room behind it is cool navy and
a member should not be surprised by the switch. If Moxie takes a distinct
accent, give its lobby card the same treatment — the door should preview the
room.

**Shared surfaces.** This work touched `styles.css`, `assets/member.css`,
`safety-hall.css`, `safety-hall.js`, `login.html`, `index.html`,
`safety-hall.html` and the six `netlify/functions/member-*.mjs` shells, all in
`gabriellaflowers6-pixel/practice-village`, pushed to `main` at `b2ac885`.
Nothing in `moxie-studios` was touched.
