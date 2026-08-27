#!/usr/bin/env node
// Tailwind v3 read `prop-[--custom-property]` as an implicit var(). Tailwind v4
// does not - it emits the bare property name (e.g. `width:--sidebar-width`),
// which is invalid CSS and every browser silently drops. This exact gap has
// caused five separate bugs in this repo (dead accordion keyframes, tree-shaken
// easing tokens, overlays scaling from centre, an oversized h1, a collapsed
// sidebar). See docs/plans/2026-08-26-anim-audit/013-tailwind-v3-bracket-syntax.md.
//
// This scans src/ (not docs/, which uses the broken form as a documented
// example) for the bracket form and fails with a fix-it message.
// Run with: bun run lint (wired in via the `lint` script)

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const SRC_DIR = "src";
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);
// Matches `prop-[--custom-property]`, the broken v3 form. Deliberately does
// NOT match `prop-(--foo)` (parens - correct) or `prop-[var(--foo)]` (the
// bracket immediately holds `var(`, not `--` - also correct).
const BROKEN_PATTERN = /([\w-]+)-\[(--[\w-]+)\]/g;

// string -> string[] (absolute-ish file paths, relative to cwd)
function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return listSourceFiles(path);
    return SCAN_EXTENSIONS.has(extname(path)) ? [path] : [];
  });
}

// string -> { line: number, match: string, fix: string }[]
function findBrokenInstances(fileContents) {
  const lines = fileContents.split("\n");
  return lines.flatMap((lineText, index) => {
    const matches = [...lineText.matchAll(BROKEN_PATTERN)];
    return matches.map((m) => ({
      line: index + 1,
      match: m[0],
      fix: `${m[1]}-(${m[2]})`,
    }));
  });
}

function main() {
  const files = listSourceFiles(SRC_DIR);
  const violations = files.flatMap((path) =>
    findBrokenInstances(readFileSync(path, "utf8")).map((v) => ({ path, ...v })),
  );

  if (violations.length === 0) {
    console.log(`check-tailwind-v4-syntax: no v3 bracket-syntax classes in ${SRC_DIR}/`);
    return;
  }

  console.error(
    "Tailwind v4 does not read `prop-[--custom-property]` as var() - it emits the\n" +
      "bare property name, which browsers silently drop. Use the parenthesis form\n" +
      "instead: `prop-(--custom-property)`. Found:\n",
  );
  for (const v of violations) {
    console.error(`  ${v.path}:${v.line}  ${v.match}  ->  ${v.fix}`);
  }
  console.error(
    `\n${violations.length} instance(s). See docs/plans/2026-08-26-anim-audit/013-tailwind-v3-bracket-syntax.md`,
  );
  process.exit(1);
}

main();
