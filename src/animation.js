import chalk from 'chalk';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// Clear n lines and reposition cursor at the top of that block
function clearBlock(n) {
  process.stdout.write(`\x1b[${n}A`);
  for (let i = 0; i < n; i++) {
    process.stdout.write('\x1b[2K\n');
  }
  process.stdout.write(`\x1b[${n}A`);
}

function printBlock(lines) {
  for (const line of lines) {
    process.stdout.write(line + '\n');
  }
}

function center(str, width) {
  const pad = Math.max(0, width - str.length);
  const l = Math.floor(pad / 2);
  return ' '.repeat(l) + str + ' '.repeat(pad - l);
}

export async function showBanner() {
  if (!process.stdout.isTTY) return;

  const W = 45;
  const hr = '─'.repeat(W);

  const lines = [
    '',
    chalk.bold.cyan(`  ╭${hr}╮`),
    `  ${chalk.bold.cyan('│')}${chalk.bold.white(center('claude-accounts  v1.0.0', W))}${chalk.bold.cyan('│')}`,
    `  ${chalk.bold.cyan('│')}${chalk.dim(center('manage multiple claude code accounts', W))}${chalk.bold.cyan('│')}`,
    chalk.bold.cyan(`  ╰${hr}╯`),
    '',
  ];

  for (const line of lines) {
    process.stdout.write(line + '\n');
    await sleep(40);
  }
}

export async function showMergeAnimation() {
  if (!process.stdout.isTTY) return;

  const termW = Math.min(process.stdout.columns || 80, 100);
  const BOX_W = 12;   // visual width of each account box
  const MERGED_W = 26; // visual width of merged result box
  const BOX_H = 3;
  const FRAMES = 20;

  // Where the two boxes meet (touching, no gap)
  const leftFinal  = Math.floor(termW / 2) - BOX_W; // left box stops here
  const rightFinal = Math.floor(termW / 2);           // right box stops here
  const rightStart = Math.min(termW - BOX_W - 1, rightFinal + BOX_W + 6);
  const mergedX    = Math.max(0, Math.floor(termW / 2) - Math.floor(MERGED_W / 2));

  if (termW < 44) return; // too narrow, skip

  // ── Box artwork (each line is exactly BOX_W=12 visual chars) ──────────────
  // ◆ = U+25C6, │╭╰╮╯ are single-width box chars in all modern terminals
  const b1 = [
    chalk.cyan('╭──────────╮'),
    chalk.cyan('│') + chalk.bold.white('  ◆  #1   ') + chalk.cyan('│'),
    chalk.cyan('╰──────────╯'),
  ];
  const b2 = [
    chalk.cyan('╭──────────╮'),
    chalk.cyan('│') + chalk.bold.white('   #2  ◆  ') + chalk.cyan('│'),
    chalk.cyan('╰──────────╯'),
  ];

  // ── Merged box (exactly MERGED_W=26 visual chars) ─────────────────────────
  const mSpark = [
    chalk.yellow('╭────────────────────────╮'),
    chalk.yellow('│') + chalk.bold.yellow('  ✦  claude-accounts  ✦ ') + chalk.yellow('│'),
    chalk.yellow('╰────────────────────────╯'),
  ];
  const mDone = [
    chalk.green('╭────────────────────────╮'),
    chalk.green('│') + chalk.bold.white('  ◆  claude-accounts  ◆ ') + chalk.green('│'),
    chalk.green('╰────────────────────────╯'),
  ];

  // Reserve BOX_H lines so clearBlock works on the first frame too
  process.stdout.write('\n'.repeat(BOX_H));

  // ── Animation sequence ────────────────────────────────────────────────────
  // Phase A: slide in (FRAMES frames)
  // Phase B: spark flash
  // Phase C: merged (hold)

  for (let frame = 0; frame < FRAMES + 4; frame++) {
    clearBlock(BOX_H);

    if (frame >= FRAMES + 2) {
      // Merged — hold
      printBlock(mDone.map(l => ' '.repeat(mergedX) + l));
      await sleep(frame === FRAMES + 3 ? 400 : 80);

    } else if (frame === FRAMES + 1) {
      // Spark flash
      printBlock(mSpark.map(l => ' '.repeat(mergedX) + l));
      await sleep(110);

    } else if (frame === FRAMES) {
      // First merged frame right after boxes touch
      printBlock(mDone.map(l => ' '.repeat(mergedX) + l));
      await sleep(80);

    } else {
      // Sliding
      const t      = easeInOut(frame / (FRAMES - 1));
      const leftX  = Math.round(t * leftFinal);
      const rightX = Math.round(rightStart - t * (rightStart - rightFinal));
      const gap    = Math.max(0, rightX - leftX - BOX_W);

      printBlock(
        b1.map((line, row) =>
          ' '.repeat(leftX) + line + ' '.repeat(gap) + b2[row]
        )
      );
      await sleep(frame < 5 ? 65 : frame < 14 ? 45 : 30);
    }
  }

  process.stdout.write('\n');
}
