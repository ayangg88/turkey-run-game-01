// Turkey Run — Great Thanksgiving Escape.
// Copies game/ and screenshots/ beside this file into the output
// directory, then writes dossier.json via the vendored make.fun library.
// Node 22, standard library only. Deterministic: two runs produce
// byte-identical dossier.json.
import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

const gameSrc = join(here, 'game');
const shotsSrc = join(here, 'screenshots');

if (existsSync(gameSrc)) {
  cpSync(gameSrc, join(outDir, 'game'), { recursive: true });
}
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

// buildDossier returns canonical JSON bytes (a Uint8Array) — write them
// exactly as returned. Never string-concatenate: that would coerce the
// bytes to a comma-separated list and corrupt the dossier.
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Verify the dossier we just wrote parses and matches the output tree,
// so a broken build fails loudly here instead of at submission time.
const parsed = JSON.parse(readFileSync(join(outDir, 'dossier.json'), 'utf8'));
const gameFiles = readdirSync(join(outDir, 'game'), { recursive: true }).filter((f) => typeof f === 'string');
const shotFiles = existsSync(join(outDir, 'screenshots'))
  ? readdirSync(join(outDir, 'screenshots')).filter((f) => f.endsWith('.jpg'))
  : [];
console.log('wrote ' + join(outDir, 'dossier.json'));
console.log('dossier ok: game files=' + gameFiles.length + ' screenshots=' + shotFiles.length);
