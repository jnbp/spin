// Remembering the wheel in this browser, and packing it into a share link.

const KEY = 'spin:v2';

export const DEFAULTS = {
  entries: '',
  perEntry: 1,
  duration: 5,
  physics: 'medium',
  sound: true,
  confetti: true,
  autoRemove: false,
  theme: 'auto',
  lang: null,
  seed: 1,
  removed: [],
  history: [],
};

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode or storage full: the wheel still works, it just forgets */
  }
}

// Only the wheel itself goes into a link, never history or appearance.
const SHARED = ['entries', 'perEntry', 'duration', 'physics', 'seed'];

export function toHash(state) {
  const data = Object.fromEntries(SHARED.map((k) => [k, state[k]]));
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return '#w=' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromHash(hash) {
  const match = hash.match(/^#w=([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  try {
    const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '==='.slice((b64.length + 3) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const data = JSON.parse(new TextDecoder().decode(bytes));
    return Object.fromEntries(SHARED.filter((k) => k in data).map((k) => [k, data[k]]));
  } catch {
    return null;
  }
}
