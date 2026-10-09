// Drawing and spinning the wheel. The pointer sits on the right (3 o'clock).

const TAU = Math.PI * 2;
const POINTER = 0;
const BRAKE_MS = 700;

const EASING = {
  linear: (x) => x,
  medium: (x) => 1 - Math.pow(1 - x, 3),
  heavy: (x) => 1 - Math.pow(1 - x, 5),
  // Very long tail: looks like it stops, then creeps over one more field.
  crawl: (x) => 1 - Math.pow(1 - x, 7),
};

export class Wheel {
  constructor(canvas, { onTick } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.fields = [];
    this.rotation = 0;
    this.spinning = false;
    this.onTick = onTick || (() => {});
    this.size = 0;
    this.emptyText = '';
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
  }

  setFields(fields) {
    this.fields = fields;
    this.draw();
  }

  setEmptyText(text) {
    this.emptyText = text;
    this.draw();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const size = Math.round(Math.min(rect.width, rect.height));
    if (!size) return;
    this.size = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  /** Index of the field currently under the pointer. */
  indexAtPointer(rotation = this.rotation) {
    const n = this.fields.length;
    if (!n) return -1;
    const rel = (((POINTER - rotation) % TAU) + TAU) % TAU;
    return Math.min(Math.floor(rel / (TAU / n)), n - 1);
  }

  /**
   * Turns the wheel by `delta` radians without picking anything, for
   * feedback such as shuffling or the entrance on page load.
   */
  nudge(delta, ms = 700) {
    if (this.spinning) return;
    const id = (this.motionId = (this.motionId || 0) + 1);
    const start = this.rotation;
    const t0 = performance.now();
    const frame = (now) => {
      if (id !== this.motionId || this.spinning) return;
      const p = Math.min((now - t0) / ms, 1);
      this.rotation = start + delta * (1 - Math.pow(1 - p, 3));
      this.draw();
      if (p < 1) requestAnimationFrame(frame);
      else this.rotation %= TAU;
    };
    requestAnimationFrame(frame);
  }

  /**
   * Spins to a random field. The winner is drawn first (every field equally
   * likely), then the wheel is steered to land well inside that field.
   */
  spin({ duration = 5, physics = 'medium' } = {}) {
    if (this.spinning || !this.fields.length) return Promise.resolve(null);
    this.motionId = (this.motionId || 0) + 1; // stop any nudge in progress
    const n = this.fields.length;
    const arc = TAU / n;
    const winner = Math.floor(Math.random() * n);
    const within = 0.15 + Math.random() * 0.7;
    const desired = POINTER - (winner + within) * arc;
    const start = this.rotation;
    const delta = (((desired - start) % TAU) + TAU) % TAU;
    const turns = Math.max(3, Math.round(duration * 1.2));
    const target = start + turns * TAU + delta;

    let mode = physics;
    if (mode === 'random') {
      const r = Math.random();
      mode = r < 0.4 ? 'heavy' : r < 0.75 ? 'medium' : 'crawl';
    }
    const ease = EASING[mode] || EASING.medium;
    const ms = duration * 1000;

    this.spinning = true;
    this.cancelRequested = false;
    let lastIndex = this.indexAtPointer();
    const t0 = performance.now();
    let brake = null;
    let prev = { time: t0, rotation: start };
    let velocity = 0; // radians per ms

    return new Promise((resolve) => {
      const finish = (result) => {
        this.rotation %= TAU;
        this.spinning = false;
        this.draw();
        resolve(result);
      };

      const frame = (now) => {
        if (this.cancelRequested && !brake) {
          // Brake smoothly from the current speed instead of freezing.
          brake = { t0: now, from: this.rotation, distance: (velocity * BRAKE_MS) / 2 };
        }

        let done;
        if (brake) {
          const p = Math.min((now - brake.t0) / BRAKE_MS, 1);
          this.rotation = brake.from + brake.distance * (1 - (1 - p) * (1 - p));
          done = p >= 1;
        } else {
          const p = Math.min((now - t0) / ms, 1);
          this.rotation = start + (target - start) * ease(p);
          done = p >= 1;
        }

        if (now > prev.time) velocity = (this.rotation - prev.rotation) / (now - prev.time);
        prev = { time: now, rotation: this.rotation };

        const index = this.indexAtPointer();
        if (index !== lastIndex) {
          lastIndex = index;
          this.onTick();
        }
        this.draw();

        if (!done) requestAnimationFrame(frame);
        else finish(brake ? null : this.indexAtPointer());
      };
      requestAnimationFrame(frame);
    });
  }

  /** Stops the current spin without a result. */
  cancel() {
    if (this.spinning) this.cancelRequested = true;
  }

  draw() {
    const { ctx, size } = this;
    if (!size) return;
    const css = getComputedStyle(this.canvas);
    const c = size / 2;
    const r = c - 4;
    ctx.clearRect(0, 0, size, size);

    if (!this.fields.length) {
      ctx.beginPath();
      ctx.arc(c, c, r, 0, TAU);
      ctx.fillStyle = css.getPropertyValue('--wheel-empty').trim();
      ctx.fill();
      ctx.setLineDash([6, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = css.getPropertyValue('--line').trim();
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }

    const palette = [];
    for (let i = 1; i <= 8; i++) palette.push(css.getPropertyValue(`--seg-${i}`).trim());
    const text = css.getPropertyValue('--seg-text').trim();
    const edge = css.getPropertyValue('--seg-edge').trim();
    const font = css.getPropertyValue('--font-display').trim();

    const n = this.fields.length;
    const arc = TAU / n;
    const hub = r * 0.2;

    // Label size follows the room each field has.
    const chord = 2 * r * 0.72 * Math.sin(arc / 2);
    const fontSize = Math.max(Math.min(chord * 0.5, r * 0.085, 30), 9);
    const showLabels = chord >= 10;
    const maxWidth = r - hub - r * 0.12;

    // Neighbouring fields of different entries can share a palette colour when
    // there are more entries than colours; nudge to the next colour if so.
    const colors = this.fields.map((f) => f.index % palette.length);
    for (let i = 0; i < n; i++) {
      const before = colors[(i - 1 + n) % n];
      const after = i === n - 1 ? colors[0] : -1;
      if (n > 1 && (colors[i] === before || colors[i] === after) && this.fields[i].index !== this.fields[(i - 1 + n) % n].index) {
        colors[i] = (colors[i] + 3) % palette.length;
      }
    }

    this.fields.forEach((field, i) => {
      const a0 = this.rotation + i * arc;
      ctx.beginPath();
      ctx.moveTo(c, c);
      ctx.arc(c, c, r, a0, a0 + arc);
      ctx.closePath();
      ctx.fillStyle = palette[colors[i]];
      ctx.fill();
      if (n <= 240) {
        ctx.lineWidth = n > 80 ? 0.75 : 1.5;
        ctx.strokeStyle = edge;
        ctx.stroke();
      }

      if (!showLabels) return;
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(a0 + arc / 2);
      ctx.fillStyle = text;
      ctx.font = `600 ${fontSize}px ${font}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fit(ctx, field.label, maxWidth), r - r * 0.07, 0);
      ctx.restore();
    });

    // Outer rim
    ctx.beginPath();
    ctx.arc(c, c, r, 0, TAU);
    ctx.lineWidth = 3;
    ctx.strokeStyle = edge;
    ctx.stroke();
  }
}

function fit(ctx, label, max) {
  if (ctx.measureText(label).width <= max) return label;
  let lo = 0;
  let hi = label.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(label.slice(0, mid) + '…').width <= max) lo = mid;
    else hi = mid - 1;
  }
  return label.slice(0, lo).trimEnd() + '…';
}
