"use strict";

const path = require("path");
const { getAdapter } = require("../adapters");

function compileAgent(provider, agent) {
  const adapter = getAdapter(provider.id);
  if (adapter.id === "default") {
    return adapter.compileAgent(agent, provider.agentFormat);
  }
  return adapter.compileAgent(agent);
}

function installAgents(fs, provider, agents, isGlobal, log) {
  const destDir = isGlobal
    ? provider.globalAgentsDir
    : path.resolve(provider.localAgentsDir);

  fs.mkdirSync(destDir, { recursive: true });

  for (const agent of agents) {
    const { filename, content } = compileAgent(provider, agent);
    fs.writeFileSync(path.join(destDir, filename), content, "utf8");
    log.ok(`${agent.name}${path.extname(filename)} → ${log.dim(destDir)}`);
  }
}

function uninstallAgents(fs, provider, agents, isGlobal, hasDir, log) {
  const destDir = isGlobal
    ? provider.globalAgentsDir
    : path.resolve(provider.localAgentsDir);

  if (!hasDir(destDir)) {
    log.skip(`${destDir} not found`);
    return;
  }

  for (const agent of agents) {
    const ext = provider.agentFormat === "toml" ? ".toml" : ".md";
    const filePath = path.join(destDir, `${agent.name}${ext}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log.ok(`removed ${agent.name}${ext}`);
    }
  }
}

module.exports = { installAgents, uninstallAgents, compileAgent };
