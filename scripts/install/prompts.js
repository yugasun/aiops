"use strict";

/**
 * Interactive prompts (stdlib only).
 * UX aligned with vercel-labs/skills:
 *   multiselect — ↑↓ move, space toggle, ctrl+a all, enter confirm
 *   select      — ↑↓ move, enter confirm
 */

const fs = require("fs");
const readline = require("readline");
const { Writable } = require("stream");
const { c } = require("./console");
const { UNIVERSAL_SKILLS_CONSUMERS } = require("../providers");

const cancelSymbol = Symbol("cancel");

const silentOutput = new Writable({
  write(_chunk, _encoding, callback) {
    callback();
  },
});

function ttyPath() {
  return process.platform === "win32" ? "\\\\.\\CON" : "/dev/tty";
}

/** Open controlling TTY sync — accessSync can succeed when open fails (ENXIO). */
function tryOpenTtyFd() {
  try {
    return fs.openSync(ttyPath(), "r");
  } catch {
    return null;
  }
}

function openPromptInput() {
  if (process.stdin.isTTY) return { input: process.stdin, owned: false };
  const fd = tryOpenTtyFd();
  if (fd === null) return null;
  return { input: fs.createReadStream(null, { fd }), owned: true };
}

function canPrompt() {
  if (process.stdin.isTTY) return true;
  const fd = tryOpenTtyFd();
  if (fd === null) return false;
  try {
    fs.closeSync(fd);
  } catch {
    /* ignore */
  }
  return true;
}

function isCancelled(value) {
  return value === cancelSymbol;
}

function clearRenderedLines(count) {
  if (count <= 0) return;
  process.stdout.write(`\x1b[${count}A\x1b[J`);
}

/**
 * @template T
 * @param {{
 *   message: string,
 *   items: Array<{ value: T, label: string, hint?: string }>,
 *   initialSelected?: T[],
 *   required?: boolean,
 *   lockedSection?: { title: string, items: Array<{ label: string }>, note?: string },
 * }} options
 * @returns {Promise<T[] | typeof cancelSymbol>}
 */
