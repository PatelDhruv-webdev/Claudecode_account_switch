import chalk from 'chalk';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Pixel palette ─────────────────────────────────────────────────────────────
const OO = chalk.bgHex('#C97B5A')('  '); // orange body
const DD = chalk.bgHex('#2D1A0E')('  '); // dark eyes / buttons
const __ = '  ';                          // transparent (terminal bg shows through)

// ── Claude Code pixel robot — 6×6 pixels, 2 terminal chars per pixel ──────────
//    Each pixel is 2 chars wide so it appears squarish in monospace fonts.
//
//    Visual (O=orange, D=dark, _=empty):
//      _ O O O O _
//      _ O D O D _   ← eyes
//      _ O O O O _
//      O O O O O O
//      O O D D O O   ← belly buttons
//      _ O _ _ O _   ← legs
//
const BOT = [
  [__, OO, OO, OO, OO, __],
  [__, OO, DD, OO, DD, __],
  [__, OO, OO, OO, OO, __],
  [OO, OO, OO, OO, OO, OO],
  [OO, OO, DD, DD, OO, OO],
  [__, OO, __, __, OO, __],
];

const W_BOT = 12; // 6 pixels × 2 chars
const H_BOT = BOT.length;

// ── Helpers ───────────────────────────────────────────────────────────────────
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Move cursor up n lines, clear each line, reposition at top
function clearBlock(n) {
  process.stdout.write(`\x1b[${n}A`);
  for (let i = 0; i < n; i++) process.stdout.write('\x1b[2K\n');
  process.stdout.write(`\x1b[${n}A`);
}

const rowStr = row => row.join('');

// ── Banner ────────────────────────────────────────────────────────────────────
export async function showBanner() {
  if (!process.stdout.isTTY) return;
  const lines = [
    '',
    '  ' + chalk.bold.white('claude-accounts'),
    '  ' + chalk.dim('manage multiple claude code accounts'),
    '',
  ];
  for (const line of lines) {
    process.stdout.write(line + '\n');
    await sleep(60);
  }
}

// ── Merge animation ───────────────────────────────────────────────────────────
//
//  Phase 1 (20 frames): Two robots slide in from opposite edges with easing
//  Phase 2 (1 frame):   Robots touch — bodies form one continuous orange block
//  Phase 3 (1 frame):   Yellow flash fills the merged area
//  Phase 4 (3 frames):  Single centered robot appears (hold)
//
export async function showMergeAnimation() {
  if (!process.stdout.isTTY) return;

  const W = Math.min(process.stdout.columns || 80, 120);
  if (W < 36) return;

  const mid      = Math.floor(W / 2);
  const leftEnd  = mid - W_BOT;                // left robot final x  (right edge = mid)
  const rightEnd = mid;                         // right robot final x (left edge = mid)
  const rBegin   = Math.min(W - W_BOT, rightEnd + leftEnd); // symmetric start
  const singleX  = mid - Math.floor(W_BOT / 2);            // centered single robot

  const FRAMES = 20;

  // Reserve H_BOT lines so clearBlock works from frame 0
  process.stdout.write('\n'.repeat(H_BOT));

  for (let f = 0; f < FRAMES + 5; f++) {
    clearBlock(H_BOT);

    if (f >= FRAMES + 3) {
      // ── Hold: single centered robot ──────────────────────────────────────────
      for (const row of BOT)
        process.stdout.write(' '.repeat(singleX) + rowStr(row) + '\n');
      await sleep(f === FRAMES + 4 ? 600 : 80);

    } else if (f === FRAMES + 2) {
      // ── Single robot after flash ─────────────────────────────────────────────
      for (const row of BOT)
        process.stdout.write(' '.repeat(singleX) + rowStr(row) + '\n');
      await sleep(80);

    } else if (f === FRAMES + 1) {
      // ── Flash: bright yellow rectangle covers full merge area ─────────────────
      for (let i = 0; i < H_BOT; i++)
        process.stdout.write(
          ' '.repeat(leftEnd) + chalk.bgYellow(' '.repeat(W_BOT * 2)) + '\n'
        );
      await sleep(110);

    } else if (f === FRAMES) {
      // ── Robots touching: draw both side-by-side, bodies form one block ─────────
      for (const row of BOT)
        process.stdout.write(' '.repeat(leftEnd) + rowStr(row) + rowStr(row) + '\n');
      await sleep(70);

    } else {
      // ── Sliding ───────────────────────────────────────────────────────────────
      const t   = easeInOut(f / (FRAMES - 1));
      const lx  = Math.round(t * leftEnd);
      const rx  = Math.round(rBegin - t * (rBegin - rightEnd));
      const gap = Math.max(0, rx - lx - W_BOT);
      for (const row of BOT)
        process.stdout.write(
          ' '.repeat(lx) + rowStr(row) + ' '.repeat(gap) + rowStr(row) + '\n'
        );
      await sleep(f < 5 ? 65 : f < 13 ? 48 : 32);
    }
  }

  process.stdout.write('\n');
}
