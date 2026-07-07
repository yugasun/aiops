#!/usr/bin/env node
"use strict";

/**
 * Resolve the git ref to install (GitHub release tag, else latest tag, else main).
 *
 * Usage:
 *   node scripts/resolve-release-ref.js
 *   AIOPS_REF=v1.4.0 node scripts/resolve-release-ref.js
 */

const https = require("https");

const REPO = process.env.AIOPS_REPO || "yugasun/aiops";

function githubGet(pathname) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      {
        hostname: "api.github.com",
        path: `/repos/${REPO}${pathname}`,
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "aiops-installer",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, body });
        });
      }
    );
    req.on("error", reject);
  });
}

async function resolveReleaseRef() {
  if (process.env.AIOPS_REF) {
    return process.env.AIOPS_REF;
  }

  try {
    const release = await githubGet("/releases/latest");
    if (release.status === 200) {
      const tag = JSON.parse(release.body).tag_name;
      if (tag) return tag;
    }

    const tags = await githubGet("/tags?per_page=1");
    if (tags.status === 200) {
      const list = JSON.parse(tags.body);
      if (list[0]?.name) return list[0].name;
    }
  } catch {
    // lean: fall back to main when GitHub API is unavailable
  }

  return "main";
}

if (require.main === module) {
  resolveReleaseRef()
    .then((ref) => {
      process.stdout.write(`${ref}\n`);
    })
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}

module.exports = { resolveReleaseRef, REPO };
