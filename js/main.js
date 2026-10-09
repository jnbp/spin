import { Wheel } from './wheel.js';
import { parseEntries, buildFields, removeEntry, newSeed } from './entries.js';
import { load, save, toHash, fromHash } from './storage.js';
import { setLang, detectLang, getLang, t, LANGS } from './i18n.js';
import * as sound from './sound.js';
import { replay, transition, placeInk, closeDialog, motionOff } from './motion.js';

const $ = (id) => document.getElementById(id);
const el = {
  entries: $('entries'),
  perEntry: $('perEntry'),
  perEntryOut: $('perEntryOut'),
  duration: $('duration'),
  durationOut: $('durationOut'),
  physics: $('physics'),
  sound: $('sound'),
  confetti: $('confetti'),
  autoRemove: $('autoRemove'),
  summary: $('summary'),
  spinBtn: $('spinBtn'),
  panelSpinBtn: $('panelSpinBtn'),
  cancelBar: $('cancelBar'),
  cancelYes: $('cancelYes'),
  cancelNo: $('cancelNo'),
  confettiLayer: $('confettiLayer'),
  wheelWrap: document.querySelector('.wheel-wrap'),
  tabInk: $('tabInk'),
  langToggle: document.querySelector('.seg-toggle'),
  emptyNote: $('emptyNote'),
  pointer: $('pointer'),
  result: $('result'),
  resultName: $('resultName'),
  againBtn: $('againBtn'),
  removeBtn: $('removeBtn'),
  closeBtn: $('closeBtn'),
  shuffleBtn: $('shuffleBtn'),
  clearBtn: $('clearBtn'),
  restoreBtn: $('restoreBtn'),
  presetMenu: $('presetMenu'),
  presetList: $('presetList'),
  historyList: $('historyList'),
  historyEmpty: $('historyEmpty'),
  historyCount: $('historyCount'),
  clearHistoryBtn: $('clearHistoryBtn'),
  themeBtn: $('themeBtn'),
  shareBtn: $('shareBtn'),
  fullscreenBtn: $('fullscreenBtn'),
  stage: $('stage'),
  toast: $('toast'),
};

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = load();
let lastWinner = null;

// A shared link overrides the saved wheel (but not history or appearance).
const shared = fromHash(location.hash);
if (shared) {
  Object.assign(state, shared, { removed: [] });
  history.replaceState(null, '', location.pathname + location.search);
}
if (!state.entries.trim() && !shared) {
  state.entries = ['Pizza', 'Sushi', 'Burger', 'Pasta', 'Curry', 'Tacos'].join('\n');
}

const wheel = new Wheel($('wheel'), { onTick: handleTick });

// ---------- rendering ----------

function rebuild() {
  // Never swap fields under a running spin; spin() rebuilds when it ends.
  if (wheel.spinning) return save(state);
  const entries = parseEntries(state.entries);
  const fields = buildFields(entries, state.perEntry, state.seed);
  wheel.setFields(fields);
  const empty = fields.length === 0;
  el.emptyNote.hidden = !empty;
  el.spinBtn.disabled = empty && !wheel.spinning;
  el.panelSpinBtn.disabled = empty && !wheel.spinning;
  el.summary.textContent = empty ? '' : t('summary', fields.length, entries.length);
  const wasHidden = el.restoreBtn.hidden;
  el.restoreBtn.hidden = state.removed.length === 0;
  if (wasHidden && !el.restoreBtn.hidden) replay(el.restoreBtn, 'pop');
  el.restoreBtn.textContent = `${t('restore')} (${state.removed.length})`;
  save(state);
}

function renderHistory({ fresh = false } = {}) {
  const items = state.history;
  el.historyList.replaceChildren(
    ...items.map((h) => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = h.label;
      const time = document.createElement('time');
      const d = new Date(h.at);
      time.dateTime = d.toISOString();
      time.textContent = d.toLocaleTimeString(getLang(), { hour: '2-digit', minute: '2-digit' });
      li.append(name, time);
      return li;
    })
  );
  el.historyEmpty.hidden = items.length > 0;
  el.clearHistoryBtn.hidden = items.length === 0;
  el.historyCount.hidden = items.length === 0;
  el.historyCount.textContent = items.length;
  if (fresh) {
    replay(el.historyList.firstElementChild, 'slide-in');
    replay(el.historyCount, 'bump');
  }
}

