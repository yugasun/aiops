#!/usr/bin/env node
// aiops — SessionStart hook: code graph freshness check
//
// Checks whether graphify-out/graph.json exists and is current.
// Emits a hint when the graph is stale or missing — advisory, never blocking.

"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── Check if we're in a git repo ──────────────────────────────────────────

function getGitHead() {
  try {
    return execSync("git rev-parse HEAD 2>/dev/null", { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// ─── Count nodes in graphify graph.json ────────────────────────────────────

function countNodes(graphPath) {
  try {
    const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
    if (Array.isArray(graph.nodes)) return graph.nodes.length;
    return null;
  } catch {
    return null;
  }
}

// ─── Get graph ref from graphify output ────────────────────────────────────

function getGraphRef(graphPath) {
  try {
    const graph = JSON.parse(fs.readFileSync(graphPath, "utf8"));
    // graphify format: graph.built_from_commit
    if (graph.graph && graph.graph.built_from_commit) {
      return graph.graph.built_from_commit;
    }
    // annotations fallback
    const annPath = path.resolve(".scratch/graph/annotations.json");
    if (fs.existsSync(annPath)) {
      const ann = JSON.parse(fs.readFileSync(annPath, "utf8"));
      if (ann.git_ref) return ann.git_ref;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

const graphPath = path.resolve("graphify-out/graph.json");

if (!fs.existsSync(graphPath)) {
  // No graph — emit advisory hint
  try {
    process.stdout.write(
      "## aiops — 代码图谱（可选）\n\n" +
      "未检测到代码图谱。如需架构分析增强，可安装 graphify：\n" +
      "```bash\nuv tool install graphifyy  # 或 pip install graphifyy\n```\n" +
      "其他 20 个 skill 无需任何额外依赖，正常使用。\n"
    );
  } catch {
    // Silent fail
  }
  process.exit(0);
}

// Graph exists — check freshness
const graphRef = getGraphRef(graphPath);
const currentHead = getGitHead();

if (!currentHead || !graphRef) {
  // Can't determine freshness — don't emit anything
  process.exit(0);
}

if (graphRef !== currentHead) {
  const nodeCount = countNodes(graphPath) || "?";
  try {
    process.stdout.write(
      "## aiops — code graph\n\n" +
      `Code graph is stale (built at \`${graphRef.slice(0, 8)}\`, ` +
      `current HEAD: \`${currentHead.slice(0, 8)}\`). ` +
      `${nodeCount} nodes indexed. Run \`/code-graph update\` to refresh ` +
      `(graphify incremental update with SHA256 caching).\n`
    );
  } catch {
    // Silent fail
  }
}
// Graph is fresh — emit nothing
