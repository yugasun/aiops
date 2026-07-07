#!/usr/bin/env node
// build-website-registry.js — Generate website/src/data/registry.generated.json from manifest
//
// Usage: node scripts/build/build-website-registry.js
// Curated bilingual copy lives in website/src/data/registry.i18n.ts

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT = path.join(ROOT, "website", "src", "data", "registry.generated.json");
const REPO = "yugasun/aiops";

const { loadManifest, loadSkill } = require("../lib/manifest");

const CATEGORY_ORDER = [
  "router",
  "alignment",
  "planning",
  "delivery",
  "quality",
  "design",
];

/** Website display category per skill name (overrides manifest role when needed). */
const SKILL_CATEGORY = {
  aiops: "router",
  "aiops-setup": "router",
  "aiops-implement": "delivery",
  explore: "alignment",
  grilling: "alignment",
  "grill-with-docs": "alignment",
  "domain-modeling": "alignment",
  "architect-design": "alignment",
  "improve-codebase-architecture": "alignment",
  "code-graph": "alignment",
  "to-prd": "planning",
  "to-issues": "planning",
  handoff: "planning",
  triage: "planning",
  tdd: "delivery",
  prototype: "delivery",
  "diagnosing-bugs": "delivery",
  gitops: "delivery",
  lean: "quality",
  "file-refactor": "quality",
  prune: "quality",
  review: "quality",
  "ui-mockup": "design",
};

/** Sort order within each category on the skills page. */
const SKILL_ORDER = {
  router: ["aiops", "aiops-setup"],
  alignment: [
    "grilling",
    "grill-with-docs",
    "domain-modeling",
    "architect-design",
    "explore",
    "improve-codebase-architecture",
    "code-graph",
  ],
  planning: ["to-prd", "to-issues", "handoff", "triage"],
  delivery: [
    "aiops-implement",
    "tdd",
    "prototype",
    "diagnosing-bugs",
    "gitops",
  ],
  quality: ["lean", "file-refactor", "prune", "review"],
  design: ["ui-mockup"],
};

const AGENT_OUTPUT_OVERRIDES = {
  architect: ["NOTES.md", "tech-spec.md"],
  "design-reviewer": ["DESIGN_REVIEW.md", "DRIFT_REPORT.md"],
  planner: ["PRD.md", "plan.md", "issues/"],
  prototyper: ["VERDICT.md", "prototype/"],
  builder: ["source code", "test files"],
  "ui-designer": ["mockups/", "design-notes.md"],
  "code-reviewer": ["REVIEW.md"],
  "quality-auditor": ["prune findings"],
  gitops: ["commit + push"],
};

const SEQUENCES = {
  Feature: [
    "architect",
    "design-reviewer",
    "planner",
    "builder",
    "code-reviewer",
    "quality-auditor",
    "gitops",
  ],
  "Feature + UI": [
    "architect",
    "ui-designer",
    "design-reviewer",
    "planner",
    "builder",
    "code-reviewer",
    "quality-auditor",
    "gitops",
  ],
  Bug: ["builder", "code-reviewer", "gitops"],
  Incoming: ["triage", "builder", "code-reviewer", "gitops"],
  Prototype: ["prototyper"],
  "Architecture health": [
    "architect",
    "design-reviewer",
    "planner",
    "builder",
    "code-reviewer",
    "quality-auditor",
    "gitops",
  ],
};

