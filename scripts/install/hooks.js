"use strict";

const path = require("path");
const {
  mergeHooksConfig,
  stripAiopsHooks,
  parseHooksConfig,
  isEmptyHooksConfig,
} = require("./hooks-merge");

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

function readExistingHooksConfig(fs, destConfig) {
  if (!fs.existsSync(destConfig)) return null;
  const raw = fs.readFileSync(destConfig, "utf8");
  return parseHooksConfig(raw);
}

function writeHooksConfig(fs, destConfig, config) {
  fs.writeFileSync(destConfig, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

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

  let templateRaw = fs.readFileSync(hooksConfigSrc, "utf8");
  templateRaw = templateRaw.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, destHooksDir);
  const incoming = parseHooksConfig(templateRaw);

  const destConfig = isGlobal
    ? provider.hooksConfigFile
    : path.resolve(provider.localHooksConfigFile);

  let existing = null;
  if (fs.existsSync(destConfig)) {
    try {
      existing = readExistingHooksConfig(fs, destConfig);
    } catch (err) {
      const backupPath = `${destConfig}.bak.${Date.now()}`;
      fs.copyFileSync(destConfig, backupPath);
      log.warn(
        `could not parse ${destConfig}; backed up to ${log.dim(backupPath)} (${err.message})`
      );
    }
  }

  const merged = mergeHooksConfig(existing, incoming);
  writeHooksConfig(fs, destConfig, merged);
  log.ok(`hooks merged → ${log.dim(destConfig)}`);
}

function uninstallHooks(fs, provider, isGlobal, hasDir, log) {
  if (!provider.hooksDir) return;

  const destHooksDir = isGlobal
    ? provider.hooksDir
    : path.resolve(provider.localHooksDir);

  if (hasDir(destHooksDir)) {
    for (const script of HOOK_SCRIPTS) {
      const filePath = path.join(destHooksDir, script);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.ok(`removed hooks/${script}`);
      }
    }
  }

  if (!provider.hooksConfigFile) return;

  const destConfig = isGlobal
    ? provider.hooksConfigFile
    : path.resolve(provider.localHooksConfigFile);

  if (!fs.existsSync(destConfig)) return;

  try {
    const existing = readExistingHooksConfig(fs, destConfig);
    const stripped = stripAiopsHooks(existing);
    if (isEmptyHooksConfig(stripped)) {
      fs.unlinkSync(destConfig);
      log.ok("removed hooks config (no remaining entries)");
    } else {
      writeHooksConfig(fs, destConfig, stripped);
      log.ok("removed aiops hook entries (preserved your hooks)");
    }
  } catch (err) {
    log.warn(`could not update ${destConfig}; left unchanged (${err.message})`);
  }
}

module.exports = { installHooks, uninstallHooks, HOOK_SCRIPTS };