function renderPresets() {
  const names = t('presetNames');
  el.presetList.replaceChildren(
    ...Object.keys(names).map((key) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = names[key];
      b.addEventListener('click', () => {
        state.entries = t('presetItems')[key].join('\n');
        state.removed = [];
        el.entries.value = state.entries;
        el.presetMenu.open = false;
        rebuild();
        pulseWheel(Math.PI);
      });
      return b;
    })
  );
}

function syncControls() {
  el.entries.value = state.entries;
  el.perEntry.value = state.perEntry;
  el.perEntryOut.textContent = state.perEntry;
  el.duration.value = state.duration;
  el.durationOut.textContent = `${state.duration} ${t('seconds')}`;
  el.physics.value = state.physics;
  el.sound.checked = state.sound;
  el.confetti.checked = state.confetti;
  el.autoRemove.checked = state.autoRemove;
}

function applyLang(lang) {
  state.lang = lang;
  el.langToggle.dataset.active = lang;
  setLang(lang);
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
  wheel.setEmptyText(t('emptyWheelShort'));
  updateSpinButtons();
  updateThemeButton();
  updateFullscreenButton();
  renderPresets();
  renderHistory();
  syncControls();
  rebuild();
  requestAnimationFrame(() => placeInk(el.tabInk, document.querySelector('[role="tab"][aria-selected="true"]')));
}

// ---------- theme ----------

const THEMES = ['auto', 'light', 'dark'];

function applyTheme(theme) {
  state.theme = theme;
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  updateThemeButton();
  // Canvas colours come from CSS; drawing reads the freshly applied styles.
  wheel.draw();
  save(state);
}

function updateThemeButton() {
  el.themeBtn.dataset.mode = state.theme;
  const label = `${t('theme')}: ${t('theme' + state.theme[0].toUpperCase() + state.theme.slice(1))}`;
  el.themeBtn.title = label;
  el.themeBtn.setAttribute('aria-label', label);
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => wheel.draw());

// ---------- spinning ----------

function handleTick() {
  if (state.sound) sound.tick();
  if (reducedMotion.matches) return;
  el.pointer.classList.remove('flick');
  void el.pointer.offsetWidth; // restart the animation
  el.pointer.classList.add('flick');
}

function updateSpinButtons() {
  const on = wheel.spinning;
  el.spinBtn.querySelector('span').textContent = on ? t('stop') : t('spin');
  el.panelSpinBtn.textContent = on ? t('cancelSpin') : t('spin');
  el.panelSpinBtn.classList.toggle('is-cancel', on);
}

function onSpinButton() {
  if (wheel.spinning) askCancel();
  else spin();
}

function askCancel() {
  if (!wheel.spinning) return;
  el.cancelBar.hidden = false;
  el.cancelNo.focus();
}

function hideCancel() {
  el.cancelBar.hidden = true;
}

async function spin() {
  if (wheel.spinning || !wheel.fields.length) return;
  if (el.result.open) closeDialog(el.result);
  if (state.sound) sound.unlock();
  clearConfetti();
  replay(el.spinBtn, 'press');
  document.body.classList.add('is-spinning');

  const spinning = wheel.spin({ duration: state.duration, physics: state.physics });
  updateSpinButtons();
  const index = await spinning;

  document.body.classList.remove('is-spinning');
  hideCancel();
  updateSpinButtons();
  rebuild();

  if (index == null || index < 0) {
    toast(t('spinCancelled'));
    return;
  }

  const label = wheel.fields[index].label;
  lastWinner = label;
  state.history.unshift({ label, at: Date.now() });
  state.history = state.history.slice(0, 100);
  renderHistory({ fresh: true });

  if (state.sound) sound.win();
  if (state.autoRemove) removeWinner(label, { silent: true });
  showResult(label);
  // After the dialog, so the confetti layer sits on top of it.
  if (state.confetti && !reducedMotion.matches) celebrate();
  save(state);
}

