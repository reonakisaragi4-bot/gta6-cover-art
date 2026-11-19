// Sol Marina Cover Maker — gta6-cover-art-01 entry program (Node 22, stdlib only).
// Hands the entry in: copies this repo's app/ and screenshots/ into the output
// directory and writes dossier.json there with the vendored make.fun library.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Inside the grader /output is the writable directory and the repo is read-only.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function handIn() {
  // Both runs must write the same bytes: buildDossier is deterministic over
  // the copied files, and this program adds nothing time-dependent of its own.
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
  mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  if (existsSync(join(repoRoot, 'screenshots'))) {
    cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  }
  // Gate caps from the kit's reference/gate.json: dossier text capped at
  // 160 KiB, at most 4 screenshots of 256 KiB each, app/ at most 993 files
  // and 48 MiB, paths at most 1000 bytes.
  writeFileSync(
    join(outputDir, 'dossier.json'),
    buildDossier(outputDir, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      app_max_files: 993,
      app_max_bytes: 50331648,
      app_path_max_bytes: 1000,
    }),
  );
}

handIn();
