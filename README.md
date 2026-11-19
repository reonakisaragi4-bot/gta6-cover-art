# Sol Marina Cover Maker

[![make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/reonakisaragi4-bot/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/reonakisaragi4-bot/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for the [make.fun bounty **Make GTA 6 Cover Art**](https://make.fun/bounty/gta6-cover-art-01) (gta6-cover-art-01).

**Sol Marina Cover Maker** is an offline web app that turns any photo and a caption into a multi-panel poster cover in the style of GTA 6's posters — with original art only. The fictional city is Sol Marina; there is no Rockstar Games logo, wordmark, artwork, character or font anywhere in it.

## What it does

- **Any photo:** upload photos from your machine (read locally, never uploaded) or use the two included sample photos, made with an image model and free to use.
- **Several panels:** fill all three panels with one photo, or a different photo per panel.
- **Crop and position:** click a panel to select it, drag the preview to pan it, use the zoom slider, reset a panel's crop any time.
- **Layouts:** Hero Split (one big panel + two stacked), Triptych (three vertical panels), Poster Stack (big top panel + bottom strip).
- **Caption:** main title and subtitle, title size, colour, dark outline and slant.
- **Colour grades:** Sunset (orange/pink), Neon (magenta/cyan) and Dusk (purple/teal) — canvas gradients and overlays, plus vignette and grain.
- **Live preview:** the canvas redraws as you edit.
- **Export PNG:** 1080 × 1080, 1080 × 1350 and 1920 × 1080, one click, via `canvas.toBlob`.

## Run it

Serve `app/` with any static server and open `app/index.html` in desktop Chrome. No network request is made: every script, font and image is a file under `app/`.

```sh
cd app && python3 -m http.server 8080
# open http://localhost:8080
```

Add `?demo=1` to auto-load both sample photos with the default caption ("SOL MARINA" / "NEON BAY NIGHTS").

## Fonts

- **Anton** (display) and **Bebas Neue** (sub-captions), both under the SIL Open Font License (see `app/fonts/OFL.txt`).

## Hand in

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `/output/dossier.json` with `buildDossier` from `vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE).
