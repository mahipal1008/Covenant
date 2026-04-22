import test from "node:test";
import assert from "node:assert/strict";
import { main } from "./index";

/**
 * CLI smoke tests — exercise the argv router without making real HTTP
 * calls. The `version` and `help` paths don't touch the network.
 */

test("version prints and returns 0", async () => {
  const writes: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  try {
    const code = await main(["version"]);
    assert.equal(code, 0);
    assert.match(writes.join(""), /covenant 0\.1\.0/);
  } finally {
    process.stdout.write = original;
  }
});

test("help prints and returns 0", async () => {
  const writes: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    writes.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  try {
    const code = await main([]);
    assert.equal(code, 0);
    assert.match(writes.join(""), /Usage:/);
  } finally {
    process.stdout.write = original;
  }
});

test("unknown command returns exit code 2", async () => {
  const errs: string[] = [];
  const stdouts: string[] = [];
  const oerr = process.stderr.write.bind(process.stderr);
  const oout = process.stdout.write.bind(process.stdout);
  process.stderr.write = ((c: string | Uint8Array): boolean => {
    errs.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
    return true;
  }) as typeof process.stderr.write;
  process.stdout.write = ((c: string | Uint8Array): boolean => {
    stdouts.push(typeof c === "string" ? c : Buffer.from(c).toString("utf8"));
    return true;
  }) as typeof process.stdout.write;
  try {
    const code = await main(["bogus"]);
    assert.equal(code, 2);
    assert.match(errs.join(""), /unknown command/);
  } finally {
    process.stderr.write = oerr;
    process.stdout.write = oout;
  }
});

console.log("cli tests complete");
