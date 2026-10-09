# Spin

Ein Glücksrad für den Browser: Einträge eintragen, drehen, Ergebnis. Läuft unter [spin.bapo.me](https://spin.bapo.me).

A lucky wheel for the browser. German and English interface, light and dark mode.

## Funktionen

- **Einträge** – einer pro Zeile. `Sushi *3` zählt dreifach (auch `x3` oder `×3`).
- **Felder pro Eintrag** – bis zu 50 Kopien je Eintrag. Die Kopien werden so verteilt, dass derselbe Eintrag nie direkt neben sich steht. **Mischen** ordnet neu.
- **Fair** – jedes Feld hat dieselbe Chance. Der Gewinner wird zuerst gezogen, dann läuft das Rad dorthin aus.
- **Gewinner entfernen** – per Knopf im Ergebnis oder automatisch. **Entfernte zurückholen** stellt alles wieder her.
- **Verlauf** der letzten 100 Ergebnisse.
- **Vorlagen** – Ja/Nein, Münze, Würfel, Zahlen, Essen, Wochentage, Schere-Stein-Papier.
- **Link teilen** – das komplette Rad steckt im Link.
- **Vollbild**, **Leertaste** zum Drehen, Ton und Konfetti abschaltbar.
- Animationen bei jedem Wechsel, abgeschaltet bei „Bewegung reduzieren“.
- Alles wird lokal im Browser gespeichert. Kein Server, kein Tracking.

## Aufbau

Reines HTML, CSS und JavaScript ohne Build-Schritt. GitHub Pages liefert den Ordner direkt aus.

```
index.html        Seitenstruktur
css/style.css     Design; Farben und Schriften als Variablen ganz oben
js/main.js        Bedienung: verbindet Oberfläche, Rad und Speicher
js/wheel.js       Zeichnen und Drehen des Rads (Canvas)
js/entries.js     Einträge lesen, Gewichte, Verteilung der Felder
js/i18n.js        Alle Texte auf Deutsch und Englisch
js/storage.js     Lokales Speichern und Teilen-Link
js/sound.js       Tick- und Gewinnton (Web Audio, keine Dateien)
js/motion.js      Animations-Helfer (Theme-Wechsel, Tabs, Dialog)
```

## Lokal starten

ES-Module brauchen einen kleinen Webserver, `file://` reicht nicht:

```sh
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Typische Änderungen

| Was | Wo |
|---|---|
| Farben der Felder | `--seg-1` … `--seg-8` in `css/style.css` |
| Hell-/Dunkel-Farben | `:root` und die beiden Dark-Blöcke in `css/style.css` |
| Texte ändern, Sprache hinzufügen | `js/i18n.js` – `en`-Block kopieren, übersetzen, Kürzel in `LANGS` eintragen |
| Neue Vorlage | `presetNames` und `presetItems` in `js/i18n.js`, in jeder Sprache |
| Maximale Felder pro Eintrag | `max` am Regler `#perEntry` in `index.html` |
| Drehgefühl | `EASING` in `js/wheel.js` |
| Animationen | Abschnitt „motion“ in `css/style.css`; bei „Bewegung reduzieren“ im System sind sie aus |