function multiselect(options) {
  const {
    message,
    items,
    initialSelected = [],
    required = true,
    lockedSection = null,
  } = options;

  return new Promise((resolve) => {
    const opened = openPromptInput();
    if (!opened) {
      resolve(cancelSymbol);
      return;
    }

    const rl = readline.createInterface({
      input: opened.input,
      output: silentOutput,
      terminal: false,
    });

    if (opened.input.isTTY && typeof opened.input.setRawMode === "function") {
      opened.input.setRawMode(true);
    }
    readline.emitKeypressEvents(opened.input, rl);

    let cursor = 0;
    const selected = new Set(initialSelected);
    let lastHeight = 0;

    const cleanup = () => {
      opened.input.removeListener("keypress", onKeypress);
      if (opened.input.isTTY && typeof opened.input.setRawMode === "function") {
        opened.input.setRawMode(false);
      }
      rl.close();
      if (opened.owned) opened.input.destroy();
    };

    const render = (state = "active") => {
      const lines = [];
      const icon = state === "active" ? c.green("◆") : state === "cancel" ? c.red("■") : c.green("◇");
      lines.push(`${icon} ${c.bold(message)}`);

      if (state === "active") {
        lines.push(
          `${c.dim("│")} ${c.dim("↑↓ move, space select, ctrl+a all/none, enter confirm")}`
        );
        lines.push(`${c.dim("│")}`);

        if (lockedSection && lockedSection.items.length > 0) {
          lines.push(
            `${c.dim("│")} ${c.dim("──")} ${c.bold(lockedSection.title)} ${c.dim("── always shared")}`
          );
          const preview = lockedSection.items.slice(0, 4).map((it) => it.label);
          const more =
            lockedSection.items.length > 4
              ? ` +${lockedSection.items.length - 4} more`
              : "";
          lines.push(
            `${c.dim("│")} ${c.green("•")} ${c.dim(preview.join(", ") + more)}`
          );
          if (lockedSection.note) {
            lines.push(`${c.dim("│")} ${c.dim(lockedSection.note)}`);
          }
          lines.push(`${c.dim("│")}`);
          lines.push(
            `${c.dim("│")} ${c.dim("──")} ${c.bold("Install agents / hooks for")} ${c.dim("──")}`
          );
        }

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const on = selected.has(item.value);
          const radio = on ? c.green("●") : c.dim("○");
          const label = i === cursor ? c.cyan(c.bold(item.label)) : item.label;
          const hint = item.hint ? c.dim(` ${item.hint}`) : "";
          const prefix = i === cursor ? c.cyan("❯") : " ";
          lines.push(`${c.dim("│")} ${prefix} ${radio} ${label}${hint}`);
        }
        lines.push(`${c.dim("│")}`);
        const labels = items.filter((it) => selected.has(it.value)).map((it) => it.label);
        lines.push(
          labels.length === 0
            ? `${c.dim("│")} ${c.dim("Selected: (none)")}`
            : `${c.dim("│")} ${c.green("Selected:")} ${labels.join(", ")}`
        );
        lines.push(c.dim("└"));
      } else if (state === "submit") {
        const labels = items.filter((it) => selected.has(it.value)).map((it) => it.label);
        lines.push(`${c.dim("│")} ${c.dim(labels.join(", "))}`);
      } else {
        lines.push(`${c.dim("│")} ${c.dim("Cancelled")}`);
      }

      clearRenderedLines(lastHeight);
      process.stdout.write(lines.join("\n") + "\n");
      lastHeight = lines.length;
    };

    const submit = () => {
      if (required && selected.size === 0) return;
      render("submit");
      cleanup();
      resolve(items.filter((it) => selected.has(it.value)).map((it) => it.value));
    };

    const cancel = () => {
      render("cancel");
      cleanup();
      resolve(cancelSymbol);
    };

    const onKeypress = (_str, key) => {
      if (!key) return;

      if (key.name === "return") {
        submit();
        return;
      }
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        cancel();
        return;
      }
      if (key.name === "up") {
        cursor = Math.max(0, cursor - 1);
        render();
        return;
      }
      if (key.name === "down") {
        cursor = Math.min(items.length - 1, cursor + 1);
        render();
        return;
      }
      if (key.name === "space") {
        const value = items[cursor].value;
        if (selected.has(value)) selected.delete(value);
        else selected.add(value);
        render();
        return;
      }
      // Ctrl+A — select all (skills-style convenience; enter only confirms)
      if (key.ctrl && key.name === "a") {
        if (selected.size === items.length) {
          selected.clear();
        } else {
          for (const item of items) selected.add(item.value);
        }
        render();
      }
    };

    opened.input.on("keypress", onKeypress);
    render();
  });
}

/**
 * @template T
 * @param {{
 *   message: string,
 *   options: Array<{ value: T, label: string, hint?: string }>,
 *   initialValue?: T,
 * }} opts
 * @returns {Promise<T | typeof cancelSymbol>}
 */
