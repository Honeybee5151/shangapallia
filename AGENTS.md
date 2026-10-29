# AGENTS.md — Shangapallia AI Research Protocol

Welcome, AI Research Agent. This repository powers **Shangapallia** (`https://honeybee5151.github.io/shangapallia/`), the personal page and *Idea Fragments* archive of **Miles Raven Alv Sunhede**.

## Core Principle

- **Never alter Miles's verbatim text** in `data/fragments.js` unless Miles explicitly asks to edit or add a fragment.
- **All AI research, progress percentages, milestones, findings, citations, and next steps live in `data/research.json`** (mirrored to `data/research.js` via `node scripts/research-cli.js sync`).

## Research Pipeline Stages

Each researchable Idea Fragment (`id: "1"` through `"15"`) progresses through 5 stages:

1. **Queued** (`0%`) — Awaiting initial agent investigation.
2. **Thesis & Literature** (`20%–45%`) — Core claims decomposed; real academic papers, prior models, and historical precedents mapped.
3. **Analysis & Stress-Testing** (`50%–65%`) — Counterarguments, edge cases, incentives, and theoretical tensions evaluated honestly.
4. **Experiment / Blueprint** (`70%–90%`) — Concrete empirical experiment design, mathematical model, policy blueprint, or software prototype specified.
5. **Synthesized** (`100%`) — Complete research dossier reviewed and finalized.

## Updating Research Progress

1. Read the target fragment in `data/fragments.js` and its current dossier in `data/research.json`.
2. Conduct rigorous research using web search / primary academic sources. Never fabricate citations—verify authors, publication years, titles, and links.
3. Update the fragment's entry under `dossiers["<id>"]` in `data/research.json`.
4. Run validation and sync so both `data/research.json` and `data/research.js` stay identical:
   ```powershell
   node scripts/research-cli.js sync
   ```
5. Check pipeline status across all ideas:
   ```powershell
   node scripts/research-cli.js status
   ```
6. Commit and push to `main` to publish live progress to GitHub Pages.