function showResult(label) {
  if (el.result.open) {
    el.result.classList.remove('closing');
    el.result.close();
  }
  el.resultName.textContent = label;
  el.removeBtn.hidden = state.autoRemove || !parseEntries(state.entries).some((e) => e.label === label);
  el.result.showModal();
  el.againBtn.focus();
}

function removeWinner(label, { silent = false } = {}) {
  const { text, line } = removeEntry(state.entries, label);
  if (line == null) return;
  state.entries = text;
  state.removed.push(line);
  el.entries.value = text;
  rebuild();
  pulseWheel();
  if (!silent) toast(t('removed', label));
}

let confettiShot = null;
let confettiTimer;

function celebrate() {
  if (typeof window.confetti !== 'function') return;
  const layer = el.confettiLayer;
  // The result dialog lives in the browser's top layer. A popover opened after
  // it stacks above it, so the confetti flies in front of the result.
  if (layer.showPopover) {
    if (layer.matches(':popover-open')) layer.hidePopover();
    layer.showPopover();
  }
  if (!confettiShot) confettiShot = window.confetti.create(layer, { resize: true, useWorker: false });

  const colors = ['#ffd23f', '#4fd1c5', '#ff8a7a', '#a596ff', '#74c7ff', '#ffab5c'];
  confettiShot({ particleCount: 160, spread: 100, startVelocity: 55, origin: { x: 0.5, y: 0.6 }, colors, scalar: 1.3 });
  const end = Date.now() + 1600;
  (function frame() {
    confettiShot({ particleCount: 6, angle: 60, spread: 65, origin: { x: 0, y: 0.75 }, colors, scalar: 1.2 });
    confettiShot({ particleCount: 6, angle: 120, spread: 65, origin: { x: 1, y: 0.75 }, colors, scalar: 1.2 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  clearTimeout(confettiTimer);
  confettiTimer = setTimeout(clearConfetti, 5500);
}

function clearConfetti() {
  clearTimeout(confettiTimer);
  confettiShot?.reset();
  const layer = el.confettiLayer;
  if (layer.hidePopover && layer.matches(':popover-open')) layer.hidePopover();
}

// ---------- small helpers ----------

function pulseWheel(turn = 0) {
  replay(el.wheelWrap, 'pulse');
  if (turn && !motionOff()) wheel.nudge(turn, 650);
}

function bumpOutput(out) {
  replay(out, 'bump');
}

let toastTimer;
function toast(message) {
  el.toast.textContent = message;
  el.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
}

function updateFullscreenButton() {
  const on = !!document.fullscreenElement;
  const label = on ? t('exitFullscreen') : t('fullscreen');
  el.fullscreenBtn.title = label;
  el.fullscreenBtn.setAttribute('aria-label', label);
  el.fullscreenBtn.setAttribute('aria-pressed', String(on));
}

function isTyping(target) {
  return target.closest('textarea, input, select, [contenteditable], summary, button, a');
}

// ---------- events ----------

let typingTimer;
el.entries.addEventListener('input', () => {
  state.entries = el.entries.value;
  clearTimeout(typingTimer);
  typingTimer = setTimeout(rebuild, 120);
});

el.perEntry.addEventListener('input', () => {
  state.perEntry = +el.perEntry.value;
  el.perEntryOut.textContent = state.perEntry;
  bumpOutput(el.perEntryOut);
  rebuild();
});

el.duration.addEventListener('input', () => {
  state.duration = +el.duration.value;
  el.durationOut.textContent = `${state.duration} ${t('seconds')}`;
  bumpOutput(el.durationOut);
  save(state);
});

el.physics.addEventListener('change', () => { state.physics = el.physics.value; save(state); });
el.sound.addEventListener('change', () => { state.sound = el.sound.checked; save(state); });
el.confetti.addEventListener('change', () => { state.confetti = el.confetti.checked; save(state); });
el.autoRemove.addEventListener('change', () => { state.autoRemove = el.autoRemove.checked; save(state); });

el.shuffleBtn.addEventListener('click', () => {
  state.seed = newSeed();
  rebuild();
  pulseWheel(Math.PI * 2);
});

el.clearBtn.addEventListener('click', () => {
  state.entries = '';
  state.removed = [];
  el.entries.value = '';
  rebuild();
  pulseWheel();
  el.entries.focus();
});

el.restoreBtn.addEventListener('click', () => {
  const n = state.removed.length;
  const base = state.entries.trimEnd();
  state.entries = (base ? base + '\n' : '') + state.removed.join('\n');
  state.removed = [];
  el.entries.value = state.entries;
  rebuild();
  pulseWheel(Math.PI);
  toast(t('restored', n));
});

el.clearHistoryBtn.addEventListener('click', () => { state.history = []; renderHistory(); save(state); });

el.spinBtn.addEventListener('click', onSpinButton);
el.panelSpinBtn.addEventListener('click', onSpinButton);
el.cancelYes.addEventListener('click', () => { hideCancel(); wheel.cancel(); });
el.cancelNo.addEventListener('click', () => { hideCancel(); el.spinBtn.focus(); });
el.againBtn.addEventListener('click', () => { closeDialog(el.result); spin(); });
el.removeBtn.addEventListener('click', () => { closeDialog(el.result); removeWinner(lastWinner); });
el.closeBtn.addEventListener('click', () => closeDialog(el.result));
el.result.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(el.result); });
el.result.addEventListener('click', (e) => { if (e.target === el.result) closeDialog(el.result); });

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && wheel.spinning) {
    e.preventDefault();
    if (el.cancelBar.hidden) askCancel();
    else hideCancel();
    return;
  }
  if (e.code !== 'Space' && e.key !== 'Enter') return;
  if (el.result.open || isTyping(e.target) || e.repeat) return;
  e.preventDefault();
  spin();
});

