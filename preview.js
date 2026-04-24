// Generates preview.html — a pixel-perfect terminal simulation of the animation
import fs from 'fs';

// ── Robot pixel map (same as animation.js) ────────────────────────────────────
const O = 'o';  // orange #C97B5A
const D = 'd';  // dark   #2A1207
const _ = '_';  // empty

const BOT = [
  [_, O, O, O, O, _],
  [_, O, D, O, D, _],
  [_, O, O, O, O, _],
  [O, O, O, O, O, O],
  [O, O, D, D, O, O],
  [_, O, _, _, O, _],
];

const W_BOT  = 12;  // 6 pixels × 2 chars
const H_BOT  = BOT.length;
const FRAMES = 20;

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// ── HTML pixel helpers ────────────────────────────────────────────────────────
const COLORS = { o: '#C97B5A', d: '#2A1207', f: '#FFD700' };

function px(type) {
  if (type === '_') return '<span class="e"> &nbsp;</span>';
  return `<span class="p ${type}"> &nbsp;</span>`;
}

function sp(n) { return n > 0 ? `<span class="s" style="width:${n}ch"></span>` : ''; }

function robotRow(row) { return row.map(px).join(''); }

// ── Frame renderers ───────────────────────────────────────────────────────────
function twoRobots(lx, rx) {
  const gap = Math.max(0, rx - lx - W_BOT);
  return BOT.map(row =>
    `${sp(lx)}${robotRow(row)}${sp(gap)}${robotRow(row)}`
  );
}

function touchFrame() {
  return BOT.map(row =>
    `${sp(leftEnd)}${robotRow(row)}${robotRow(row)}`
  );
}

function flashFrame() {
  const fl = `<span class="p f" style="width:${W_BOT * 2}ch"> &nbsp;</span>`;
  return Array(H_BOT).fill(`${sp(leftEnd)}${fl}`);
}

function singleRobot(x) {
  return BOT.map(row => `${sp(x)}${robotRow(row)}`);
}

function finalFrame() {
  return BOT.map((row, i) => {
    let line = `${sp(finalX)}${robotRow(row)}`;
    if (i === 1) line += `<span class="gap"></span><b class="title">claude-accounts</b><span class="ver">  v1.0.0</span>`;
    if (i === 3) line += `<span class="gap"></span><span class="sub">manage multiple accounts</span>`;
    return line;
  });
}

// ── Frame positions for W=80 terminal ─────────────────────────────────────────
const W      = 80;
const mid    = Math.floor(W / 2);          // 40
const leftEnd  = mid - W_BOT;             // 28
const rightEnd = mid;                      // 40
const rBegin   = Math.min(W - W_BOT, rightEnd + leftEnd); // 68
const singleX  = mid - Math.floor(W_BOT / 2); // 34

const TITLE_LEN = 2 + 'claude-accounts'.length + '  v1.0.0'.length; // 27
const finalX    = Math.max(2, Math.floor((W - W_BOT - TITLE_LEN) / 2)); // 20

function frameAt(f) {
  const t  = easeInOut(f / (FRAMES - 1));
  const lx = Math.round(t * leftEnd);
  const rx = Math.round(rBegin - t * (rBegin - rightEnd));
  return twoRobots(lx, rx);
}

// ── Build frames list ─────────────────────────────────────────────────────────
const frames = [
  { label: 'Frame 1 — Two robots start from edges', rows: frameAt(0) },
  { label: 'Frame 5 — Sliding inward', rows: frameAt(4) },
  { label: 'Frame 10 — Halfway', rows: frameAt(9) },
  { label: 'Frame 17 — Almost touching', rows: frameAt(16) },
  { label: 'Frame 21 — Bodies merge (one solid block)', rows: touchFrame() },
  { label: 'Frame 22 — Yellow flash ✦', rows: flashFrame() },
  { label: 'Frame 23 — Single robot (centered)', rows: singleRobot(singleX) },
  { label: 'Frame 25 — Final: Claude Code–style display', rows: finalFrame() },
  {
    label: 'Then setup prompts appear below ↓',
    rows: [],
    isPrompt: true,
  },
];

