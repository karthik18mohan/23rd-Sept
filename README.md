# 5 Years of Us ❤️

A mobile-first interactive anniversary microsite built for 23 September.

## What is included

- Hold-to-open gift intro with heart burst
- Live relationship duration counter from 23 Sep 2021
- Animated rewind into a five-chapter relationship timeline
- 15 photo-driven memory cards with graceful placeholders
- Five hidden-heart Easter eggs saved in local storage
- Then-vs-now draggable comparison
- Interactive vinyl/audio player
- 25 tappable reasons-I-love-you cards
- Animated memory mosaic
- “Our little things” scrapbook
- Year 6–10 future Polaroids
- Tap-to-open anniversary letter
- Full-screen finale and Chapter 6 epilogue
- Responsive/mobile-first layout and reduced-motion accessibility

## Personalize

Edit `content.js` only: partner name, chapter text, hidden-heart secrets, the 25 reasons, “our little things,” and the final letter.

The anniversary date is already configured as `2021-09-23`.

## Add your photos

Upload these into `assets/`:

- `hero.jpg`, `then.jpg`, `now.jpg`, `finale.jpg`
- `2021-1.jpg` through `2021-3.jpg`
- `2022-1.jpg` through `2022-3.jpg`
- `2023-1.jpg` through `2023-3.jpg`
- `2024-1.jpg` through `2024-3.jpg`
- `2025-1.jpg`
- `2026-1.jpg`, `2026-2.jpg`

Missing photos fall back to styled memory placeholders, so the experience never shows broken-image icons.

## Add music / voice note

Upload audio as `assets/our-song.mp3`. Playback starts only after the record player is tapped, matching browser autoplay rules.

## Run locally

No build step is required:

```bash
python3 -m http.server 3000
```

Then open `http://localhost:3000`.

## Deploy

Import the repo into Vercel as a static site, or serve it directly with GitHub Pages.

## Privacy note

This repository is currently **public**. If you upload private couple photos here, those files are public too. Make the repo private before adding sensitive media if you want the photos to stay private.
