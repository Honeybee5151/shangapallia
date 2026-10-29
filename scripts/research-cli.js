#!/usr/bin/env node
/**
 * Shangapallia AI Research CLI
 * Commands:
 *   node scripts/research-cli.js status   — Display research progress table for Ideas 1–15
 *   node scripts/research-cli.js sync     — Validate data/research.json and regenerate data/research.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const FRAGMENTS_PATH = path.join(ROOT, "data", "fragments.js");
const JSON_PATH = path.join(ROOT, "data", "research.json");
const JS_PATH = path.join(ROOT, "data", "research.js");

function loadFragments() {
  const code = fs.readFileSync(FRAGMENTS_PATH, "utf8");
  const ctx = { window: {} };
  vm.runInNewContext(code, ctx);
  return (ctx.window.IDEA_FRAGMENTS || []).filter((f) => f.id !== "0");
}

function loadResearchJson() {
  if (!fs.existsSync(JSON_PATH)) {
    throw new Error(`Missing ${JSON_PATH}`);
  }
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  return JSON.parse(raw);
}

function validateResearch(data, fragments) {
  if (!data || typeof data !== "object" || typeof data.dossiers !== "object") {
    throw new Error("research.json must contain a top-level 'dossiers' object.");
  }

  const validIds = new Set(fragments.map((f) => String(f.id)));
  for (const [id, dossier] of Object.entries(data.dossiers)) {
    if (!validIds.has(id)) {
      console.warn(`Warning: dossier ID '${id}' is not in researchable fragments 1..15`);
    }
    if (typeof dossier.progress !== "number" || dossier.progress < 0 || dossier.progress > 100) {
      throw new Error(`Dossier '${id}': 'progress' must be a number between 0 and 100.`);
    }
    if (!dossier.stage || typeof dossier.stage !== "string") {
      throw new Error(`Dossier '${id}': 'stage' string is required.`);
    }
    if (!Array.isArray(dossier.milestones)) {
      throw new Error(`Dossier '${id}': 'milestones' array is required.`);
    }
    if (!Array.isArray(dossier.findings)) {
      throw new Error(`Dossier '${id}': 'findings' array is required.`);
    }
    if (!Array.isArray(dossier.citations)) {
      throw new Error(`Dossier '${id}': 'citations' array is required.`);
    }
    if (!Array.isArray(dossier.nextSteps)) {
      throw new Error(`Dossier '${id}': 'nextSteps' array is required.`);
    }
  }
}

function syncResearch() {
  const fragments = loadFragments();
  const data = loadResearchJson();
  validateResearch(data, fragments);

  // Format research.json cleanly
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");

  // Mirror to data/research.js for instant local (file://) & static loading
  const banner =
    "/**\n" +
    " * Auto-generated from data/research.json via `node scripts/research-cli.js sync`.\n" +
    " * AI Agents: edit data/research.json and run `node scripts/research-cli.js sync`.\n" +
    " */\n";
  const jsOut = `${banner}window.IDEA_RESEARCH = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(JS_PATH, jsOut, "utf8");

  console.log("Validated data/research.json and synced data/research.js successfully.");
}

function printStatus() {
  const fragments = loadFragments();
  const data = loadResearchJson();
  const dossiers = data.dossiers || {};

  console.log("\nShangapallia — Idea Research Pipeline\n" + "=".repeat(72));
  let totalPct = 0;
  let activeCount = 0;

  for (const frag of fragments) {
    const d = dossiers[frag.id];
    const pct = d ? d.progress : 0;
    const stage = d ? d.stage : "Queued";
    totalPct += pct;
    if (pct > 0) activeCount++;

    const filled = Math.round(pct / 10);
    const bar = "#".repeat(filled) + "-".repeat(10 - filled);
    const idCol = `#${frag.id}`.padEnd(4);
    const pctCol = `${pct}%`.padStart(4);
    const stageCol = stage.padEnd(24).slice(0, 24);
    console.log(`${idCol} [${bar}] ${pctCol}  ${stageCol}  ${frag.title}`);
  }

  const avg = fragments.length ? (totalPct / fragments.length).toFixed(1) : "0.0";
  console.log("-".repeat(72));
  console.log(`Active dossiers: ${activeCount}/${fragments.length} | Overall pipeline progress: ${avg}%\n`);
}

const cmd = process.argv[2] || "status";
if (cmd === "sync") {
  syncResearch();
  printStatus();
} else if (cmd === "status") {
  printStatus();
} else {
  console.error(`Unknown command '${cmd}'. Use 'status' or 'sync'.`);
  process.exit(1);
}
