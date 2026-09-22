import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, relative, extname } from "node:path";

/**
 * The entry-point taxonomy is retired in favour of the Cedar family, and the
 * impact product is Cedar Impact. The retired name is not allowed on any
 * surface a visitor or a crawler can reach — which is wider than page copy:
 * it was last found in a structured-data keyword list and in the Cedar chat's
 * intent corpus, both of which ship. The corpus ships twice over, in the
 * client bundle as well as the source, so this guard reads `dist/` too: a hit
 * there is a source hit that was missed.
 *
 * The category wording stays. "Economic impact analysis" is the search term
 * customers type and is the approved description of the method, so the guard
 * is the retired three-word name only.
 *
 * Hyphenated "economic-impact" is deliberately not matched. The one live
 * occurrence is a factual line in the founder's prior-work history on /team,
 * which is a biography rather than a product name.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RETIRED = /tribal\s+economic\s+impact/i;

/* Text only. A .webp or a font has no copy in it, and reading one as UTF-8
   just burns time. */
const TEXT = new Set([
  ".astro", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".css",
  ".html", ".xml", ".txt", ".svg", ".yml", ".yaml", "",
]);
const SKIP_DIRS = new Set(["node_modules", ".git", ".astro"]);

function* textFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      yield* textFiles(resolve(dir, entry.name));
      continue;
    }
    if (!entry.isFile()) continue;
    const full = resolve(dir, entry.name);
    if (!TEXT.has(extname(entry.name).toLowerCase())) continue;
    yield full;
  }
}

/* Search the whole file rather than line by line: `\s` covers a newline, and
   the phrase can be split across two lines by wrapped markup or a formatter. */
function hits(dir) {
  const found = [];
  for (const file of textFiles(dir)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(new RegExp(RETIRED.source, "gi"))) {
      const line = text.slice(0, match.index).split("\n").length;
      found.push(`${relative(ROOT, file)}:${line}`);
    }
  }
  return found;
}

test("the retired entry-point name is absent from src/", () => {
  const found = hits(resolve(ROOT, "src"));
  assert.deepEqual(found, [], `retired product name found in source: ${found.join(", ")}`);
});

test("the retired entry-point name is absent from the built output", (t) => {
  const dist = resolve(ROOT, "dist");
  if (!existsSync(dist) || !statSync(dist).isDirectory()) {
    /* Nothing built in this working copy. The deploy workflow builds before
       it tests, so this only skips locally. */
    t.skip("no dist/ in this working copy — build first to cover the output");
    return;
  }
  const found = hits(dist);
  assert.deepEqual(found, [], `retired product name shipped in dist/: ${found.join(", ")}`);
});

test("the guard can actually see the phrase it is looking for", () => {
  /* A guard that matches nothing passes forever, so pin the matcher itself.
     The fixtures are assembled from parts rather than written out, so that
     sweeping the repository for the retired name does not keep turning up
     this file and no one has to decide again whether it counts. */
  const parts = ["tribal", "economic", "impact"];
  assert.ok(RETIRED.test(parts.join(" ")));
  assert.ok(RETIRED.test(parts.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")));
  /* A line wrap in built HTML must not hide it. */
  assert.ok(RETIRED.test(`keywords: ${parts[0]}  ${parts[1]}\n${parts[2]}, policy`));
  /* The approved category wording stays, and so does the hyphenated compound
     in the founder's prior-work history. Neither may trip the guard. */
  assert.equal(RETIRED.test("economic impact analysis"), false);
  assert.equal(RETIRED.test(`${parts[0]} ${parts[1]}-${parts[2]} studies`), false);
  assert.equal(RETIRED.test("Tribal Nation economic analysis"), false);
});