document.addEventListener('click', (e) => {
  if (el.presetMenu.open && !el.presetMenu.contains(e.target)) el.presetMenu.open = false;
});

// Tabs with arrow-key support
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute('aria-controls')).hidden = !on;
  });
  placeInk(el.tabInk, tab);
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', (e) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    selectTab(next);
    next.focus();
  });
});
selectTab(tabs[0]);
new ResizeObserver(() => placeInk(el.tabInk, tabs.find((t) => t.getAttribute('aria-selected') === 'true'))).observe(el.tabInk.parentElement);

document.querySelectorAll('[data-lang]').forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.lang !== state.lang) transition(() => applyLang(b.dataset.lang));
  })
);

el.themeBtn.addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(state.theme) + 1) % THEMES.length];
  transition(() => applyTheme(next));
  replay(el.themeBtn, 'twist');
});

el.shareBtn.addEventListener('click', async () => {
  const url = location.origin + location.pathname + toHash(state);
  try {
    await navigator.clipboard.writeText(url);
    toast(t('linkCopied'));
  } catch {
    history.replaceState(null, '', url);
    toast(t('linkReady'));
  }
});

el.fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) return void document.exitFullscreen();
  const fallback = () => {
    // iPhone Safari has no Fullscreen API: enlarge the stage within the page.
    document.body.classList.toggle('fake-fullscreen');
    el.fullscreenBtn.setAttribute('aria-pressed', String(document.body.classList.contains('fake-fullscreen')));
    wheel.resize();
  };
  if (el.stage.requestFullscreen && !document.body.classList.contains('fake-fullscreen')) {
    el.stage.requestFullscreen().catch(fallback);
  } else {
    fallback();
  }
});
$('exitFsBtn').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else el.fullscreenBtn.click();
});
document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton();
  wheel.resize();
});

// ---------- start ----------

applyTheme(THEMES.includes(state.theme) ? state.theme : 'auto');
applyLang(LANGS.includes(state.lang) ? state.lang : detectLang());
if (shared) toast(t('loadedFromLink'));
// Entrance: the wheel rolls into place once.
if (!motionOff()) {
  wheel.rotation = -Math.PI * 0.75;
  wheel.nudge(Math.PI * 0.75, 1100);
}
document.fonts?.ready.then(() => wheel.draw());
