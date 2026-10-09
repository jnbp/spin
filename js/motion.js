// Small animation helpers. Everything here is skipped when the visitor has
// asked their system for reduced motion.

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

export const motionOff = () => reduced.matches;

/** Restarts a one-shot CSS animation class on an element. */
export function replay(el, className) {
  if (!el || motionOff()) return;
  el.classList.remove(className);
  void el.offsetWidth;
  el.classList.add(className);
  el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
}

/** Runs `update` inside a soft crossfade when the browser supports it. */
export function transition(update) {
  if (!document.startViewTransition || motionOff()) {
    update();
    return;
  }
  document.startViewTransition(update);
}

/** Moves the sliding underline under the selected tab. */
export function placeInk(ink, tab) {
  if (!ink || !tab) return;
  ink.style.width = `${tab.offsetWidth}px`;
  ink.style.transform = `translateX(${tab.offsetLeft}px)`;
}

/** Closes a dialog after its exit animation. */
export function closeDialog(dialog) {
  if (!dialog.open || dialog.classList.contains('closing')) return;
  if (motionOff()) return dialog.close();
  dialog.classList.add('closing');
  const done = () => {
    dialog.classList.remove('closing');
    dialog.close();
  };
  const timer = setTimeout(done, 400);
  dialog.addEventListener('animationend', () => { clearTimeout(timer); done(); }, { once: true });
}