// ── Terminal block HTML ───────────────────────────────────────────────────────
function terminalBlock(label, rows, isPrompt = false) {
  const rowsHtml = isPrompt
    ? `
      <div class="pline"><span class="arrow">  → </span><span class="out">Searching for Claude Code binary...</span></div>
      <div class="pline"><span class="ok">  ✓ </span><span class="out">Found: /usr/local/bin/claude</span></div>
      <div class="pline"> </div>
      <div class="pline"><span class="prompt">  ? </span><span class="ask">Name for account 1 (e.g. "personal"):</span> <span class="inp">personal</span></div>
      <div class="pline"><span class="prompt">  ? </span><span class="ask">Name for account 2 (e.g. "work"):</span> <span class="inp">work</span></div>
      <div class="pline"> </div>
      <div class="pline"><span class="ok">  ✓ </span><span class="out">Setup complete!</span></div>
      <div class="pline"> </div>
      <div class="pline"><span class="ok">  ✓ </span><span class="col">claude-personal</span><span class="dim">  →  ~/.claude-accounts/personal</span></div>
      <div class="pline"><span class="ok">  ✓ </span><span class="col">claude-work</span><span class="dim">  →  ~/.claude-accounts/work</span></div>
      <div class="pline"> </div>
      <div class="pline"><span class="arrow">  → </span><span class="out">Shell aliases written to: <b>~/.zshrc</b></span></div>
      <div class="pline"> </div>
      <div class="pline"><span class="dim">    1. Reload your shell:      source ~/.zshrc</span></div>
      <div class="pline"><span class="dim">    2. Authenticate account 1: claude-personal   then run  /login</span></div>
      <div class="pline"><span class="dim">    3. Authenticate account 2: claude-work   then run  /login</span></div>
      <div class="pline"><span class="dim">    4. Code in parallel:       open two terminal tabs!</span></div>
`
    : rows.map(r => `<div class="r">${r}</div>`).join('\n');

  return `
  <p class="lbl">${label}</p>
  <div class="terminal">
    <div class="bar">
      <span class="dot rc"></span><span class="dot yc"></span><span class="dot gc"></span>
      <span class="bname">zsh — 80×24</span>
    </div>
    <pre class="body">${rowsHtml}</pre>
  </div>`;
}

const blocksHtml = frames.map(f =>
  terminalBlock(f.label, f.rows, f.isPrompt)
).join('\n');

// ── Full HTML ──────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>claude-accounts — terminal animation preview</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #0e0e0e;
    color: #ccc;
    font-family: 'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', monospace;
    font-size: 13px;
    line-height: 20px;
    padding: 32px;
  }

  h1 { color: #eee; font-size: 18px; font-weight: 600; margin-bottom: 6px; }
  .subtitle { color: #555; font-size: 12px; margin-bottom: 40px; }

  .lbl {
    color: #555;
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin: 28px 0 8px;
  }

  .terminal {
    background: #1c1c1c;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,0.7);
    max-width: 700px;
  }

  .bar {
    background: #2c2c2c;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    border-bottom: 1px solid #222;
  }
  .dot  { width: 12px; height: 12px; border-radius: 50%; display: inline-block; }
  .rc   { background: #ff5f57; }
  .yc   { background: #febc2e; }
  .gc   { background: #28c840; }
  .bname { color: #555; font-size: 11px; margin-left: 10px; }

  pre.body {
    padding: 18px 20px;
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    line-height: 20px;
    white-space: pre;
    overflow-x: auto;
  }

  /* Robot pixel cells — each "pixel" is 2 chars wide × 1 line tall */
  .r   { height: 20px; }
  .p   { display: inline-block; width: 2ch; }
  .e   { display: inline-block; width: 2ch; }          /* empty/transparent */
  .s   { display: inline-block; }                       /* spacer */
  .o   { background: #C97B5A; }                         /* Claude orange */
  .d   { background: #2A1207; }                         /* dark eyes */
  .f   { display: inline-block; background: #FFD700; }  /* flash yellow */
  .gap { display: inline-block; width: 2ch; }

  /* Setup output text */
  .pline { height: 20px; }
  .arrow { color: #4ec9b0; }
  .ok    { color: #89d185; }
  .dim   { color: #555; }
  .out   { color: #ccc; }
  .ask   { color: #ccc; }
  .inp   { color: #e5c07b; }
  .col   { color: #4ec9b0; }
  .prompt { color: #c678dd; }
  .title { color: #ffffff; font-weight: bold; font-style: normal; }
  .ver   { color: #555; }
  .sub   { color: #555; }
</style>
</head>
<body>

<h1>claude-accounts — animation preview</h1>
<p class="subtitle">
  What you see when you run <code>claude-accounts setup</code> in a truecolor terminal
  (macOS Terminal · iTerm2 · VS Code · Windows Terminal)
</p>

${blocksHtml}

</body>
</html>`;

fs.writeFileSync('preview.html', html);
console.log('Generated preview.html — open in browser to see the exact terminal output.');
