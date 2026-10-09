// All interface text lives here. To add a language, copy the `en` block,
// translate the values and add the code to LANGS.

export const LANGS = ['de', 'en'];

const STRINGS = {
  de: {
    tagline: 'Dreh das Rad, lass den Zufall entscheiden.',
    entries: 'Einträge',
    history: 'Verlauf',
    settings: 'Einstellungen',
    entriesHint: 'Ein Eintrag pro Zeile. Mit „*3“ am Ende zählt ein Eintrag dreifach.',
    entriesPlaceholder: 'Pizza\nSushi *2\nBurger',
    presets: 'Vorlagen',
    shuffle: 'Mischen',
    clear: 'Leeren',
    restore: 'Entfernte zurückholen',
    fieldsPerEntry: 'Felder pro Eintrag',
    duration: 'Drehdauer',
    seconds: 's',
    physics: 'Auslaufen',
    physicsMedium: 'Normal',
    physicsHeavy: 'Schwer',
    physicsRandom: 'Überraschung',
    physicsLinear: 'Gleichmäßig',
    sound: 'Ton',
    confetti: 'Konfetti',
    autoRemove: 'Gewinner automatisch entfernen',
    spin: 'Drehen',
    spinning: 'Dreht …',
    stop: 'Stopp',
    cancelSpin: 'Abbrechen',
    cancelQuestion: 'Drehen abbrechen? Es gibt dann kein Ergebnis.',
    cancelConfirm: 'Ja, abbrechen',
    keepSpinning: 'Weiterdrehen',
    spinCancelled: 'Drehen abgebrochen, kein Ergebnis',
    summary: (fields, entries) =>
      `${fields} ${fields === 1 ? 'Feld' : 'Felder'} aus ${entries} ${entries === 1 ? 'Eintrag' : 'Einträgen'}`,
    emptyWheel: 'Trag ein paar Einträge ein',
    emptyWheelShort: 'Einträge hinzufügen',
    winner: 'Ergebnis',
    spinAgain: 'Nochmal drehen',
    remove: 'Entfernen',
    close: 'Schließen',
    historyEmpty: 'Noch nichts gedreht. Ergebnisse erscheinen hier.',
    clearHistory: 'Verlauf löschen',
    share: 'Link teilen',
    linkCopied: 'Link kopiert',
    linkReady: 'Link in der Adresszeile',
    removed: (name) => `„${name}“ entfernt`,
    restored: (n) => `${n} ${n === 1 ? 'Eintrag' : 'Einträge'} zurückgeholt`,
    fullscreen: 'Vollbild',
    exitFullscreen: 'Vollbild beenden',
    theme: 'Darstellung',
    themeAuto: 'Automatisch',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    language: 'Sprache',
    keyHint: 'Leertaste dreht, Esc bricht ab',
    loadedFromLink: 'Rad aus Link geladen',
    presetNames: {
      yesno: 'Ja / Nein',
      coin: 'Münze',
      dice: 'Würfel',
      numbers: 'Zahlen 1–10',
      food: 'Essen',
      weekdays: 'Wochentage',
      rps: 'Schere, Stein, Papier',
    },
    presetItems: {
      yesno: ['Ja', 'Nein'],
      coin: ['Kopf', 'Zahl'],
      dice: ['1', '2', '3', '4', '5', '6'],
      numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      food: ['Pizza', 'Sushi', 'Burger', 'Pasta', 'Curry', 'Döner', 'Tacos', 'Salat', 'Ramen', 'Falafel'],
      weekdays: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
      rps: ['Schere', 'Stein', 'Papier'],
    },
  },
  en: {
    tagline: 'Spin the wheel and let chance decide.',
    entries: 'Entries',
    history: 'History',
    settings: 'Settings',
    entriesHint: 'One entry per line. Add “*3” at the end to count an entry three times.',
    entriesPlaceholder: 'Pizza\nSushi *2\nBurger',
    presets: 'Presets',
    shuffle: 'Shuffle',
    clear: 'Clear',
    restore: 'Bring back removed',
    fieldsPerEntry: 'Fields per entry',
    duration: 'Spin duration',
    seconds: 's',
    physics: 'Slowdown',
    physicsMedium: 'Normal',
    physicsHeavy: 'Heavy',
    physicsRandom: 'Surprise',
    physicsLinear: 'Even',
    sound: 'Sound',
    confetti: 'Confetti',
    autoRemove: 'Remove winner automatically',
    spin: 'Spin',
    spinning: 'Spinning …',
    stop: 'Stop',
    cancelSpin: 'Cancel',
    cancelQuestion: 'Cancel this spin? There will be no result.',
    cancelConfirm: 'Yes, cancel',
    keepSpinning: 'Keep spinning',
    spinCancelled: 'Spin cancelled, no result',
    summary: (fields, entries) =>
      `${fields} ${fields === 1 ? 'field' : 'fields'} from ${entries} ${entries === 1 ? 'entry' : 'entries'}`,
    emptyWheel: 'Add a few entries',
    emptyWheelShort: 'Add entries',
    winner: 'Result',
    spinAgain: 'Spin again',
    remove: 'Remove',
    close: 'Close',
    historyEmpty: 'Nothing spun yet. Results show up here.',
    clearHistory: 'Clear history',
    share: 'Share link',
    linkCopied: 'Link copied',
    linkReady: 'Link is in the address bar',
    removed: (name) => `Removed “${name}”`,
    restored: (n) => `Brought back ${n} ${n === 1 ? 'entry' : 'entries'}`,
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    theme: 'Appearance',
    themeAuto: 'Automatic',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    keyHint: 'Space spins, Esc cancels',
    loadedFromLink: 'Wheel loaded from link',
    presetNames: {
      yesno: 'Yes / No',
      coin: 'Coin',
      dice: 'Dice',
      numbers: 'Numbers 1–10',
      food: 'Food',
      weekdays: 'Weekdays',
      rps: 'Rock, paper, scissors',
    },
    presetItems: {
      yesno: ['Yes', 'No'],
      coin: ['Heads', 'Tails'],
      dice: ['1', '2', '3', '4', '5', '6'],
      numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      food: ['Pizza', 'Sushi', 'Burger', 'Pasta', 'Curry', 'Kebab', 'Tacos', 'Salad', 'Ramen', 'Falafel'],
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      rps: ['Rock', 'Paper', 'Scissors'],
    },
  },
};

let current = 'en';

export function detectLang() {
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS.includes(nav) ? nav : 'en';
}

export function setLang(lang) {
  current = LANGS.includes(lang) ? lang : 'en';
  document.documentElement.lang = current;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
    el.setAttribute('aria-label', el.title);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}

export function getLang() {
  return current;
}

export function t(key, ...args) {
  const value = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}
