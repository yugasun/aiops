"use strict";

/**
 * Cursor adapter — compiles skills to .cursor/rules/*.mdc format
 *
 * Always-on skills (e.g. lean) become .mdc files with alwaysApply: true.
 * Other skills pass through as SKILL.md copies (existing behavior).
 *
 * Also exports createMdcAdapter() factory for any IDE that uses the
 * .mdc format with alwaysApply: true (e.g. Windsurf).
 */

const path = require("path");
const os = require("os");
const { stripFrontmatter, extractField } = require("./utils");

/**
 * Compile an always-on skill into .mdc format.
 *
 * @param {Object} skill - { name, content, description }
 * @returns {{ filename: string, content: string }}
 */
function compileAlwaysOn(skill) {
  const body = stripFrontmatter(skill.content);
  const desc =
    skill.description ||
    extractField(skill.content, "description") ||
    `${skill.name} discipline`;

  // .mdc frontmatter — alwaysApply: true makes it inject every turn
  const mdc = `---
description: ${desc}
globs:
alwaysApply: true
---

${body}`;

  return {
    filename: `${skill.name}.mdc`,
    content: mdc,
  };
}

/**
 * Compile a regular (non-always-on) skill. Passthrough — returns SKILL.md as-is.
 *
 * @param {Object} skill - { name, content, description }
 * @returns {{ filename: string, content: string }}
 */
function compileSkill(skill) {
  return {
    filename: `${skill.name}/SKILL.md`,
    content: skill.content,
  };
}

/**
 * Compile an agent definition. Uses markdown with YAML frontmatter.
 *
 * @param {Object} agent - { name, content, description }
 * @returns {{ filename: string, content: string }}
 */
function compileAgent(agent) {
  const content = `---
name: ${agent.name}
description: "${agent.description}"
---

${agent.content}`;

  return {
    filename: `${agent.name}.md`,
    content,
  };
}

/**
 * Factory: create an adapter for any IDE that uses .mdc format.
 * Cursor and Windsurf share the same compilation logic; only
 * the rulesDir differs.
 *
 * @param {string} id - Provider identifier (e.g. "cursor", "windsurf")
 * @param {string} dirName - IDE directory name (e.g. ".cursor", ".windsurf")
 * @returns {Object} adapter module
 */
function createMdcAdapter(id, dirName) {
  return {
    id,
    rulesDir: {
      global: path.join(os.homedir(), dirName, "rules"),
      local: `${dirName}/rules`,
    },
    compileAlwaysOn,
    compileSkill,
    compileAgent,

    /**
     * Install all always-on skills — writes one .mdc per skill to rulesDir.
     * @param {Object[]} skills - [{ name, content, description }]
     * @param {{ isGlobal: boolean }} options
     */
    installAlwaysOn(skills, { isGlobal }) {
      const fs = require("fs");
      const rulesDir = isGlobal
        ? this.rulesDir.global
        : path.resolve(this.rulesDir.local);
      fs.mkdirSync(rulesDir, { recursive: true });
      for (const skill of skills) {
        const compiled = compileAlwaysOn(skill);
        fs.writeFileSync(
          path.join(rulesDir, compiled.filename),
          compiled.content,
          "utf8"
        );
      }
      return rulesDir;
    },
  };
}

// ─── Default Cursor adapter ─────────────────────────────────────────────────

module.exports = {
  ...createMdcAdapter("cursor", ".cursor"),
  createMdcAdapter,
};
