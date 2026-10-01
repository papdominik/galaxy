# Fitness Centar Galaxy — plain HTML/CSS/JavaScript site

A single-page Croatian site for a gym in Vinkovci. Dark, with a scroll-driven
film: as the visitor scrolls, an eight second clip plays as one continuous camera
move through the gym while the copy reads over it.

**No framework, no build step and no dependencies.** Three files do the work:
`index.html`, `styles.css` and `script.js`. What you see in this folder is
exactly what a browser is served.

## Run it locally

Open `index.html` in a browser and it works, but browsers are stricter about
local video files than a real server is. For a faithful test, serve the folder:

```bash
# Python 3, already on most machines
python3 -m http.server 8000
# then open http://localhost:8000
```

Or with Node:

```bash
npx serve .
```

## What every file is

| Path | What it does |
|---|---|
| `index.html` | The whole page: nav, the film section, six content sections, footer, SEO meta and JSON-LD business data. All the copy lives here. |
| `styles.css` | The entire design: brand colours, fonts, type scale, layout, the CTAs, the sticky film stage, responsive rules. |
| `script.js` | Three small jobs: header background on scroll, the scroll film, and skipping the film for reduced-motion visitors. |
| `assets/world/scene-01.mp4` | The desktop film, 4.6 MB. |
| `assets/world/scene-01-mobile.mp4` | The lighter encode for phones, 3.5 MB. |
| `assets/world/scene-01-poster.jpg` | The first frame of the desktop clip, shown before the video loads. |
| `assets/world/scene-01-mobile-poster.jpg` | The first frame of the mobile clip. |
| `assets/img/floor.jpg` | Training floor with weight racks. |
| `assets/img/weights.jpg` | Dumbbell rack. |
| `assets/img/cardio.jpg` | Treadmills and bikes. |
| `assets/img/sauna.jpg` | The sauna. |
| `brand/cover.jpg` | The wide cover image. |
| `brand/og.jpg` | The social sharing card (og:image). |
| `brand/icon.png` | The favicon. |
| `brand/apple-touch-icon.png` | The home-screen icon for iPhones. |

## Editing the copy

Everything visible is in `index.html`, in plain Croatian text. Search for the
line you want to change and change it. Nothing is generated or templated, so a
find-and-replace is always safe.

## Changing the brand

Every colour is at the top of `styles.css`, in the `:root` block. Change
`--gx-accent` and the whole site changes colour. The fonts are the two `<link>`
tags in the head of `index.html`, and the type scale is the `clamp()` values in
`styles.css`.

## Replacing the film

**1. Get a clip that will scrub well.** One continuous camera move, no cuts, slow
steady motion, a dark low-detail background the text can sit on, one centred
subject, 16:9, roughly 5 to 15 seconds, and no text or logos burned in.

**2. Encode the desktop version.**

```bash
ffmpeg -y -i source.mp4 -an \
  -vf "unsharp=5:5:0.8:5:5:0.0" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart scene-01.mp4
```

`-g 8` puts a keyframe every eighth frame, which is what makes seeking fast
enough to scrub smoothly. `-an` drops audio, which the page never plays.

**3. Encode the mobile version.**

```bash
ffmpeg -y -i source.mp4 -an \
  -vf "scale=-2:'min(720,ih)',unsharp=5:5:0.6:5:5:0.0" \
  -c:v libx264 -preset slow -crf 23 -pix_fmt yuv420p \
  -g 4 -keyint_min 4 -sc_threshold 0 -movflags +faststart scene-01-mobile.mp4
```

**4. Generate the posters from the encoded clips**, not from your original file:

```bash
ffmpeg -y -ss 0 -i scene-01.mp4        -frames:v 1 -q:v 4 scene-01-poster.jpg
ffmpeg -y -ss 0 -i scene-01-mobile.mp4 -frames:v 1 -q:v 4 scene-01-mobile-poster.jpg
```

The poster must be the exact first frame of the clip beside it, or the film
visibly jumps at the start.

**5. Drop the four files into** `assets/world/`, keeping the same names. If you
want different names, update the four `data-` attributes on the `<video>` element
in `index.html`:

```html
data-desktop="assets/world/scene-01.mp4"
data-mobile="assets/world/scene-01-mobile.mp4"
data-poster-desktop="assets/world/scene-01-poster.jpg"
data-poster-mobile="assets/world/scene-01-mobile-poster.jpg"
```

**6. Adjust the pacing.** In `styles.css`, the height of `.journey` (currently
`300vh`) controls how much scrolling the film is spread across. Make it taller for
a slower, longer scrub, shorter for a quicker one.

**7. Check the sizes.** Aim for under about 5 MB per encode. Over that, raise the
CRF (22 desktop, 25 mobile) and re-encode.

## Removing the film entirely

If the client would rather have a normal page, delete the `<video>`, the
`<img class="journey__poster">`, the scrim `<div>` and the `<script>` tag, then
change `.journey { height: 300vh }` to `height: auto` and
`.journey__stage { position: sticky }` to `position: relative` in `styles.css`.
The copy stays exactly where it is.

## Publishing it

There is nothing to build. Upload this folder to any host:

- **Netlify**: drag the folder onto netlify.com/drop. Live in seconds, free.
- **Cloudflare Pages**: create a project and upload the folder.
- **GitHub Pages**: push the folder to a repo and enable Pages.
- **Any shared host or cPanel**: copy the files into the public folder.

Then buy the client's domain and point its DNS at the host. Certificates are
automatic on all of the above.

## Before this goes live for the real gym

1. **Replace the four photos** in `assets/img/` with the gym's own. The current
   ones are generated, which is why the footer says "Fotografije su ilustrativne".
2. **Add the real opening hours.** The page only says "Otvoreno do 22:00" because
   the per-day hours were not available.
3. **Add real review quotes**, or leave it as it is: the page shows the genuine
   Google rating (4,6 from 111 reviews) and links to Google rather than inventing
   anything.
4. **Confirm the facts**: address, phone, the 28 € price, the Instagram handle.
5. **Set absolute URLs in the head** of `index.html` once the domain is known:
   `og:image`, and add `og:url` and a canonical link. Social networks cannot
   resolve relative paths.
