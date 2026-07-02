"use strict";

/**
 * Default adapter — passthrough skills, md-yaml / toml agent compilation.
 * Used when no IDE-specific adapter is registered.
 */

function compileMdYaml(agent) {
  const content = `---
name: ${agent.name}
description: "${agent.description}"
---

${agent.content}`;
  return { filename: `${agent.name}.md`, content };
}

function compileToml(agent) {
  const escaped = agent.content.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const content = `name = "${agent.name}"
description = "${agent.description}"
developer_instructions = """
${agent.content}
"""
`;
  return { filename: `${agent.name}.toml`, content };
}

/**
 * @param {object} agent - { name, content, description }
 * @param {"md-yaml"|"toml"} [format]
 */
function compileAgent(agent, format = "md-yaml") {
  return format === "toml" ? compileToml(agent) : compileMdYaml(agent);
}

function compileSkill(skill) {
  return {
    filename: `${skill.name}/SKILL.md`,
    content: skill.content,
  };
}

module.exports = {
  id: "default",
  compileAgent,
  compileSkill,
  compileMdYaml,
  compileToml,
};
