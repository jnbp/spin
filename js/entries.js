// Turning the text box into wheel fields.

const WEIGHT = /\s+[*x×](\d{1,3})$/i;

/** "Sushi *2" -> { label: "Sushi", weight: 2 } */
export function parseEntries(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(WEIGHT);
      const weight = match ? Math.min(Math.max(parseInt(match[1], 10), 1), 100) : 1;
      const label = match ? line.slice(0, match.index).trim() : line;
      return { label: label || line, weight, line };
    });
}

/**
 * Builds the list of fields on the wheel.
 * Every entry appears weight × perEntry times. Copies are spread out so the
 * same entry never sits next to itself (when that is possible at all),
 * including across the seam between the last and the first field.
 */
export function buildFields(entries, perEntry, seed) {
  const rand = mulberry32(seed);
  // The greedy pass can paint itself into a corner at the very end; a few
  // attempts with different tie-breaks almost always find a clean ring.
  let best = null;
  for (let attempt = 0; attempt < 12; attempt++) {
    const fields = arrange(entries, perEntry, rand);
    const clashes = countClashes(fields);
    if (!best || clashes < best.clashes) best = { fields, clashes };
    if (clashes === 0) break;
  }
  return best ? best.fields : [];
}

function countClashes(fields) {
  if (fields.length < 2) return 0;
  let n = 0;
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].index === fields[(i + 1) % fields.length].index) n++;
  }
  return n;
}

function arrange(entries, perEntry, rand) {
  const pool = entries.map((e, index) => ({ index, label: e.label, left: e.weight * perEntry }));
  const total = pool.reduce((sum, p) => sum + p.left, 0);
  const fields = [];
  let prev = -1;

  for (let n = 0; n < total; n++) {
    const first = fields.length ? fields[0].index : -1;
    const remaining = total - n;
    // Candidates: entries with copies left that differ from the previous field.
    // On the last field also avoid matching the first one.
    let candidates = pool.filter((p) => p.left > 0 && p.index !== prev && !(remaining === 1 && p.index === first));
    if (!candidates.length) candidates = pool.filter((p) => p.left > 0 && p.index !== prev);
    if (!candidates.length) candidates = pool.filter((p) => p.left > 0);

    // Prefer entries with the most copies left; random tie-break keeps it lively.
    const max = Math.max(...candidates.map((p) => p.left));
    const top = candidates.filter((p) => p.left === max);
    // On a tie, use up copies of the first field's entry early so it does
    // not end up last, right next to itself across the seam.
    const pick = top.find((p) => p.index === first) || top[Math.floor(rand() * top.length)];
    pick.left--;
    prev = pick.index;
    fields.push({ index: pick.index, label: pick.label });
  }
  return fields;
}

/** Removes one entry (all of its copies) from the text box content. */
export function removeEntry(text, label) {
  const lines = text.split('\n');
  const at = lines.findIndex((line) => {
    const trimmed = line.trim();
    const match = trimmed.match(WEIGHT);
    const l = match ? trimmed.slice(0, match.index).trim() : trimmed;
    return l === label;
  });
  if (at === -1) return { text, line: null };
  const [line] = lines.splice(at, 1);
  return { text: lines.join('\n'), line: line.trim() };
}

export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
