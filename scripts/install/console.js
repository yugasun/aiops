"use strict";

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const log = {
  msg: (m) => console.log(m),
  ok: (m) => console.log(`  ${c.green("✓")} ${m}`),
  skip: (m) => console.log(`  ${c.yellow("–")} ${m}`),
  fail: (m) => console.log(`  ${c.red("✗")} ${m}`),
  bold: c.bold,
  cyan: c.cyan,
  green: c.green,
  red: c.red,
  yellow: c.yellow,
  dim: c.dim,
};

module.exports = { log, c };
