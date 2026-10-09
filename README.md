# Spin

A lucky wheel for the browser: add entries, spin, get a result. Live at [spin.bapo.me](https://spin.bapo.me).

The interface is available in English and German, with light and dark mode.

## Features

- **Entries** – one per line. `Sushi *3` counts three times (`x3` and `×3` work too).
- **Fields per entry** – up to 50 copies of each entry. Copies are spread so the same entry never sits next to itself. **Shuffle** rearranges them.
- **Fair** – every field has the same chance. The winner is drawn first, then the wheel eases into that field.
- **Remove the winner** – with a button on the result, or automatically. **Bring back removed** restores everything.
- **Cancel a spin** – with the stop button or Esc, after a short confirmation.
- **History** of the last 100 results.
- **Presets** – yes/no, coin, dice, numbers, food, weekdays, rock-paper-scissors.
- **Share link** – the whole wheel is stored in the link.
- **Fullscreen**, **space bar** to spin, sound and confetti can be turned off.
- Animations for every interaction, turned off when the system asks for reduced motion.
- Everything is saved locally in the browser. No server, no tracking.

## Structure

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves the folder as is.

```
index.html        Page structure
css/style.css     Design; colours and fonts as variables at the top
js/main.js        App logic: connects the interface, the wheel and storage
js/wheel.js       Drawing and spinning the wheel (canvas)
js/entries.js     Parsing entries, weights, spreading the fields
js/i18n.js        All interface text in English and German
js/storage.js     Local saving and the share link
js/sound.js       Tick and win sounds (Web Audio, no audio files)
js/motion.js      Animation helpers (theme switch, tabs, dialog)
```

## Run locally

ES modules need a small web server; opening the file directly (`file://`) does not work:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Common changes

| What | Where |
|---|---|
| Wheel colours | `--seg-1` … `--seg-8` in `css/style.css` |
| Light and dark colours | `:root` and the two dark blocks in `css/style.css` |
| Edit text or add a language | `js/i18n.js` – copy the `en` block, translate it, add the code to `LANGS` |
| New preset | `presetNames` and `presetItems` in `js/i18n.js`, in every language |
| Maximum fields per entry | `max` on the `#perEntry` slider in `index.html` |
| Spin feel | `EASING` in `js/wheel.js` |
| Animations | The "motion" section in `css/style.css`; they turn off when the system asks for reduced motion |
