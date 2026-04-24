#!/usr/bin/env node
/**
 * Prisma data-classification linter — Session 6 §4.
 *
 * Convention: every scalar field in `packages/db/prisma/schema.prisma`
 * carries a triple-slash doc comment immediately above it of the form
 *
 *   /// @sensitivity:<public|internal|pii|secret>
 *
 * Multiple tags allowed (e.g. `pii,billing`). The first valid level
 * determines the classification.
 *
 * Run modes:
 *   node tools/check-classification.mjs            # warn, exit 0
 *   node tools/check-classification.mjs --strict   # fail on unannotated
 *
 * The strict mode is intended to land in CI once every field has
 * been classified; until then the warn mode tracks the deficit.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = join(dirname(__filename), "..");
const SCHEMA = join(ROOT, "packages", "db", "prisma", "schema.prisma");

const VALID_LEVELS = new Set(["public", "internal", "pii", "secret"]);

function parse() {
  const src = readFileSync(SCHEMA, "utf8");
  const lines = src.split("\n");
  const issues = [];
  const annotated = [];
  let inModel = null;
  let pendingDoc = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith("///")) {
      const tag = line.replace(/^\/\/\/\s*/, "");
      const m = tag.match(/@sensitivity:([a-z,]+)/);
      if (m) pendingDoc = m[1];
      continue;
    }

    const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
    if (modelMatch) {
      inModel = modelMatch[1];
      pendingDoc = null;
      continue;
    }
    if (line === "}" && inModel) {
      inModel = null;
      pendingDoc = null;
      continue;
    }
    if (!inModel) {
      pendingDoc = null;
      continue;
    }

    // Skip blank lines and block-level constraints.
    if (!line || line.startsWith("@@") || line.startsWith("//")) {
      pendingDoc = null;
      continue;
    }

    // A field looks like `name <Type>`; relations and id markers are
    // also fields but their classification matters too. Skip pure
    // relation lines (Type ends with `[]` or no scalar shape).
    const fieldMatch = line.match(/^(\w+)\s+(\w+)(\[\]|\?)?/);
    if (!fieldMatch) {
      pendingDoc = null;
      continue;
    }
    const fieldName = fieldMatch[1];
    const fieldType = fieldMatch[2];
    const isArray = fieldMatch[3] === "[]";

    // Skip array relations (`posts Post[]`) — they are not stored columns.
    if (isArray) {
      pendingDoc = null;
      continue;
    }
    const SCALARS = ["String", "Int", "BigInt", "Float", "Decimal", "Boolean", "DateTime", "Json", "Bytes"];
    const isScalar = SCALARS.includes(fieldType);
    // Anything else with a capitalised type and no `@relation` is an enum.
    const isEnum = /^[A-Z]/.test(fieldType) && !line.includes("@relation") && !isScalar;
    // Skip declared relations (`user User @relation(...)`).
    if (line.includes("@relation")) {
      pendingDoc = null;
      continue;
    }
    if (!isScalar && !isEnum) {
      pendingDoc = null;
      continue;
    }

    const qualified = `${inModel}.${fieldName}`;
    if (pendingDoc && pendingDoc.split(",").some((t) => VALID_LEVELS.has(t))) {
      annotated.push({ field: qualified, level: pendingDoc });
    } else {
      issues.push({ field: qualified, line: i + 1 });
    }
    pendingDoc = null;
  }

  return { issues, annotated };
}

const { issues, annotated } = parse();
const strict = process.argv.includes("--strict");

console.log(`prisma classification: ${annotated.length} fields annotated, ${issues.length} unannotated.`);
if (issues.length > 0) {
  console.log("\nUnannotated fields:");
  for (const { field, line } of issues) {
    console.log(`  ${field} (schema.prisma:${line})`);
  }
  console.log(
    "\nFix by adding `/// @sensitivity:<public|internal|pii|secret>` directly above the field."
  );
}
process.exit(strict && issues.length > 0 ? 1 : 0);
