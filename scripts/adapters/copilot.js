"use strict";

/**
 * GitHub Copilot adapter — compiles skills to .github/copilot-instructions.md
 *
 * Always-on skills are concatenated into a single copilot-instructions.md file.
 * Other skills pass through as SKILL.md copies (existing behavior).
 */

const path = require("path");
const os = require("os");
const { stripFrontmatter, extractField } = require("./utils");
const { compileAgent: compileAgentMd } = require("./default");

/**
 * Compile an always-on skill into Copilot instructions format.
 *
 * Copilot uses a single .github/copilot-instructions.md file,
 * so multiple always-on skills are concatenated with section headers.
 *
 * @param {Object} skill - { name, content, description }
 * @returns {{ section: string, body: string }}
 */
function compileAlwaysOn(skill) {
  const body = stripFrontmatter(skill.content);
  const desc =
    skill.description ||
    extractField(skill.content, "description") ||
    skill.name;

  return {
    // Returned as a section to be merged into the single copilot-instructions.md
    section: `## ${desc}\n\n${body}`,
    body,
    // For standalone file output (when only one always-on skill exists)
    filename: "copilot-instructions.md",
    content: `# Copilot Instructions\n\n## ${desc}\n\n${body}\n`,
  };
}

/**
 * Compile multiple always-on skills into a single copilot-instructions.md.
 *
 * @param {Object[]} skills - Array of { name, content, description }
 * @returns {{ filename: string, content: string }}
 */
function compileAllAlwaysOn(skills) {
  const sections = skills.map((s) => {
    const result = compileAlwaysOn(s);
    return result.section;
  });

  return {
    filename: "copilot-instructions.md",
    content: `# Copilot Instructions\n\n${sections.join("\n\n---\n\n")}\n`,
  };
}

/**
 * Compile a regular skill. Passthrough.
 */
function compileSkill(skill) {
  return {
    filename: `${skill.name}/SKILL.md`,
    content: skill.content,
  };
}

/**
 * Compile an agent. Copilot uses same md-yaml format.
 */
function compileAgent(agent) {
  return compileAgentMd(agent, "md-yaml");
}

// ─── Adapter export ────────────────────────────────────────────────────────

module.exports = {
  id: "copilot",

  /** Copilot uses a single instructions file at this path */
  instructionsFile: {
    global: path.join(os.homedir(), ".github", "copilot-instructions.md"),
    local: ".github/copilot-instructions.md",
  },

  compileAlwaysOn,
  compileAllAlwaysOn,
  compileSkill,
  compileAgent,

  /**
   * Install all always-on skills — compiles into single copilot-instructions.md.
   * @param {Object[]} skills - [{ name, content, description }]
   * @param {{ isGlobal: boolean }} options
   */
  installAlwaysOn(skills, { isGlobal }) {
    const fs = require("fs");
    const compiled = compileAllAlwaysOn(skills);
    const filePath = isGlobal
      ? this.instructionsFile.global
      : path.resolve(this.instructionsFile.local);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, compiled.content, "utf8");
    return filePath;
  },
};