function select(opts) {
  const { message, options: choices, initialValue } = opts;
  let cursor = Math.max(
    0,
    choices.findIndex((o) => o.value === initialValue)
  );
  if (cursor < 0) cursor = 0;

  return new Promise((resolve) => {
    const opened = openPromptInput();
    if (!opened) {
      resolve(cancelSymbol);
      return;
    }

    const rl = readline.createInterface({
      input: opened.input,
      output: silentOutput,
      terminal: false,
    });

    if (opened.input.isTTY && typeof opened.input.setRawMode === "function") {
      opened.input.setRawMode(true);
    }
    readline.emitKeypressEvents(opened.input, rl);

    let lastHeight = 0;

    const cleanup = () => {
      opened.input.removeListener("keypress", onKeypress);
      if (opened.input.isTTY && typeof opened.input.setRawMode === "function") {
        opened.input.setRawMode(false);
      }
      rl.close();
      if (opened.owned) opened.input.destroy();
    };

    const render = (state = "active") => {
      const lines = [];
      const icon = state === "active" ? c.green("◆") : state === "cancel" ? c.red("■") : c.green("◇");
      lines.push(`${icon} ${c.bold(message)}`);

      if (state === "active") {
        lines.push(`${c.dim("│")} ${c.dim("↑↓ move, enter confirm")}`);
        lines.push(`${c.dim("│")}`);
        for (let i = 0; i < choices.length; i++) {
          const opt = choices[i];
          const on = i === cursor;
          const radio = on ? c.green("●") : c.dim("○");
          const label = on ? c.cyan(c.bold(opt.label)) : opt.label;
          const hint = opt.hint ? c.dim(` — ${opt.hint}`) : "";
          const prefix = on ? c.cyan("❯") : " ";
          lines.push(`${c.dim("│")} ${prefix} ${radio} ${label}${hint}`);
        }
        lines.push(c.dim("└"));
      } else if (state === "submit") {
        lines.push(`${c.dim("│")} ${c.dim(choices[cursor].label)}`);
      } else {
        lines.push(`${c.dim("│")} ${c.dim("Cancelled")}`);
      }

      clearRenderedLines(lastHeight);
      process.stdout.write(lines.join("\n") + "\n");
      lastHeight = lines.length;
    };

    const onKeypress = (_str, key) => {
      if (!key) return;
      if (key.name === "return") {
        render("submit");
        cleanup();
        resolve(choices[cursor].value);
        return;
      }
      if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        render("cancel");
        cleanup();
        resolve(cancelSymbol);
        return;
      }
      if (key.name === "up") {
        cursor = Math.max(0, cursor - 1);
        render();
        return;
      }
      if (key.name === "down") {
        cursor = Math.min(choices.length - 1, cursor + 1);
        render();
      }
    };

    opened.input.on("keypress", onKeypress);
    render();
  });
}

/**
 * @param {Array<{ id: string, label: string, sharedSkills?: boolean, localSkillsDir?: string }>} providers
 * @returns {Promise<typeof providers | typeof cancelSymbol>}
 */
async function promptIdes(providers) {
  const hasShared = providers.some((p) => p.sharedSkills);
  const selectedIds = await multiselect({
    message: "Which IDEs do you want to install to?",
    items: providers.map((p) => ({
      value: p.id,
      label: p.label,
      hint: p.sharedSkills
        ? `(${p.id} · skills → .agents/skills)`
        : `(${p.id} · skills → ${p.localSkillsDir || ".claude/skills"})`,
    })),
    initialSelected: [],
    required: true,
    lockedSection: hasShared
      ? {
          title: "Universal (.agents/skills)",
          items: UNIVERSAL_SKILLS_CONSUMERS.map((label) => ({ label })),
          note: "Project skills install once here when any shared IDE is selected",
        }
      : null,
  });
  if (isCancelled(selectedIds)) return cancelSymbol;
  const idSet = new Set(selectedIds);
  return providers.filter((p) => idSet.has(p.id));
}

/** @returns {Promise<boolean | typeof cancelSymbol>} true = global */
async function promptScope() {
  return select({
    message: "Installation scope",
    initialValue: false,
    options: [
      {
        value: false,
        label: "Project",
        hint: "current directory (committed with your project)",
      },
      {
        value: true,
        label: "Global",
        hint: "home directory (available across all projects)",
      },
    ],
  });
}

/**
 * @param {boolean} [defaultYes=true]
 * @returns {Promise<boolean | typeof cancelSymbol>}
 */
async function promptHooks(defaultYes = true) {
  return select({
    message: "Install SessionStart hooks?",
    initialValue: defaultYes,
    options: [
      {
        value: true,
        label: "Yes",
        hint: "Claude Code / Codex lean injection (merged into hooks.json)",
      },
      {
        value: false,
        label: "No",
        hint: "skills + agents only",
      },
    ],
  });
}

module.exports = {
  canPrompt,
  cancelSymbol,
  isCancelled,
  multiselect,
  select,
  promptIdes,
  promptScope,
  promptHooks,
};