const ARTIFACTS = [
  {
    file: "NOTES.md",
    producer: "architect",
    consumers: ["design-reviewer", "planner", "builder", "code-reviewer"],
  },
  {
    file: "tech-spec.md",
    producer: "architect",
    consumers: ["design-reviewer", "planner", "builder", "code-reviewer"],
  },
  {
    file: "DESIGN_REVIEW.md",
    producer: "design-reviewer",
    consumers: ["planner", "architect"],
  },
  { file: "PRD.md", producer: "planner", consumers: ["builder"] },
  { file: "plan.md", producer: "planner", consumers: ["builder"] },
  { file: "issues/*.md", producer: "planner", consumers: ["builder"] },
  {
    file: "VERDICT.md",
    producer: "prototyper",
    consumers: ["architect", "builder"],
  },
  {
    file: "mockups/",
    producer: "ui-designer",
    consumers: ["builder", "code-reviewer"],
  },
  {
    file: "REVIEW.md",
    producer: "code-reviewer",
    consumers: ["builder", "quality-auditor", "gitops"],
  },
  {
    file: "DRIFT_REPORT.md",
    producer: "design-reviewer",
    consumers: ["builder", "gitops"],
  },
  {
    file: "prune findings",
    producer: "quality-auditor",
    consumers: ["builder"],
  },
];

function normalizeOutput(output) {
  return output
    .replace(/^\.scratch\/<feature>\//, "")
    .replace(/^\.scratch\/<slug>\//, "");
}

function skillCategory(name, role) {
  return SKILL_CATEGORY[name] || role || "alignment";
}

function packageVersion() {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
  ).version;
}

function normalizeTag(tag) {
  return (tag || "").replace(/^v/, "");
}

function githubHeaders() {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aiops-website-build",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubGet(pathname) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: githubHeaders(),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchLatestReleaseVersion() {
  const fallback = packageVersion();

  try {
    const release = await githubGet(`/repos/${REPO}/releases/latest`);
    const tag = normalizeTag(release.tag_name);
    if (tag) return tag;
  } catch (err) {
    if (!String(err.message).includes("HTTP 404")) {
      console.warn(`⚠ GitHub releases/latest: ${err.message}`);
    }
  }

  try {
    const tags = await githubGet(`/repos/${REPO}/tags?per_page=1`);
    const tag = normalizeTag(tags[0]?.name);
    if (tag) return tag;
  } catch (err) {
    console.warn(
      `⚠ GitHub version unavailable, using package.json v${fallback} (${err.message})`
    );
  }

  return fallback;
}

async function main() {
  const manifest = loadManifest(ROOT);
  const latestReleaseVersion = await fetchLatestReleaseVersion();

  const skills = (manifest.tier1 || []).map((entry) => {
    const skill = loadSkill(ROOT, entry.name);
    return {
      name: entry.name,
      category: skillCategory(entry.name, entry.role),
      role: entry.role,
      alwaysOn: !!entry.alwaysOn,
      descriptionEn: skill?.description || entry.name,
    };
  });

  // Validate category coverage
  for (const cat of CATEGORY_ORDER) {
    const order = SKILL_ORDER[cat] || [];
    for (const name of order) {
      if (!skills.find((s) => s.name === name)) {
        console.warn(`⚠ skill missing from manifest for category ${cat}: ${name}`);
      }
    }
  }

  const agents = (manifest.agents || []).map((agent) => ({
    name: agent.name,
    skills: agent.skills,
    role: agent.role,
    outputs:
      AGENT_OUTPUT_OVERRIDES[agent.name] ||
      (agent.outputs || []).map(normalizeOutput),
  }));

  const sequences = (manifest.dispatch || [])
    .filter((row) => SEQUENCES[row.taskType])
    .map((row) => ({
      taskType: row.taskType,
      agents: SEQUENCES[row.taskType],
    }));

  const payload = {
    manifestVersion: manifest.manifestVersion,
    version: manifest.version,
    latestReleaseVersion,
    generatedAt: new Date().toISOString(),
    categoryOrder: CATEGORY_ORDER,
    skillOrder: SKILL_ORDER,
    skills,
    tier2: (manifest.tier2Deferred || []).map((t) => t.name),
    agents,
    dispatch: manifest.dispatch || [],
    sequences,
    artifacts: ARTIFACTS,
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(
    `✓ registry.generated.json (${skills.length} skills, ${agents.length} agents, release v${latestReleaseVersion}) → ${OUTPUT}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
