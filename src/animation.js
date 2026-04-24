import chalk from 'chalk';
// chalk auto-detects truecolor support via COLORTERM, FORCE_COLOR, and TTY.
// Modern terminals (iTerm2, macOS Terminal, VS Code) all report truecolor,
// so chalk.bgRgb() renders the exact hex values. 16-color terminals get the
// nearest ANSI approximation automatically.

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Claude Code exact palette ─────────────────────────────────────────────────
// Sampled from the official Claude Code pixel-art robot (#C97B5A body, #2A1207 shadows)
const OO = chalk.bgRgb(201, 123, 90)('  ');  // warm orange body
const DD = chalk.bgRgb(42,  18,  7)('  ');   // dark brown eyes / buttons
const __ = '  ';                              // transparent

// ── Claude Code pixel robot — 6 × 6 pixels, 2 terminal chars per pixel ────────
//
//   _OOOO_   head
//   _O▓O▓_   eyes (▓ = dark)
//   _OOOO_   chin
//   OOOOOO   body / shoulders
//   OO▓▓OO   belly with two dark buttons
//   _O__O_   legs
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

function clearBlock(n) {
  process.stdout.write(`\x1b[${n}A`);
  for (let i = 0; i < n; i++) process.stdout.write('\x1b[2K\n');
  process.stdout.write(`\x1b[${n}A`);
}

const rowStr = row => row.join('');

// ── Banner (minimal — animation IS the intro) ─────────────────────────────────
export async function showBanner() {
  if (!process.stdout.isTTY) return;
  process.stdout.write('\n');
  await sleep(80);
}

// ── Merge animation ───────────────────────────────────────────────────────────
//
//  Phase 1  (FRAMES frames) : two robots slide in from edges with ease-in-out
//  Phase 2  (1 frame)       : robots touch — bodies form one solid block
//  Phase 3  (1 frame)       : yellow flash fills the merged area
//  Phase 4  (3+ frames)     : final frame styled like the Claude Code startup:
//
//        [robot]  claude-accounts  v1.0.0
//                 manage multiple accounts
//
export async function showMergeAnimation() {
  if (!process.stdout.isTTY) return;

  const W = Math.min(process.stdout.columns || 80, 120);
  if (W < 36) return;

  const mid      = Math.floor(W / 2);
  const leftEnd  = mid - W_BOT;                // left robot's final x
  const rightEnd = mid;                         // right robot's final x
  const rBegin   = Math.min(W - W_BOT, rightEnd + leftEnd); // symmetric start

  // Final display: robot + title text side-by-side, centered as a unit
  const titleText = 'claude-accounts';
  const subText   = 'manage multiple accounts';
  const TITLE_LEN = 2 + titleText.length + 2 + '  v1.0.0'.length; // "  claude-accounts  v1.0.0"
  const totalW    = W_BOT + TITLE_LEN;
  const finalX    = Math.max(2, Math.floor((W - totalW) / 2));

  const FRAMES = 20;
  const TOTAL  = FRAMES + 6;

  process.stdout.write('\n'.repeat(H_BOT));

  for (let f = 0; f < TOTAL; f++) {
    clearBlock(H_BOT);

    if (f >= FRAMES + 3) {
      // ── Final: Claude Code-style display ─────────────────────────────────────
      //    row 1 (eyes) → title + version   row 3 (body) → subtitle
      for (let i = 0; i < H_BOT; i++) {
        let line = ' '.repeat(finalX) + rowStr(BOT[i]);
        if (i === 1) line += '  ' + chalk.bold.white(titleText) + chalk.dim('  v1.0.0');
        if (i === 3) line += '  ' + chalk.dim(subText);
        process.stdout.write(line + '\n');
      }
      await sleep(f === TOTAL - 1 ? 600 : 80);

    } else if (f === FRAMES + 2) {
      // ── Brief: single robot centered (confirm merge before repositioning) ─────
      const sX = mid - Math.floor(W_BOT / 2);
      for (const row of BOT)
        process.stdout.write(' '.repeat(sX) + rowStr(row) + '\n');
      await sleep(120);

    } else if (f === FRAMES + 1) {
      // ── Flash: yellow rectangle fills the full merge area ─────────────────────
      for (let i = 0; i < H_BOT; i++)
        process.stdout.write(
          ' '.repeat(leftEnd) +
          chalk.bgYellow(' '.repeat(W_BOT * 2)) +
          '\n'
        );
      await sleep(110);

    } else if (f === FRAMES) {
      // ── Touch: both robots side-by-side, bodies form one continuous block ──────
      for (const row of BOT)
        process.stdout.write(' '.repeat(leftEnd) + rowStr(row) + rowStr(row) + '\n');
      await sleep(70);

    } else {
      // ── Slide ─────────────────────────────────────────────────────────────────
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
