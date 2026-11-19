// Leonida Legend — the hand-in program for the GTA 6 trophy guide entry.
//
// What this program does: it takes the guide as built — the static app/ folder
// and the screenshots/ folder next to this file — and lays them out under the
// output directory the grader provides, then writes /output/dossier.json with
// the vendored make.fun library so the judge can read the entry. Nothing here
// touches the network; the library is standard-library Node 22 only.
//
// The guide itself is app/index.html, app/app.js, app/style.css and
// app/data/trophies.json (the 55 official trophies with a guide written for
// each one). vendor/makefun-frontend.ts is the kit's copy and stays untouched:
// the scorer rebuilds the dossier with its own copy and compares byte for byte.
//
// Local runs use MAKEFUN_OUTPUT_DIR instead of /output:
//   MAKEFUN_OUTPUT_DIR=/tmp/tg-out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// My own line, written for this entry: the output folder is created fresh,
// then the guide and its screenshots are copied in exactly as they stand.
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });
}

// The caps mirror the gate: at most 4 screenshots of 256 KiB each, app/ under
// 993 files and 48 MiB, and the dossier text capped at 160 KiB.
writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
