"use strict";

const path = require("path");

const HOOK_SCRIPTS = [
  "aiops-activate.js",
  "aiops-graph.js",
  "aiops-subagent.js",
  "skill-paths.js",
  "strip-frontmatter.js",
];

const HOOK_CONFIG_TEMPLATES = {
  "claude-codex": "claude-codex-hooks.json",
};

function installHooks(fs, aiopsRoot, provider, isGlobal, hasDir, log) {
  if (!provider.hooksDir) {
    log.skip(`${provider.label} does not support hooks`);
    return;
  }

  const hooksSrcDir = path.join(aiopsRoot, "hooks");
  if (!hasDir(hooksSrcDir)) {
    log.skip("no hooks/ directory found");
    return;
  }

  const destHooksDir = isGlobal
    ? provider.hooksDir
    : path.resolve(provider.localHooksDir);

  fs.mkdirSync(destHooksDir, { recursive: true });

  for (const script of HOOK_SCRIPTS) {
    const src = path.join(hooksSrcDir, script);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(destHooksDir, script));
    }
  }

  const templateName = provider.hooksConfigTemplate
    ? HOOK_CONFIG_TEMPLATES[provider.hooksConfigTemplate]
    : null;

  if (!templateName) {
    log.ok(`hook scripts → ${log.dim(destHooksDir)} (no config — IDE does not use Claude hook format)`);
    return;
  }

  const hooksConfigSrc = path.join(hooksSrcDir, templateName);
  if (!fs.existsSync(hooksConfigSrc)) {
    log.skip(`hook config template missing: ${templateName}`);
    return;
  }

  let config = fs.readFileSync(hooksConfigSrc, "utf8");
  config = config.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, destHooksDir);
  const destConfig = isGlobal
    ? provider.hooksConfigFile
    : path.resolve(provider.localHooksConfigFile);
  fs.writeFileSync(destConfig, config, "utf8");
  log.ok(`hooks → ${log.dim(destConfig)}`);
}

function uninstallHooks(fs, provider, isGlobal, hasDir, log) {
  if (!provider.hooksDir) return;

  const destHooksDir = isGlobal
    ? provider.hooksDir
    : path.resolve(provider.localHooksDir);

  if (hasDir(destHooksDir)) {
    fs.rmSync(destHooksDir, { recursive: true, force: true });
    log.ok("removed hooks/");
  }

  if (!provider.hooksConfigFile) return;

  const destConfig = isGlobal
    ? provider.hooksConfigFile
    : path.resolve(provider.localHooksConfigFile);

  if (fs.existsSync(destConfig)) {
    fs.unlinkSync(destConfig);
    log.ok("removed hooks config");
  }
}

module.exports = { installHooks, uninstallHooks };
